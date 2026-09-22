import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { collection, getDocs } from "firebase/firestore";
import Layout from "@/components/layouts/baseLayout";
import RecentImages from "@/components/frames/images";
import Icon from "@/components/ui/icons";
import db from "@/firebase/firestore";
import { useAuth } from "@/utils/contexts/auth";
import { useTheme } from "@/utils/contexts/theme";
import { faceCrop } from "@/utils/faceApi";
import { shareThese } from "@/utils/shareHandoff";
import { datatype } from "@/components/types";
import type { PeopleDoc } from "./api/people";

/**
 * Face clusters across the whole library. Name a cluster once and it sticks
 * across re-runs; pick one to see just their photos or send them a share.
 */
function People() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const [people, setPeople] = useState<PeopleDoc | null>(null);
  const [available, setAvailable] = useState(true);
  const [library, setLibrary] = useState<datatype[]>([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<"idle" | "working">("idle");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState(-1);
  const [editing, setEditing] = useState(-1);
  const [draft, setDraft] = useState("");

  const post = useCallback(
    async (payload: Record<string, unknown>) => {
      const idToken = await user?.getIdToken();
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, ...payload }),
      });
      return { status: res.status, body: await res.json().catch(() => ({})) };
    },
    [user]
  );

  useEffect(() => {
    if (!user?.uid) return;
    Promise.all([
      post({ action: "status" }),
      getDocs(collection(db, `User/${user.uid}/Images`)),
    ]).then(([status, snap]) => {
      setPeople(status.body.people ?? null);
      setAvailable(Boolean(status.body.available));
      setLibrary(snap.docs.map((d) => d.data() as datatype));
      setLoading(false);
      // A scan started earlier is still running on the service; pick it up.
      if (status.body.jobId) {
        setState("working");
        setMessage("A scan is still running. Waiting for it to finish…");
        resume(status.body.jobId);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, post]);

  const resume = async (jobId: string) => {
    for (let i = 0; i < 90; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const { body } = await post({ action: "poll", jobId });
      if (body.error) {
        setMessage(body.error);
        return setState("idle");
      }
      if (body.state === "done") {
        setPeople(body.people);
        setMessage("");
        return setState("idle");
      }
    }
    setMessage("That took too long. Try again in a moment.");
    setState("idle");
  };

  const run = async () => {
    setState("working");
    setMessage("Looking for faces across your library. The first run can take a minute while the service wakes up.");
    const start = Date.now();
    const poll = async (jobId: string): Promise<void> => {
      if (Date.now() - start > 8 * 60 * 1000) {
        setMessage("That took too long. Try again in a moment.");
        return setState("idle");
      }
      await new Promise((r) => setTimeout(r, 5000));
      const { status, body } = await post({ action: "poll", jobId });
      if (status === 404 || body.error) {
        setMessage(body.error ?? "The job expired. Try again.");
        return setState("idle");
      }
      if (body.state !== "done") return poll(jobId);
      setPeople(body.people);
      setMessage("");
      setState("idle");
    };
    const { status, body } = await post({ action: "run" });
    if (status === 202 && body.jobId) {
      setMessage(`Checking ${body.images ?? "your"} photos. This keeps running while you wait.`);
      return poll(body.jobId);
    }
    if (body.error) {
      setMessage(body.error);
      return setState("idle");
    }
    setPeople(body.people);
    setMessage("");
    setState("idle");
  };

  const rename = async (index: number) => {
    const { body } = await post({ action: "rename", index, name: draft });
    if (body.names && people) setPeople({ ...people, names: body.names });
    setEditing(-1);
  };

  const nameOf = (i: number) => people?.names?.[i] || `Person ${i + 1}`;
  const person = selected >= 0 ? people?.people[selected] : undefined;
  const photos = person ? library.filter((item) => person.photos.includes(item.url)) : [];

  return (
    <Layout
      title="People"
      action={
        <button
          type="button"
          disabled={state === "working" || !available}
          onClick={run}
          className="btn h-9 text-[13px]"
        >
          <Icon name="sparkle" size={15} />
          {people ? "Re-scan" : "Find people"}
        </button>
      }
    >
      <div className="px-4 py-6 sm:px-6">
        {message && (
          <div
            className="mb-5 flex items-center gap-3 rounded-xl px-4 py-3 text-[13px]"
            role="status"
            style={{ border: `1px solid ${theme.accent}`, backgroundColor: theme.secondary }}
          >
            {state === "working" && (
              <span className="h-2 w-2 shrink-0 animate-pulse rounded-full" style={{ backgroundColor: theme.accent }} />
            )}
            {message}
          </div>
        )}

        {loading ? (
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-[72px] w-[72px] rounded-full" />
            ))}
          </div>
        ) : !available ? (
          <p className="text-[13px]" style={{ color: theme.muted }}>
            Face features need the face service configured (FACE_API_KEY).
          </p>
        ) : !people ? (
          <div
            className="flex flex-col items-center gap-2 rounded-xl px-6 py-14 text-center"
            style={{ border: `1px dashed ${theme.border}`, color: theme.muted }}
          >
            <Icon name="users" size={22} />
            <p className="text-[14px] font-medium" style={{ color: theme.text }}>
              Nobody here yet
            </p>
            <p className="max-w-sm text-[13px]">
              Scan your library once and the people in it appear here. Name them, and the names stay put on later scans.
            </p>
          </div>
        ) : (
          <>
            <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
              {people.people.map((group, index) => {
                const active = selected === index;
                return (
                  <div key={index} className="flex w-[84px] shrink-0 flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelected(active ? -1 : index)}
                      aria-pressed={active}
                      title={`${group.photos.length} photos`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={faceCrop(group.face?.url ?? group.photos[0], group.face?.box, 160)}
                        alt=""
                        className="h-[72px] w-[72px] rounded-full object-cover"
                        style={{ border: `2px solid ${active ? theme.accent : theme.border}` }}
                      />
                    </button>
                    {editing === index ? (
                      <input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={() => rename(index)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") rename(index);
                          if (e.key === "Escape") setEditing(-1);
                        }}
                        className="field h-6 w-full px-1 text-center text-[11px]"
                        aria-label="Person name"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(index);
                          setDraft(people.names?.[index] ?? "");
                        }}
                        className="max-w-full truncate text-[12px] hover:underline"
                        style={{ color: active ? theme.text : theme.muted }}
                        title="Rename"
                      >
                        {nameOf(index)}
                      </button>
                    )}
                    <span className="text-[11px]" style={{ color: theme.muted }}>
                      {group.photos.length}
                    </span>
                  </div>
                );
              })}
            </div>

            {person && (
              <div className="mt-6">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h2 className="text-[15px] font-medium">{nameOf(selected)}</h2>
                  <span className="text-[12px]" style={{ color: theme.muted }}>
                    {photos.length} photo{photos.length === 1 ? "" : "s"}
                  </span>
                  <button
                    type="button"
                    className="btn btn-primary ml-auto h-8 text-[12px]"
                    onClick={() =>
                      shareThese(router, {
                        name: `Photos of ${nameOf(selected)}`,
                        files: photos.map((p) => ({ url: p.url, name: p.name, type: p.type })),
                      })
                    }
                  >
                    <Icon name="share" size={14} />
                    Share these with {nameOf(selected)}
                  </button>
                </div>
                <div className="-mx-4 sm:-mx-6">
                  <RecentImages data={photos} loadingState={false} theme={theme} />
                </div>
              </div>
            )}

            {!person && (
              <p className="mt-4 text-[12px]" style={{ color: theme.muted }}>
                {people.people.length} people · last scanned {new Date(people.sortedAt).toLocaleDateString()}
              </p>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

export default People;
