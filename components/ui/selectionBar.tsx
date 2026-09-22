import React, { useState } from "react";
import { useRouter } from "next/router";
import { useTheme } from "@/utils/contexts/theme";
import { useAuth } from "@/utils/contexts/auth";
import { useSelection } from "@/utils/contexts/selection";
import { shareThese } from "@/utils/shareHandoff";
import { FolderPicker, updateItems } from "@/components/modals/optionsModal";
import Icon from "@/components/ui/icons";

const mb = (bytes: number) => (bytes / 1024 ** 2).toFixed(1);

/** Bulk actions for the current multi-selection; floats at the bottom while anything is picked. */
const SelectionBar = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { items, clear } = useSelection();
  const router = useRouter();
  const [moving, setMoving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) return null;

  const size = items.reduce((sum, item) => sum + (item.size ?? 0), 0);

  const downloadAll = async () => {
    setBusy("download");
    // ponytail: one file at a time, no zip; add JSZip if people select dozens.
    for (const item of items) {
      const blob = await fetch(item.url).then((r) => r.blob());
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    }
    setBusy(null);
  };

  const remove = async () => {
    if (!confirm(`Delete ${items.length} file${items.length === 1 ? "" : "s"}? This cannot be undone.`)) return;
    setBusy("delete");
    setError(null);
    try {
      const idToken = await user?.getIdToken();
      const res = await fetch("/api/deleteItem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          items: items.map(({ url, publicId, resourceType }) => ({ url, publicId, resourceType })),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Delete failed.");
      clear();
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setBusy(null);
    }
  };

  const Btn = ({
    id,
    icon,
    label,
    onClick,
    danger,
  }: {
    id: string;
    icon: React.ComponentProps<typeof Icon>["name"];
    label: string;
    onClick: () => void;
    danger?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={busy !== null}
      className="btn h-8 text-[12px]"
      style={danger ? { color: "#e5484d" } : undefined}
    >
      <Icon name={icon} size={14} />
      <span className="hidden sm:inline">{busy === id ? "…" : label}</span>
    </button>
  );

  return (
    <>
      <div
        className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 flex-wrap items-center gap-2 rounded-xl px-3 py-2 shadow-[0_20px_40px_-20px_rgb(0_0_0/0.5)]"
        role="toolbar"
        aria-label="Selected files"
        style={{ backgroundColor: theme.primary, border: `1px solid ${theme.accent}` }}
      >
        <button
          type="button"
          onClick={clear}
          aria-label="Clear selection"
          className="flex h-8 w-8 items-center justify-center rounded-md"
          style={{ color: theme.muted }}
        >
          <Icon name="close" size={15} />
        </button>
        <span className="text-[13px] font-medium">
          {items.length} selected
          <span className="ml-1 font-normal text-[12px]" style={{ color: theme.muted }}>
            · {mb(size)} MB
          </span>
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <Btn id="download" icon="download" label="Download" onClick={downloadAll} />
          <Btn
            id="share"
            icon="share"
            label="Smart Share"
            onClick={() =>
              shareThese(router, {
                name: `${items.length} files`,
                files: items.map((i) => ({ url: i.url, name: i.name, type: i.type })),
              })
            }
          />
          <Btn id="move" icon="folder" label="Move" onClick={() => setMoving(true)} />
          <Btn id="delete" icon="trash" label="Delete" onClick={remove} danger />
        </div>
        {error && (
          <p className="w-full text-[12px]" style={{ color: "#e5484d" }}>
            {error}
          </p>
        )}
      </div>

      {moving && (
        <FolderPicker
          title={`Move ${items.length} file${items.length === 1 ? "" : "s"} to`}
          onClose={() => setMoving(false)}
          onPick={async (folderId) => {
            await updateItems(items.map((i) => i.url), { folderId });
            clear();
            window.location.reload();
          }}
        />
      )}
    </>
  );
};

export default SelectionBar;
