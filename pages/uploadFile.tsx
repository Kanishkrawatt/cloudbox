import React, { useRef, useState } from "react";
import Link from "next/link";
import Layout from "@/components/layouts/baseLayout";
import Icon from "@/components/ui/icons";
import { useTheme } from "../utils/contexts/theme";
import { useUpload } from "@/utils/contexts/upload";

const prettySize = (bytes: number) =>
  bytes <= 0
    ? "0 KB"
    : bytes >= 1024 ** 2
    ? `${(bytes / 1024 ** 2).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** Upload screen. All state lives in UploadProvider so a batch survives navigating away. */
export function UploadFile() {
  const { theme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [showFolders, setShowFolders] = useState(false);
  const {
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
    start: upload,
    clear,
  } = useUpload();

  const pendingSize = queue
    .filter((item) => item.status !== "success")
    .reduce((sum, item) => sum + item.file.size, 0);
  const done = queue.length > 0 && queue.every((item) => item.status === "success");
  const doneCount = queue.filter((item) => item.status === "success").length;
  const imageCount = queue.filter((item) => item.status === "success" && item.file.type.startsWith("image/")).length;

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
            by what&apos;s in them. You can browse the app meanwhile; just keep the tab open.
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
                    value={item.name}
                    disabled={item.status !== "pending"}
                    onChange={(e) => rename(index, e.target.value)}
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
                          width: `${item.progress}%`,
                          backgroundColor: theme.accent,
                        }}
                      />
                    </div>
                    <span className="shrink-0 text-[11px]" style={{ color: theme.muted }}>
                      {item.status === "success"
                        ? "Done"
                        : item.status === "error"
                        ? "Failed"
                        : item.progress
                        ? `${item.progress}%`
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
