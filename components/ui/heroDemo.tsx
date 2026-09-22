import React, { useEffect, useState } from "react";
import { useTheme } from "@/utils/contexts/theme";
import Icon, { IconName } from "@/components/ui/icons";

/**
 * Landing hero: a working miniature of Smart Share. Visitors drop (fake) files,
 * pick a lifetime, and watch the link appear with a live countdown. Nothing is
 * uploaded; the point is to show the whole flow in ten seconds.
 */

type DemoFile = { icon: IconName; name: string; size: string; progress: number; color: string };

const FILES: DemoFile[] = [
  { icon: "image", name: "goa-day-1.jpg", size: "4.2 MB", progress: 0, color: "#0EA5E9" },
  { icon: "video", name: "sunset.mp4", size: "48 MB", progress: 0, color: "#8B5CF6" },
];

const LIFETIMES = [1, 2, 5, 7];
const DAY = 86_400_000;

const pad = (n: number) => String(n).padStart(2, "0");
const countdown = (ms: number) => {
  const d = Math.floor(ms / DAY);
  const h = Math.floor((ms % DAY) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return d > 0 ? `${d}d ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const HeroDemo = () => {
  const { theme } = useTheme();
  const [files, setFiles] = useState<DemoFile[]>([]);
  const [days, setDays] = useState(2);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);

  const uploading = files.some((f) => f.progress < 100);
  const done = files.length > 0 && !uploading;

  // Fake upload: each file fills at its own pace.
  useEffect(() => {
    if (!uploading) return;
    const id = setInterval(() => {
      setFiles((fs) =>
        fs.map((f, i) => ({ ...f, progress: Math.min(100, f.progress + 4 + i * 2 + Math.random() * 6) }))
      );
    }, 120);
    return () => clearInterval(id);
  }, [uploading]);

  useEffect(() => {
    if (done && expiresAt === null) setExpiresAt(Date.now() + days * DAY);
  }, [done, days, expiresAt]);

  // Live clock for the countdown.
  useEffect(() => {
    if (expiresAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const addFile = () => {
    const next = FILES[files.length % FILES.length];
    if (files.length >= FILES.length) return;
    setFiles((fs) => [...fs, { ...next }]);
    setExpiresAt(null);
  };

  const pickDays = (d: number) => {
    setDays(d);
    if (expiresAt !== null) setExpiresAt(Date.now() + d * DAY);
  };

  const reset = () => {
    setFiles([]);
    setExpiresAt(null);
    setCopied(false);
  };

  const copy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const remaining = expiresAt ? Math.max(0, expiresAt - now) : 0;
  const pct = expiresAt ? (remaining / (days * DAY)) * 100 : 100;

  return (
    <div
      className="surface relative mx-auto w-full max-w-[440px] rounded-2xl p-2 shadow-[0_30px_60px_-40px_rgb(0_0_0/0.5)]"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        addFile();
      }}
    >
      <div className="card p-5" style={{ borderColor: dragging ? theme.accent : undefined }}>
        <div className="flex h-6 items-center justify-between gap-3">
          <p className="text-[14px] font-medium">New Smart Share</p>
          {files.length > 0 && (
            <button type="button" onClick={reset} className="text-[12px]" style={{ color: theme.muted }}>
              Start over
            </button>
          )}
        </div>

        {/* Drop zone */}
        <button
          type="button"
          onClick={addFile}
          disabled={files.length >= FILES.length}
          className="mt-4 flex h-[104px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-[13px] transition-colors disabled:cursor-default"
          style={{
            borderColor: dragging ? theme.accent : theme.border,
            backgroundColor: dragging ? `${theme.accent}14` : theme.secondary,
            color: theme.muted,
          }}
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.primary, color: theme.accent }}
          >
            <Icon name={files.length >= FILES.length ? "check" : "upload"} size={16} />
          </span>
          {files.length === 0
            ? "Drop files here, or click to add one"
            : files.length >= FILES.length
              ? "That's both demo files"
              : "Add another file"}
        </button>

        {/* Files: three fixed slots so the card never changes height */}
        <ul className="mt-3 space-y-1.5">
          {FILES.map((slot, i) => {
            const f = files[i];
            if (!f)
              return (
                <li key={slot.name} className="flex items-center gap-3" aria-hidden="true">
                  <span className="h-7 w-7 shrink-0 rounded-lg border border-dashed" style={{ borderColor: theme.border }} />
                  <div className="flex-1">
                    <div className="h-2 w-2/5 rounded-full" style={{ backgroundColor: theme.secondary }} />
                    <div className="mt-1.5 h-1 w-full rounded-full" style={{ backgroundColor: theme.secondary }} />
                  </div>
                </li>
              );
            return (
              <li key={f.name} className="flex items-center gap-3 text-[13px]">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${f.color}2e`, color: f.color }}
                >
                  <Icon name={f.icon} size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <span className="truncate">{f.name}</span>
                    <span className="shrink-0 text-[12px]" style={{ color: theme.muted }}>
                      {f.progress < 100 ? `${Math.round(f.progress)}%` : f.size}
                    </span>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full" style={{ backgroundColor: theme.secondary }}>
                    <div
                      className="h-full rounded-full transition-[width] duration-150"
                      style={{ width: `${f.progress}%`, backgroundColor: f.color }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Lifetime */}
        <div className="mt-4">
          <p className="section-label mb-2">Link lives for</p>
          <div className="grid grid-cols-4 gap-2">
            {LIFETIMES.map((d) => {
              const active = d === days;
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={active}
                  onClick={() => pickDays(d)}
                  className="btn h-9 text-[13px]"
                  style={
                    active
                      ? { backgroundColor: theme.accent, borderColor: theme.accent, color: theme.primary }
                      : undefined
                  }
                >
                  {d} day{d > 1 ? "s" : ""}
                </button>
              );
            })}
          </div>
        </div>

        {/* Result */}
        <div
          className="mt-4 rounded-xl p-3 transition-opacity"
          style={{ backgroundColor: theme.secondary, opacity: done ? 1 : 0.45 }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: theme.accent }}>
              <Icon name="link" size={15} />
            </span>
            <code className="min-w-0 flex-1 truncate text-[12.5px]">
              cloudbox.app/s/{done ? "k7Qx2m" : "······"}
            </code>
            <button
              type="button"
              onClick={copy}
              disabled={!done}
              className="btn h-8 px-3 text-[12px]"
              style={{ backgroundColor: theme.primary }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between text-[12px]" style={{ color: theme.muted }}>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="lock" size={12} />
              {done ? `Expires in ${countdown(remaining)}` : uploading ? "Uploading…" : "Add a file to get a link"}
            </span>
            <span>{files.length} file{files.length === 1 ? "" : "s"}</span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full" style={{ backgroundColor: theme.primary }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: theme.accent }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroDemo;
