import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTheme } from "@/utils/contexts/theme";
import { useUpload } from "@/utils/contexts/upload";
import Icon from "@/components/ui/icons";

/** Floating progress pill shown on every page except Upload while a batch is running. */
const UploadIndicator = () => {
  const { theme } = useTheme();
  const { queue, uploading, reading } = useUpload();
  const router = useRouter();

  if (router.pathname === "/uploadFile") return null;
  if (!uploading && reading === 0) return null;

  const done = queue.filter((q) => q.status === "success").length;
  const total = queue.length;
  const pct = total ? Math.round(queue.reduce((s, q) => s + q.progress, 0) / total) : 0;

  return (
    <Link
      href="/uploadFile"
      className="fixed bottom-4 right-4 z-40 flex items-center gap-3 rounded-xl px-3 py-2 text-[12px] shadow-[0_20px_40px_-20px_rgb(0_0_0/0.5)]"
      style={{ backgroundColor: theme.primary, border: `1px solid ${theme.border}`, color: theme.text }}
      aria-live="polite"
    >
      <span className="relative flex h-8 w-8 items-center justify-center">
        <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke={theme.border} strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke={theme.accent}
            strokeWidth="3"
            strokeDasharray={`${(pct / 100) * 94.2} 94.2`}
            strokeLinecap="round"
          />
        </svg>
        <Icon name="upload" size={13} />
      </span>
      <span className="leading-tight">
        {uploading ? (
          <>
            <span className="block font-medium">Uploading {done}/{total}</span>
            <span style={{ color: theme.muted }}>{pct}% · keep the tab open</span>
          </>
        ) : (
          <>
            <span className="block font-medium">Reading text from {reading} image{reading === 1 ? "" : "s"}</span>
            <span style={{ color: theme.muted }}>for search · nearly done</span>
          </>
        )}
      </span>
    </Link>
  );
};

export default UploadIndicator;
