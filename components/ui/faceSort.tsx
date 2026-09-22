import React, { useCallback, useRef, useState } from "react";
import { useTheme } from "@/utils/contexts/theme";
import { useAuth } from "@/utils/contexts/auth";
import Icon from "@/components/ui/icons";

export type FaceSortState = "idle" | "working" | "queued" | "done" | "error" | "unavailable";

/**
 * Drives the face-sorting call for one share.
 *
 * The service runs on a free Render instance, so the first request after it
 * sleeps takes the better part of a minute, and big batches come back through a
 * job queue that has to be polled. Both are surfaced rather than hidden behind a
 * spinner that looks stuck.
 */
export const useFaceSort = () => {
  const { user } = useAuth();
  const [state, setState] = useState<FaceSortState>("idle");
  const [message, setMessage] = useState<string>("");
  const [people, setPeople] = useState<number>(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const call = useCallback(
    async (shareId: string, jobId?: string, threshold?: number) => {
      const idToken = await user?.getIdToken();
      const res = await fetch("/api/faceGroup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, shareId, jobId, threshold }),
      });
      return { status: res.status, body: await res.json().catch(() => ({})) };
    },
    [user]
  );

  const run = useCallback(
    async (shareId: string, threshold?: number) => {
      setState("working");
      setMessage("Looking for faces. The first run can take up to a minute while the service wakes up.");

      const start = Date.now();
      const poll = async (jobId: string) => {
        // Jobs live in memory for 30 minutes and vanish if the instance sleeps,
        // so a 404 here means resubmit, not fail.
        if (Date.now() - start > 6 * 60 * 1000) {
          setState("error");
          setMessage("Face sorting took too long. You can try again from this share later.");
          return;
        }
        const { status, body } = await call(shareId, jobId, threshold);
        if (status === 404) {
          setState("error");
          setMessage("The face job expired before it finished. Try again.");
          return;
        }
        if (!body || body.error) {
          setState("error");
          setMessage(body?.error ?? "Face sorting failed.");
          return;
        }
        if (body.state === "done") {
          setPeople(body.people?.length ?? 0);
          setState("done");
          setMessage(`Sorted into ${body.people?.length ?? 0} ${body.people?.length === 1 ? "person" : "people"}.`);
          return;
        }
        timer.current = setTimeout(() => poll(jobId), 4000);
      };

      try {
        const { status, body } = await call(shareId, undefined, threshold);
        if (status === 503) {
          setState("unavailable");
          setMessage(body?.error ?? "Face sorting is not configured yet.");
          return;
        }
        if (status === 202 && body.jobId) {
          setState("queued");
          setMessage(`Queued ${body.images ?? ""} photos for sorting. This keeps running while you wait.`);
          timer.current = setTimeout(() => poll(body.jobId), 4000);
          return;
        }
        if (body?.error) {
          setState("error");
          setMessage(body.error);
          return;
        }
        setPeople(body.people?.length ?? 0);
        setState("done");
        setMessage(`Sorted into ${body.people?.length ?? 0} ${body.people?.length === 1 ? "person" : "people"}.`);
      } catch (err: any) {
        setState("error");
        setMessage(err?.message ?? "Face sorting failed.");
      }
    },
    [call]
  );

  return { state, message, people, run };
};

/**
 * Lower splits people apart, higher merges them. The service's own measurements
 * put a real album at four people anywhere from 0.64 to 0.72, so these three
 * steps are meaningfully different without being fiddly. If an album of many
 * strangers still over-merges on Strict, 0.55 was the value that behaved there.
 */
export const THRESHOLDS = [
  { label: "Strict", value: 0.58, hint: "splits lookalikes apart" },
  { label: "Balanced", value: 0.65, hint: "recommended" },
  { label: "Loose", value: 0.72, hint: "merges more photos per person" },
];

const FaceSortToggle = ({
  enabled,
  onToggle,
  state,
  message,
  threshold,
  onThreshold,
}: {
  enabled: boolean;
  onToggle: () => void;
  state: FaceSortState;
  message?: string;
  threshold: number;
  onThreshold: (value: number) => void;
}) => {
  const { theme } = useTheme();
  const busy = state === "working" || state === "queued";

  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{
        border: `1px solid ${enabled ? theme.accent : theme.border}`,
        backgroundColor: enabled ? theme.secondary : "transparent",
      }}
    >
      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          checked={enabled}
          onChange={onToggle}
          className="sr-only"
        />
        <span
          aria-hidden="true"
          className="relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full transition-colors"
          style={{ backgroundColor: enabled ? theme.accent : theme.border }}
        >
          <span
            className="absolute h-3.5 w-3.5 rounded-full transition-transform"
            style={{
              backgroundColor: theme.primary,
              transform: enabled ? "translateX(16px)" : "translateX(3px)",
            }}
          />
        </span>

        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-[13px]">Sort by face</span>
          <span
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
            style={{ backgroundColor: theme.accent, color: theme.primary }}
          >
            <Icon name="sparkle" size={11} strokeWidth={2} />
            AI
          </span>
        </span>

        {busy && (
          <span className="shrink-0 text-[11px]" style={{ color: theme.muted }}>
            {state === "queued" ? "queued" : "working"}
          </span>
        )}
      </label>

      <p className="mt-1.5 pl-[42px] text-[12px]" style={{ color: theme.muted }}>
        {message ||
          "Groups the photos by who appears in them, so whoever opens the link can filter to one person."}
      </p>

      {enabled && state !== "unavailable" && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pl-[42px]">
          <span className="text-[11px]" style={{ color: theme.muted }}>
            Grouping
          </span>
          {THRESHOLDS.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => onThreshold(option.value)}
              title={option.hint}
              className="rounded-md px-2 py-1 text-[11px] transition-colors"
              style={{
                border: `1px solid ${threshold === option.value ? theme.accent : theme.border}`,
                color: threshold === option.value ? theme.text : theme.muted,
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {state === "error" && message && (
        <p className="mt-1 pl-[42px] text-[12px]" style={{ color: "#e5484d" }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default FaceSortToggle;
