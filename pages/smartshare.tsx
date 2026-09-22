import React, { useCallback, useEffect, useRef, useState } from "react";
import { addDoc, collection, setDoc, doc } from "firebase/firestore";
import Layout from "@/components/layouts/baseLayout";
import Icon from "@/components/ui/icons";
import db from "@/firebase/firestore";
import { useAuth } from "../utils/contexts/auth";
import { useTheme } from "../utils/contexts/theme";
import { uploadToCloudinary, cloudinaryConfigured } from "@/utils/cloudinary";
import { sharePath, absoluteShareUrl } from "@/utils/shareLink";
import FaceSortToggle, { useFaceSort, THRESHOLDS } from "@/components/ui/faceSort";

export interface TempFilesData {
  file: File;
  url: string;
  status?: string;
}

const EXPIRY = [
  { label: "1 day", days: 1 },
  { label: "2 days", days: 2 },
  { label: "5 days", days: 5 },
  { label: "1 week", days: 7 },
];

type ShareLink = {
  id: string;
  path: string;
  time: number;
  name: string;
  date: string;
  expiresOn: string | null;
  expired: boolean;
  stats: { opens: number; downloads: number };
  allowUploads: boolean;
  burnAfterDownload: boolean;
  burnedAt: string | null;
  extendRequested: boolean;
};

/** Files handed over from another page (Memories, People) via sessionStorage. */
export const PREFILL_KEY = "cloudbox:share-prefill";
export type Prefill = { name: string; files: { url: string; name: string; type: string }[] };

const Toggle = ({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  hint: string;
}) => {
  const { theme } = useTheme();
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5" style={{ border: `1px solid ${theme.border}` }}>
      <input type="checkbox" checked={checked} onChange={onChange} className="mt-0.5 accent-current" style={{ color: theme.accent }} />
      <span className="min-w-0">
        <span className="block text-[13px]">{label}</span>
        <span className="block text-[12px]" style={{ color: theme.muted }}>{hint}</span>
      </span>
    </label>
  );
};

