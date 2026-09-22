import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "@/utils/contexts/theme";
import Icon from "@/components/ui/icons";

import { datatype } from "@/components/types";
import { useAuth } from "@/utils/contexts/auth";
import auth from "@/firebase/auth";

type ModalProps = {
  modal: { status: string; item: any };
  setModal: React.Dispatch<React.SetStateAction<{ status: string; item: any }>>;
  item: datatype;
};

function OptionsModal({ modal, setModal, item }: ModalProps) {
  switch (modal.status) {
    case "delete":
      return <DeleteItem modal={modal} setModal={setModal} item={item} />;
    case "open":
      return <OpenItem modal={modal} setModal={setModal} item={item} />;
    case "share":
      return <ShareItem modal={modal} setModal={setModal} item={item} />;
    case "rename":
      return <RenameItem modal={modal} setModal={setModal} item={item} />;
    case "move":
      return (
        <FolderPicker
          title="Move to folder"
          onClose={() => setModal({ status: "closed", item: {} })}
          onPick={async (folderId) => {
            await updateItems([item.url], { folderId });
            window.location.reload();
          }}
        />
      );
    default:
      return <></>;
  }
}

/** Shared chrome: dimmed backdrop, Escape to close, click-outside to close. */
const Shell = ({
  onClose,
  children,
  wide = false,
}: {
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) => {
  const { theme } = useTheme();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`menu relative w-full ${wide ? "max-w-4xl" : "max-w-sm"} p-5`}
        style={{ color: theme.text }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-md p-1"
          style={{ color: theme.muted }}
        >
          <Icon name="close" size={16} />
        </button>
        {children}
      </div>
    </div>
  );
};

export const DeleteItem = ({ setModal, item }: ModalProps) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const close = () => setModal({ status: "closed", item: {} });

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const idToken = await user?.getIdToken();
      const res = await fetch("/api/deleteItem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          items: [
            { url: item.url, publicId: item.publicId, resourceType: item.resourceType },
          ],
          deletefromDB: true,
        }),
      });
      if (!res.ok) throw new Error((await res.json())?.error ?? "Delete failed.");
      close();
      window.location.reload();
    } catch (err: any) {
      setError(err?.message ?? "Delete failed.");
      setDeleting(false);
    }
  };

  return (
    <Shell onClose={close}>
      <h3 className="page-title pr-6">Delete this file?</h3>
      <p className="mt-1.5 text-[13px]" style={{ color: "var(--muted)" }}>
        It is removed from storage and from your library. This cannot be undone.
      </p>
      {error && (
        <p className="mt-3 text-[13px]" role="alert" style={{ color: "#e5484d" }}>
          {error}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="btn h-9 text-[13px]" onClick={close}>
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="btn h-9 text-[13px]"
          style={{ backgroundColor: "#e5484d", borderColor: "#e5484d", color: "#fff" }}
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </Shell>
  );
};

const kindOf = (item: datatype) => {
  const name = (item.name ?? item.url ?? "").toLowerCase();
  if (item.type?.startsWith("video/") || /\.(mp4|mov|webm|mkv|m4v)$/.test(name)) return "video";
  if (item.type?.startsWith("audio/") || /\.(mp3|wav|aac|m4a|ogg)$/.test(name)) return "audio";
  if (item.type?.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|avif)$/.test(name)) return "image";
  if (item.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  return "other";
};

export const OpenItem = ({ setModal, item }: ModalProps) => {
  const { theme } = useTheme();
  const close = () => setModal({ status: "closed", item: {} });
  const kind = kindOf(item);
  return (
    <Shell onClose={close} wide>
      <p className="mb-3 truncate pr-8 text-[13px]" title={item.name}>
        {item.name}
      </p>
      <div className="relative h-[70vh] w-full">
        {kind === "image" && (
          <Image src={item.url} fill alt={item.name ?? ""} className="object-contain" sizes="90vw" />
        )}
        {kind === "video" && (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={item.url} controls autoPlay playsInline className="h-full w-full rounded-lg bg-black object-contain" />
        )}
        {kind === "audio" && (
          <div className="flex h-full items-center justify-center">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio src={item.url} controls autoPlay className="w-full max-w-md" />
          </div>
        )}
        {kind === "pdf" && (
          <iframe src={item.url} title={item.name} className="h-full w-full rounded-lg" />
        )}
        {kind === "other" && (
          <div className="flex h-full flex-col items-center justify-center gap-3" style={{ color: theme.muted }}>
            <Icon name="file" size={28} />
            <p className="text-[13px]">No preview for this file type.</p>
            <a href={item.url} target="_blank" rel="noreferrer" className="btn h-9 text-[13px]">
              <Icon name="external" size={14} />
              Open in new tab
            </a>
          </div>
        )}
      </div>
    </Shell>
  );
};

export const ShareItem = ({ setModal, item }: ModalProps) => {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const close = () => setModal({ status: "closed", item: {} });

  const handleShare = () => {
    navigator.clipboard.writeText(item.url);
    setCopied(true);
    setTimeout(close, 800);
  };

  return (
    <Shell onClose={close}>
      <h3 className="page-title pr-6">Share link</h3>
      <p className="mt-1.5 text-[13px]" style={{ color: theme.muted }}>
        Anyone with this link can view the file.
      </p>
      <div className="mt-4 flex items-center gap-2">
        <input
          type="text"
          value={item.url}
          readOnly
          onFocus={(e) => e.target.select()}
          className="field h-9 text-[12px]"
          style={{ backgroundColor: theme.secondary, borderColor: theme.border }}
        />
        <button type="button" onClick={handleShare} className="btn btn-primary h-9 shrink-0 text-[13px]">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </Shell>
  );
};

/** Rename/move helper shared by the context menu and the bulk bar. */
export const updateItems = async (urls: string[], patch: { name?: string; folderId?: string }) => {
  const idToken = await auth.currentUser?.getIdToken();
  const res = await fetch("/api/updateItem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, urls, ...patch }),
  });
  if (!res.ok) throw new Error((await res.json())?.error ?? "Update failed.");
};

