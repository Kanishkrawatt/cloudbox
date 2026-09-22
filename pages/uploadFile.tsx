import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { collection, doc, updateDoc, addDoc, increment } from "firebase/firestore";
import Layout from "@/components/layouts/baseLayout";
import Icon from "@/components/ui/icons";
import db from "@/firebase/firestore";
import { useAuth } from "../utils/contexts/auth";
import { useTheme } from "../utils/contexts/theme";
import { TempFilesData } from "./smartshare";
import { uploadToCloudinary, cloudinaryConfigured } from "@/utils/cloudinary";
import { computePhash, extractText } from "@/utils/imageMetaBrowser";
import { tagsFor } from "@/utils/imageMeta";

type Folder = { name: string; id: string };

/** Parallel uploads; Cloudinary handles many, the browser's connection pool is the real cap. */
const CONCURRENCY = 3;

/** Runs `fn` over `items` with at most `limit` in flight. */
const pool = async <T,>(items: T[], limit: number, fn: (item: T) => Promise<void>) => {
  let next = 0;
  const worker = async () => {
    while (next < items.length) await fn(items[next++]);
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
};

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
      phash?: string
    ) => {
      // An empty folderId would produce "Folders//Images", not a valid path.
      const path = folderId
        ? `User/${user?.uid}/Folders/${folderId}/${kindOf(file)}`
        : `User/${user?.uid}/${kindOf(file)}`;
      return addDoc(collection(db, path), {
        name: newName,
        size: file.size,
        location: "Home",
        type: file.type,
        url: upload.url,
        publicId: upload.publicId,
        resourceType: upload.resourceType,
        date: new Date().toDateString(),
        tags: tagsFor({ type: file.type, folder: folderName || undefined }),
        // Firestore rejects undefined, so only set what we have.
        ...(phash ? { phash } : {}),
      });
    },
    [user?.uid, folderName]
  );

  // OCR runs after the row exists and patches text/tags in when it finishes,
  // so a slow read never holds up the upload. One at a time: tesseract is
  // CPU-bound and several workers just fight each other.
  const [reading, setReading] = useState(0);
  const ocrQueue = useRef(Promise.resolve());
  const readTextLater = useCallback(
    (file: File, ref: { path: string }) => {
      setReading((n) => n + 1);
      ocrQueue.current = ocrQueue.current
        .then(async () => {
          const text = await extractText(file).catch(() => undefined);
          if (!text) return;
          await updateDoc(doc(db, ref.path), {
            text,
            tags: tagsFor({ type: file.type, folder: folderName || undefined, text }),
          });
        })
        .catch(() => undefined)
        .finally(() => setReading((n) => n - 1));
    },
    [folderName]
  );

  // Atomic increments, so parallel uploads cannot overwrite each other's totals.
  const chargeQuota = useCallback(
    (size: number) =>
      updateDoc(doc(db, "User", `${user?.uid}`), {
        "Storage.Used": increment(mb(size)),
        "Storage.Free": increment(-mb(size)),
      }),
    [user?.uid]
  );

  const uploadOne = useCallback(
    async (file: File, newName: string, index: number, folderId: string) => {
      const idToken = await user?.getIdToken();
      if (!idToken) throw new Error("Your session expired. Sign in again.");
      const folder = folderId
        ? `Folders/${folderId}/${kindOf(file)}`
        : kindOf(file);

      // The hash takes milliseconds; compute it while the bytes are in flight.
      const isImage = file.type.startsWith("image/");
      const phashPromise = isImage ? computePhash(file).catch(() => undefined) : Promise.resolve(undefined);

      const upload = await uploadToCloudinary({
        file,
        idToken,
        folder,
        fileName: newName,
        onProgress: (pct) =>
          setProgress((prev) => prev.map((p, i) => (i === index ? pct : p))),
      });

      const ref = await writeMetadata(file, upload, newName, folderId, await phashPromise);
      await chargeQuota(file.size);
      setProgress((prev) => prev.map((p, i) => (i === index ? 100 : p)));
      setQueue((prev) =>
        prev.map((item, i) => (i === index ? { ...item, status: "success" } : item))
      );
      if (isImage) readTextLater(file, ref);
    },
    [user, writeMetadata, chargeQuota, readTextLater]
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

    const pending = queue.map((item, i) => i).filter((i) => queue[i].status !== "success");
    const failures: string[] = [];
    // Quota is charged per file only after its bytes landed, so a failed
    // upload never eats space.
    await pool(pending, CONCURRENCY, async (i) => {
      try {
        await uploadOne(queue[i].file, names[i], i, folderId);
      } catch (err: any) {
        failures.push(`${names[i]}: ${err?.message ?? "failed"}`);
        setQueue((prev) => prev.map((item, k) => (k === i ? { ...item, status: "error" } : item)));
      }
    });
    if (failures.length) setError(failures.join(" · "));
    await refreshQuota();
    setUploading(false);
  };

  const done = queue.length > 0 && queue.every((item) => item.status === "success");
  const doneCount = queue.filter((item) => item.status === "success").length;
  const imageCount = queue.filter((item) => item.status === "success" && item.file.type.startsWith("image/")).length;

  const clear = () => {
    queue.forEach((item) => URL.revokeObjectURL(item.url));
    setQueue([]);
    setNames([]);
    setProgress([]);
    setError(null);
  };

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

        {reading > 0 && (
          <p className="mt-3 text-[12px]" style={{ color: theme.muted }}>
            Reading text from {reading} image{reading === 1 ? "" : "s"} in the background so you can search
            by what&apos;s in them. Keep this tab open until it finishes.
          </p>
        )}

        {done && !uploading && (
          <div
            className="mt-3 flex flex-wrap items-center gap-3 rounded-xl px-4 py-3"
            role="status"
            style={{ backgroundColor: theme.secondary, border: `1px solid ${theme.accent}` }}
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.accent, color: theme.primary }}
            >
              <Icon name="check" size={15} strokeWidth={2.4} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium">
                {doneCount} file{doneCount === 1 ? "" : "s"} uploaded
                {folderName ? ` to ${folderName}` : ""}
              </p>
              <p className="text-[12px]" style={{ color: theme.muted }}>
                {reading > 0
                  ? `Still reading text from ${reading} image${reading === 1 ? "" : "s"} for search.`
                  : "Ready to view."}
              </p>
            </div>
            <Link
              href={folderName ? `/folder?name=${encodeURIComponent(folderName)}` : imageCount > 0 ? "/images" : "/files"}
              className="btn h-8 text-[12px]"
            >
              View
            </Link>
            <button type="button" onClick={clear} className="btn btn-primary h-8 text-[12px]">
              Upload more
            </button>
          </div>
        )}

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
                        : item.status === "error"
                        ? "Failed"
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