function Smartshare() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const nameRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [days, setDays] = useState<number | null>(null);
  const [showExpiry, setShowExpiry] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [newPath, setNewPath] = useState("");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [copiedIndex, setCopiedIndex] = useState(-1);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [sortByFace, setSortByFace] = useState(false);
  const faceSort = useFaceSort();
  const [faceThreshold, setFaceThreshold] = useState(THRESHOLDS[1].value);
  const [allowUploads, setAllowUploads] = useState(false);
  const [burnAfterDownload, setBurnAfterDownload] = useState(false);
  const [prefilling, setPrefilling] = useState(false);

  // Another page can hand us a set of existing files to share; pull them back
  // down as blobs so the normal upload path applies unchanged.
  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(PREFILL_KEY);
      sessionStorage.removeItem(PREFILL_KEY);
    } catch {
      return;
    }
    if (!raw) return;
    const prefill: Prefill = JSON.parse(raw);
    setPrefilling(true);
    Promise.all(
      prefill.files.map(async (f) => {
        const blob = await fetch(f.url).then((r) => r.blob());
        return new File([blob], f.name, { type: f.type || blob.type });
      })
    )
      .then((picked) => {
        setFiles((prev) => [...prev, ...picked]);
        if (nameRef.current && !nameRef.current.value) nameRef.current.value = prefill.name;
      })
      .catch(() => setError("Could not load those files. Add them by hand."))
      .finally(() => setPrefilling(false));
  }, []);

  // Read on the client only: the host is not known while rendering on the server.
  useEffect(() => setOrigin(window.location.origin), []);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const loadLinks = useCallback(async () => {
    if (!user?.uid) return;
    const res = await fetch("/api/getSmartShareLinks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: user.uid }),
    });
    const json = await res.json();
    setLinks(json.data ?? []);
    setLoadingLinks(false);
  }, [user?.uid]);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const shareName = nameRef.current?.value.trim();
    if (!files.length) return setError("Pick at least one file to share.");
    if (!shareName) return setError("Give this share a name.");
    if (!days) return setError("Choose how long the link should live.");
    if (!cloudinaryConfigured()) {
      return setError(
        "Uploads are not configured yet: set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
      );
    }

    setError(null);
    setBusy(true);
    setProgress(0);
    setNewPath("");

    // One id for the whole share; it used to be regenerated on every render.
    const id = Math.random().toString(36).substring(2, 9);
    const path = sharePath(id, `${user?.uid}`);

    try {
      const idToken = await user?.getIdToken();
      if (!idToken) throw new Error("Your session expired. Sign in again.");

      await setDoc(doc(db, `User/${user?.uid}/Smartshare/${id}`), {
        name: shareName,
        time: days,
        date: new Date().toDateString(),
        // Path only: an absolute URL here would pin the share to whatever host
        // happened to create it.
        path,
        sortByFace,
        // Recipients see a banner while this is not "done".
        faceStatus: sortByFace ? "running" : null,
        allowUploads,
        burnAfterDownload,
        stats: { opens: 0, downloads: 0 },
      });

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const upload = await uploadToCloudinary({
          file,
          idToken,
          folder: `Smartshare/${id}`,
          fileName: file.name.split(".").slice(0, -1).join(".") || file.name,
          onProgress: (pct) =>
            setProgress(Math.round(((i + pct / 100) / files.length) * 100)),
        });
        // Each upload records its own file; this used to always write files[0].
        await addDoc(collection(db, `User/${user?.uid}/Smartshare/${id}/files`), {
          name: file.name,
          size: file.size,
          type: file.type,
          url: upload.url,
          publicId: upload.publicId,
          resourceType: upload.resourceType,
        });
      }

      setNewPath(path);
      if (sortByFace) faceSort.run(id, faceThreshold);
      setFiles([]);
      if (nameRef.current) nameRef.current.value = "";
      setDays(null);
      await loadLinks();
    } catch (err: any) {
      setError(err?.message ?? "Could not create the share.");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  const updateShare = async (shareId: string, patch: Record<string, number | boolean>) => {
    const idToken = await user?.getIdToken();
    await fetch("/api/smartshare/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, shareId, ...patch }),
    });
    await loadLinks();
  };

  const removeShare = async (shareId: string) => {
    const idToken = await user?.getIdToken();
    await fetch("/api/deleteSmartShare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, shareId }),
    });
    await loadLinks();
  };

  const copy = (text: string, index = -1) => {
    navigator.clipboard.writeText(text);
    if (index >= 0) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(-1), 2500);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <Layout title="Smart Share">
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-2">
        <section>
          <h2 className="section-label mb-3">New share</h2>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
            }}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl px-6 py-10 text-center"
            style={{
              border: `1px dashed ${dragging ? theme.accent : theme.border}`,
              backgroundColor: dragging ? theme.secondary : "transparent",
              color: theme.muted,
            }}
          >
            <Icon name="share" size={20} />
            <p className="text-[13px]" style={{ color: theme.text }}>
              Drop files here, or click to browse
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                // Copy the FileList out now: the state updater runs later, and
                // by then `value = ""` has already emptied e.target.files, so
                // picking files through the dialog added nothing.
                const picked = Array.from(e.target.files ?? []);
                e.target.value = "";
                setFiles((prev) => [...prev, ...picked]);
              }}
            />
          </div>

          {previews.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {previews.map((url, i) => (
                <span
                  key={url}
                  className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                  style={{ border: `1px solid ${theme.border}`, color: theme.muted }}
                >
                  {files[i]?.type.startsWith("image/") ? (
                    // Plain <img>: next/image cannot load blob: object URLs,
                    // which is what a locally picked file gives us.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Icon name="file" size={18} />
                  )}
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => setFiles((prev) => prev.filter((_, k) => k !== i))}
                    className="absolute right-1 top-1 rounded p-0.5"
                    style={{ backgroundColor: theme.primary, color: theme.muted }}
                  >
                    <Icon name="close" size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
            <input
              ref={nameRef}
              type="text"
              placeholder="Share name"
              className="field h-10 text-[13px]"
              style={{ backgroundColor: theme.secondary, borderColor: theme.border }}
            />

            <FaceSortToggle
              enabled={sortByFace}
              onToggle={() => setSortByFace((v) => !v)}
              state={faceSort.state}
              message={faceSort.message}
              threshold={faceThreshold}
              onThreshold={setFaceThreshold}
            />

            {/* Rarely used; kept out of the first fold. */}
            <details className="group rounded-lg" style={{ border: `1px solid ${theme.border}` }}>
              <summary
                className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-[13px]"
                style={{ color: theme.muted }}
              >
                <Icon name="chevronDown" size={14} className="transition-transform group-open:rotate-180" />
                More options
                {(allowUploads || burnAfterDownload) && (
                  <span className="ml-auto text-[11px]" style={{ color: theme.accent }}>
                    {[allowUploads && "guests can add", burnAfterDownload && "one-shot"].filter(Boolean).join(" · ")}
                  </span>
                )}
              </summary>
              <div className="flex flex-col gap-2 px-3 pb-3">
                <Toggle
                  checked={allowUploads}
                  onChange={() => setAllowUploads((v) => !v)}
                  label="Let recipients add files"
                  hint="Anyone with the link can drop their own photos into this share."
                />
                <Toggle
                  checked={burnAfterDownload}
                  onChange={() => setBurnAfterDownload((v) => !v)}
                  label="Expire after the first download"
                  hint="One-shot link: it stops working as soon as something is downloaded."
                />
              </div>
            </details>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  className="btn h-9 text-[13px]"
                  onClick={() => setShowExpiry((v) => !v)}
                  aria-expanded={showExpiry}
                >
                  {days ? `Expires in ${days} day${days > 1 ? "s" : ""}` : "Set expiry"}
                  <Icon name="chevronDown" size={14} />
                </button>
                {showExpiry && (
                  <div className="menu absolute left-0 top-11 z-40 w-44 p-1.5">
                    {EXPIRY.map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        className="menu-item text-[13px]"
                        onClick={() => {
                          setDays(option.days);
                          setShowExpiry(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={busy}
                className="btn btn-primary ml-auto h-9 text-[13px]"
              >
                {busy ? `Uploading ${progress}%` : prefilling ? "Loading files…" : "Create link"}
              </button>
            </div>

            {error && (
              <p
                className="rounded-lg px-3 py-2 text-[13px]"
                role="alert"
                style={{ backgroundColor: theme.secondary, color: "#e5484d" }}
              >
                {error}
              </p>
            )}
          </form>

          {newPath && (
            <div
              className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ border: `1px solid ${theme.border}` }}
            >
              <Icon name="link" size={15} />
              <span className="min-w-0 flex-1 truncate text-[12px]">
                {absoluteShareUrl(newPath, origin)}
              </span>
              <a
                href={newPath}
                target="_blank"
                rel="noreferrer"
                className="btn h-7 px-2 text-[12px]"
              >
                Open
              </a>
              <button
                type="button"
                className="btn h-7 px-2 text-[12px]"
                onClick={() => copy(absoluteShareUrl(newPath, origin))}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          )}
        </section>

        <section>
          <h2 className="section-label mb-3">Previous links</h2>
          {loadingLinks ? (
            <div className="skeleton h-24 rounded-xl" />
          ) : links.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 rounded-xl px-6 py-10 text-center"
              style={{ border: `1px dashed ${theme.border}`, color: theme.muted }}
            >
              <Icon name="link" size={20} />
              <p className="text-[13px]">No share links yet.</p>
            </div>
          ) : (
            <div
              className="overflow-hidden rounded-xl"
              style={{ border: `1px solid ${theme.border}` }}
            >
              {links.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-3 py-2.5"
                  style={{ borderTop: index ? `1px solid ${theme.border}` : undefined }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px]">
                      {item.name || "Untitled share"}
                      {item.expired && (
                        <span className="ml-2 text-[11px]" style={{ color: "#e5484d" }}>
                          expired
                        </span>
                      )}
                      {item.burnedAt && !item.expired && (
                        <span className="ml-2 text-[11px]" style={{ color: theme.muted }}>
                          used
                        </span>
                      )}
                    </p>
                    <p className="truncate text-[12px]" style={{ color: theme.muted }}>
                      {item.expiresOn ? `Expires ${item.expiresOn}` : "No expiry set"}
                      {" · "}
                      {item.stats.opens} open{item.stats.opens === 1 ? "" : "s"}, {item.stats.downloads} download
                      {item.stats.downloads === 1 ? "" : "s"}
                      {item.allowUploads && " · guests can add"}
                      {item.burnAfterDownload && " · one-shot"}
                    </p>
                    {item.extendRequested && !item.expired && (
                      <p className="mt-1 text-[12px]" style={{ color: theme.accent }}>
                        Someone asked for more time.
                      </p>
                    )}
                  </div>
                  {!item.burnedAt && (
                    <button
                      type="button"
                      className="btn h-7 shrink-0 px-2 text-[12px]"
                      title="Add two days"
                      onClick={() => updateShare(item.id, { extendDays: 2 })}
                      style={item.extendRequested ? { borderColor: theme.accent, color: theme.accent } : undefined}
                    >
                      +2d
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn h-7 shrink-0 px-2 text-[12px]"
                    onClick={() => copy(absoluteShareUrl(item.path, origin), index)}
                  >
                    {copiedIndex === index ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    aria-label="Delete share"
                    className="shrink-0 rounded-md p-1.5"
                    style={{ color: theme.muted }}
                    onClick={() => removeShare(item.id)}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

export default Smartshare;