export const RenameItem = ({ setModal, item }: ModalProps) => {
  const { theme } = useTheme();
  const [name, setName] = useState<string>(item.name ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const close = () => setModal({ status: "closed", item: {} });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === item.name) return close();
    setBusy(true);
    try {
      await updateItems([item.url], { name: name.trim() });
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Shell onClose={close}>
      <h3 className="page-title pr-6">Rename</h3>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={(e) => e.target.select()}
          className="field h-9 text-[13px]"
          style={{ backgroundColor: theme.secondary, borderColor: theme.border }}
          aria-label="File name"
        />
        {error && <p className="text-[13px]" style={{ color: "#e5484d" }}>{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn h-9 text-[13px]" onClick={close}>Cancel</button>
          <button type="submit" disabled={busy} className="btn btn-primary h-9 text-[13px]">
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Shell>
  );
};

/** Lists the user's folders plus "Library" (root); `onPick("")` means root. */
export const FolderPicker = ({
  title,
  onClose,
  onPick,
}: {
  title: string;
  onClose: () => void;
  onPick: (folderId: string) => Promise<void>;
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [folders, setFolders] = useState<{ id: string; name: string }[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    fetch("/api/getFolders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: user.uid }),
    })
      .then((r) => r.json())
      .then((b) => setFolders(b.data ?? []))
      .catch(() => setFolders([]));
  }, [user?.uid]);

  const pick = async (id: string) => {
    setBusy(id);
    try {
      await onPick(id);
    } catch (err: any) {
      setError(err.message);
      setBusy(null);
    }
  };

  const Row = ({ id, name, icon }: { id: string; name: string; icon: "home" | "folder" }) => (
    <button
      type="button"
      disabled={busy !== null}
      onClick={() => pick(id)}
      className="menu-item text-[13px]"
    >
      <Icon name={icon} size={15} />
      <span className="truncate">{name}</span>
      {busy === id && <span className="ml-auto text-[11px]" style={{ color: theme.muted }}>Moving…</span>}
    </button>
  );

  return (
    <Shell onClose={onClose}>
      <h3 className="page-title pr-6">{title}</h3>
      <div className="mt-3 max-h-72 overflow-y-auto">
        {folders === null ? (
          <div className="skeleton h-9 rounded-md" />
        ) : (
          <>
            <Row id="" name="Library (no folder)" icon="home" />
            {folders.map((f) => <Row key={f.id} id={f.id} name={f.name} icon="folder" />)}
            {folders.length === 0 && (
              <p className="px-2.5 py-2 text-[12px]" style={{ color: theme.muted }}>
                No folders yet. Create one from Home.
              </p>
            )}
          </>
        )}
      </div>
      {error && <p className="mt-2 text-[13px]" style={{ color: "#e5484d" }}>{error}</p>}
    </Shell>
  );
};

export default OptionsModal;
