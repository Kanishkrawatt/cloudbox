import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { collection, doc, updateDoc, addDoc, getDoc } from "firebase/firestore";
import Layout from "@/components/layouts/baseLayout";
import Icon from "@/components/ui/icons";
import db from "@/firebase/firestore";
import { useAuth } from "../utils/contexts/auth";
import { useTheme } from "../utils/contexts/theme";
import { TempFilesData } from "./smartshare";
import { uploadToCloudinary, cloudinaryConfigured } from "@/utils/cloudinary";
import { analyseImage, type ImageMeta } from "@/utils/imageMetaBrowser";

type Folder = { name: string; id: string };

const mb = (bytes: number) => bytes / 1024 ** 2;
const prettySize = (bytes: number) =>
  bytes <= 0
    ? "0 KB"
    : bytes >= 1024 ** 2
    ? `${mb(bytes).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export function UploadFile() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [queue, setQueue] = useState<TempFilesData[]>([]);
  const [names, setNames] = useState<string[]>([]);
  const [progress, setProgress] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderName, setFolderName] = useState<string>("");
  const [showFolders, setShowFolders] = useState(false);
  const [quota, setQuota] = useState({ used: 0, free: 0, total: 0 });

  const refreshQuota = useCallback(async () => {
    if (!user?.uid) return;
    const api = await axios.post("/api/storageInfo", { uid: user.uid });
    setQuota(api.data);
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    axios
      .post("/api/getFolders", { uid: user.uid })
      .then((res) => setFolders(res.data?.data ?? []))
      .catch(() => setFolders([]));
    refreshQuota();
  }, [user?.uid, refreshQuota]);

  const kindOf = (file: File) => (file.type.startsWith("image/") ? "Images" : "Files");

  const addFiles = (list: FileList | File[]) => {
    const incoming = Array.from(list);
    if (!incoming.length) return;
    setError(null);
    setQueue((prev) => [
      ...prev,
      ...incoming.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        status: "pending",
      })),
    ]);
    setNames((prev) => [
      ...prev,
      ...incoming.map((file) => file.name.split(".").slice(0, -1).join(".") || file.name),
    ]);
    setProgress((prev) => [...prev, ...incoming.map(() => 0)]);
  };

  const removeAt = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
    setNames((prev) => prev.filter((_, i) => i !== index));
    setProgress((prev) => prev.filter((_, i) => i !== index));
  };

  const writeMetadata = useCallback(
    async (
      file: File,
      upload: { url: string; publicId: string; resourceType: string },
      newName: string,
      folderId: string,
      meta?: ImageMeta
    ) => {
      // An empty folderId would produce "Folders//Images", not a valid path.
      const path = folderId
        ? `User/${user?.uid}/Folders/${folderId}/${kindOf(file)}`
        : `User/${user?.uid}/${kindOf(file)}`;
      await addDoc(collection(db, path), {
        name: newName,
        size: file.size,
        location: "Home",
        type: file.type,
        url: upload.url,
        publicId: upload.publicId,
        resourceType: upload.resourceType,
        date: new Date().toDateString(),
        // Firestore rejects undefined, so only set what we have.
        ...(meta?.phash ? { phash: meta.phash } : {}),
        ...(meta?.text ? { text: meta.text } : {}),
        ...(meta?.tags?.length ? { tags: meta.tags } : {}),
      });
    },
    [user?.uid]
  );

  const chargeQuota = useCallback(
    async (size: number) => {
      const userDocRef = doc(db, "User", `${user?.uid}`);
      const snap = await getDoc(userDocRef);
      const Storage = snap.data()?.Storage;
      if (!Storage) return;
      await updateDoc(userDocRef, {
        Storage: {
          ...Storage,
          Used: Storage.Used + mb(size),
          Free: Storage.Free - mb(size),
        },
      });
    },
    [user?.uid]
  );

  const uploadOne = useCallback(
    async (file: File, newName: string, index: number, folderId: string) => {
      const idToken = await user?.getIdToken();
      if (!idToken) throw new Error("Your session expired. Sign in again.");
      const folder = folderId
        ? `Folders/${folderId}/${kindOf(file)}`
        : kindOf(file);

      // Hash + OCR run locally while the bytes upload; both are best-effort.
      const metaPromise = file.type.startsWith("image/")
        ? analyseImage(file, { folder: folderName || undefined })
        : Promise.resolve(undefined);

      const upload = await uploadToCloudinary({
        file,
        idToken,
        folder,
        fileName: newName,
        onProgress: (pct) =>
          setProgress((prev) => prev.map((p, i) => (i === index ? pct : p))),
      });

      setProgress((prev) => prev.map((p, i) => (i === index ? 100 : p)));
      setQueue((prev) =>
        prev.map((item, i) => (i === index ? { ...item, status: "analysing" } : item))
      );
      await writeMetadata(file, upload, newName, folderId, await metaPromise);
      setQueue((prev) =>
        prev.map((item, i) => (i === index ? { ...item, status: "success" } : item))
      );
    },
    [user, writeMetadata, folderName]
  );

  const pendingSize = queue
    .filter((item) => item.status !== "success")
    .reduce((sum, item) => sum + item.file.size, 0);

  const upload = async () => {
    if (!queue.length || uploading) return;
    if (!cloudinaryConfigured()) {
      setError(
        "Uploads are not configured yet: set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
      );
      return;
    }
    if (mb(pendingSize) > quota.free) {
      setError(
        `Not enough space: need ${mb(pendingSize).toFixed(2)} MB, ${quota.free.toFixed(2)} MB free.`
      );
      return;
    }
    setError(null);
    setUploading(true);
    const folderId = folders.find((f) => f.name === folderName)?.id ?? "";

    // Sequential: chargeQuota is a read-modify-write on one document, so
    // parallel uploads used to overwrite each other's totals.
    try {
      for (let i = 0; i < queue.length; i++) {
        if (queue[i].status === "success") continue;
        // Charge only after the bytes actually landed, or a failed upload
        // (bad rules, no Blaze plan, lost connection) still eats quota.
        await uploadOne(queue[i].file, names[i], i, folderId);
        await chargeQuota(queue[i].file.size);
      }
      await refreshQuota();
    } catch (err: any) {
      setError(err?.message ?? "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const done = queue.length > 0 && queue.every((item) => item.status === "success");

  return (
    <Layout title="Upload">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl px-6 py-12 text-center transition-colors"
          style={{
            border: `1px dashed ${dragging ? theme.accent : theme.border}`,
            backgroundColor: dragging ? theme.secondary : "transparent",
            color: theme.muted,
          }}
        >
          <Icon name="upload" size={22} />
          <p className="text-[13px]" style={{ color: theme.text }}>
            Drop files here, or click to browse
          </p>
          <p className="text-[12px]">Images go to Images, everything else to Files</p>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            onChange={(e) => {
              addFiles(e.target.files ?? []);
              e.target.value = "";
            }}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              type="button"
              className="btn h-9 text-[13px]"
              onClick={() => setShowFolders((v) => !v)}
              aria-expanded={showFolders}
            >
              <Icon name="folder" size={15} />
              {folderName || "No folder"}
              <Icon name="chevronDown" size={14} />
            </button>
            {showFolders && (
              <div className="menu absolute left-0 top-11 z-40 max-h-56 w-56 overflow-y-auto p-1.5">
                <button
                  type="button"
                  className="menu-item text-[13px]"
                  onClick={() => {
                    setFolderName("");
                    setShowFolders(false);
                  }}
                >
                  No folder
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    className="menu-item text-[13px]"
                    onClick={() => {
                      setFolderName(folder.name);
                      setShowFolders(false);
                    }}
                  >
                    <Icon name="folder" size={15} />
                    <span className="truncate">{folder.name}</span>
                  </button>
                ))}
                {folders.length === 0 && (
                  <p className="px-2.5 py-2 text-[12px]" style={{ color: theme.muted }}>
                    No folders yet.
                  </p>
                )}
              </div>
            )}
          </div>

          <span className="text-[12px]" style={{ color: theme.muted }}>
            {queue.length
              ? `${prettySize(pendingSize)} queued · `
              : "Nothing queued · "}
            {quota.free.toFixed(1)} MB free
          </span>

          <button
            type="button"
            onClick={upload}
            disabled={!queue.length || uploading || done}
            className="btn btn-primary ml-auto h-9 text-[13px]"
          >
            {uploading ? "Uploading..." : done ? "Uploaded" : `Upload ${queue.length || ""}`}
          </button>
        </div>

        {error && (
          <p
            className="mt-3 rounded-lg px-3 py-2 text-[13px]"
            role="alert"
            style={{ backgroundColor: theme.secondary, color: "#e5484d" }}
          >
            {error}
          </p>
        )}

        {queue.length > 0 && (
          <div
            className="mt-5 overflow-hidden rounded-xl"
            style={{ border: `1px solid ${theme.border}` }}
          >
            {queue.map((item, index) => (
              <div
                key={item.url}
                className="flex items-center gap-3 px-3 py-2.5"
                style={{ borderTop: index ? `1px solid ${theme.border}` : undefined }}
              >
                <span
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                  style={{ backgroundColor: theme.secondary, color: theme.muted }}
                >
                  {item.file.type.startsWith("image/") ? (
                    // Plain <img>: next/image cannot load blob: object URLs.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Icon name="file" size={16} />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <input
                    type="text"
                    value={names[index] ?? ""}
                    onChange={(e) =>
                      setNames((prev) => prev.map((n, i) => (i === index ? e.target.value : n)))
                    }
                    aria-label="File name"
                    className="w-full bg-transparent text-[13px] outline-none"
                  />
                  <div className="mt-1 flex items-center gap-2">
                    <div
                      className="h-1 flex-1 overflow-hidden rounded-full"
                      style={{ backgroundColor: theme.border }}
                    >
                      <div
                        className="h-full rounded-full transition-[width]"
                        style={{
                          width: `${progress[index] ?? 0}%`,
                          backgroundColor: theme.accent,
                        }}
                      />
                    </div>
                    <span className="shrink-0 text-[11px]" style={{ color: theme.muted }}>
                      {item.status === "success"
                        ? "Done"
                        : item.status === "analysing"
                        ? "Reading text…"
                        : progress[index]
                        ? `${progress[index]}%`
                        : prettySize(item.file.size)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  aria-label="Remove from queue"
                  className="shrink-0 rounded-md p-1.5"
                  style={{ color: theme.muted }}
                >
                  <Icon name="close" size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default UploadFile;
