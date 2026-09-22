import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "@/utils/contexts/theme";
import Icon from "@/components/ui/icons";

import { datatype } from "@/components/types";
import { useAuth } from "@/utils/contexts/auth";

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

export const OpenItem = ({ setModal, item }: ModalProps) => {
  const close = () => setModal({ status: "closed", item: {} });
  return (
    <Shell onClose={close} wide>
      <div className="relative h-[70vh] w-full">
        <Image src={item.url} fill alt={item.name ?? ""} className="object-contain" sizes="90vw" />
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

export default OptionsModal;
