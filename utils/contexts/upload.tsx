import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { collection, doc, updateDoc, addDoc, increment } from "firebase/firestore";
import db from "@/firebase/firestore";
import { useAuth } from "@/utils/contexts/auth";
import { uploadToCloudinary, cloudinaryConfigured } from "@/utils/cloudinary";
import { computePhash, extractText } from "@/utils/imageMetaBrowser";
import { tagsFor } from "@/utils/imageMeta";

/**
 * Upload queue that lives above the page tree, so uploads keep running while
 * the user browses the rest of the app. A tab close still kills them (there is
 * no widely-supported way around that without a native app), so the provider
 * warns on `beforeunload` while anything is in flight.
 */
export type QueueItem = {
  file: File;
  url: string;
  name: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
};

export type Folder = { name: string; id: string };

/** Parallel uploads. Browsers allow ~6 connections per host; Cloudinary does not mind. */
const CONCURRENCY = 6;

const pool = async <T,>(items: T[], limit: number, fn: (item: T) => Promise<void>) => {
  let next = 0;
  const worker = async () => {
    while (next < items.length) await fn(items[next++]);
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
};

const mb = (bytes: number) => bytes / 1024 ** 2;
const kindOf = (file: File) => (file.type.startsWith("image/") ? "Images" : "Files");

type UploadState = {
  queue: QueueItem[];
  uploading: boolean;
  reading: number;
  error: string | null;
  folders: Folder[];
  folderName: string;
  quota: { used: number; free: number; total: number };
  setFolderName: (name: string) => void;
  addFiles: (files: FileList | File[]) => void;
  removeAt: (index: number) => void;
  rename: (index: number, name: string) => void;
  start: () => Promise<void>;
  clear: () => void;
  refreshQuota: () => Promise<void>;
};

const UploadContext = createContext<UploadState | null>(null);

export const useUpload = () => {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error("useUpload must be used inside UploadProvider");
  return ctx;
};

export const UploadProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [reading, setReading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderName, setFolderName] = useState("");
  const [quota, setQuota] = useState({ used: 0, free: 0, total: 0 });
  const ocrQueue = useRef(Promise.resolve());

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

  // Leaving the site mid-upload loses the in-flight files; ask first.
  useEffect(() => {
    if (!uploading && reading === 0) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [uploading, reading]);

  const patch = (index: number, changes: Partial<QueueItem>) =>
    setQueue((prev) => prev.map((item, i) => (i === index ? { ...item, ...changes } : item)));

  const addFiles = useCallback((list: FileList | File[]) => {
    const incoming = Array.from(list);
    if (!incoming.length) return;
    setError(null);
    setQueue((prev) => [
      ...prev,
      ...incoming.map<QueueItem>((file) => ({
        file,
        url: URL.createObjectURL(file),
        name: file.name.split(".").slice(0, -1).join(".") || file.name,
        progress: 0,
        status: "pending",
      })),
    ]);
  }, []);

  const removeAt = useCallback((index: number) => {
    setQueue((prev) => {
      const item = prev[index];
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const rename = useCallback((index: number, name: string) => patch(index, { name }), []);

  const clear = useCallback(() => {
    setQueue((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.url));
      return [];
    });
    setError(null);
  }, []);

  // OCR runs after the row exists and patches text/tags in when it finishes,
  // so a slow read never holds up the upload. One at a time: tesseract is
  // CPU-bound and several workers just fight each other.
  const readTextLater = useCallback((file: File, path: string, folder: string) => {
    setReading((n) => n + 1);
    ocrQueue.current = ocrQueue.current
      .then(async () => {
        const text = await extractText(file).catch(() => undefined);
        if (!text) return;
        await updateDoc(doc(db, path), {
          text,
          tags: tagsFor({ type: file.type, folder: folder || undefined, text }),
        });
      })
      .catch(() => undefined)
      .finally(() => setReading((n) => n - 1));
  }, []);

  const uploadOne = useCallback(
    async (item: QueueItem, index: number, folderId: string, folder: string) => {
      const idToken = await user?.getIdToken();
      if (!idToken) throw new Error("Your session expired. Sign in again.");
      const { file } = item;
      const kind = kindOf(file);
      const isImage = kind === "Images";

      patch(index, { status: "uploading" });
      // The hash takes milliseconds; compute it while the bytes are in flight.
      const phashPromise = isImage ? computePhash(file).catch(() => undefined) : Promise.resolve(undefined);

      const upload = await uploadToCloudinary({
        file,
        idToken,
        folder: folderId ? `Folders/${folderId}/${kind}` : kind,
        fileName: item.name,
        onProgress: (pct) => patch(index, { progress: pct }),
      });

      const path = folderId ? `User/${user?.uid}/Folders/${folderId}/${kind}` : `User/${user?.uid}/${kind}`;
      const phash = await phashPromise;
      const ref = await addDoc(collection(db, path), {
        name: item.name,
        size: file.size,
        location: "Home",
        type: file.type,
        url: upload.url,
        publicId: upload.publicId,
        resourceType: upload.resourceType,
        date: new Date().toDateString(),
        tags: tagsFor({ type: file.type, folder: folder || undefined }),
        ...(phash ? { phash } : {}),
      });
      // Atomic increments, so parallel uploads cannot overwrite each other's totals.
      await updateDoc(doc(db, "User", `${user?.uid}`), {
        "Storage.Used": increment(mb(file.size)),
        "Storage.Free": increment(-mb(file.size)),
      });
      patch(index, { status: "success", progress: 100 });
      if (isImage) readTextLater(file, ref.path, folder);
    },
    [user, readTextLater]
  );

  const start = useCallback(async () => {
    if (uploading) return;
    const pending = queue.map((item, i) => i).filter((i) => queue[i].status !== "success");
    if (!pending.length) return;
    if (!cloudinaryConfigured()) {
      setError(
        "Uploads are not configured yet: set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
      );
      return;
    }
    const pendingSize = pending.reduce((sum, i) => sum + queue[i].file.size, 0);
    if (mb(pendingSize) > quota.free) {
      setError(`Not enough space: need ${mb(pendingSize).toFixed(2)} MB, ${quota.free.toFixed(2)} MB free.`);
      return;
    }
    setError(null);
    setUploading(true);
    const folderId = folders.find((f) => f.name === folderName)?.id ?? "";
    const failures: string[] = [];
    await pool(pending, CONCURRENCY, async (i) => {
      try {
        await uploadOne(queue[i], i, folderId, folderName);
      } catch (err: any) {
        failures.push(`${queue[i].name}: ${err?.message ?? "failed"}`);
        patch(i, { status: "error", error: err?.message });
      }
    });
    if (failures.length) setError(failures.join(" · "));
    await refreshQuota();
    setUploading(false);
  }, [uploading, queue, quota.free, folders, folderName, uploadOne, refreshQuota]);

  const value = useMemo<UploadState>(
    () => ({
      queue,
      uploading,
      reading,
      error,
      folders,
      folderName,
      quota,
      setFolderName,
      addFiles,
      removeAt,
      rename,
      start,
      clear,
      refreshQuota,
    }),
    [queue, uploading, reading, error, folders, folderName, quota, addFiles, removeAt, rename, start, clear, refreshQuota]
  );

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
};

export default UploadProvider;
