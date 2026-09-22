import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { collection, getDocs } from "firebase/firestore";
import db from "@/firebase/firestore";
import { useAuth } from "@/utils/contexts/auth";
import { useTheme } from "@/utils/contexts/theme";
import { groupDuplicates } from "@/utils/imageMeta";
import { datatype } from "@/components/types";
import Icon from "@/components/ui/icons";

const mb = (bytes: number) => (bytes / 1024 ** 2).toFixed(1);

/**
 * Near-duplicate photos, grouped by perceptual hash. Only images uploaded
 * since hashing was added carry a `phash`; older ones are simply not compared.
 * "Keep this" deletes the rest of the group through the normal delete route,
 * so quota is refunded the same way as everywhere else.
 */
const Duplicates = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [groups, setGroups] = useState<datatype[][] | null>(null);
  const [busy, setBusy] = useState<number>(-1);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    const snap = await getDocs(collection(db, `User/${user.uid}/Images`));
    const items = snap.docs.map((d) => d.data() as datatype);
    setGroups(groupDuplicates(items));
  }, [user?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  const keep = async (groupIndex: number, keeper: datatype) => {
    const group = groups?.[groupIndex];
    if (!group || !user) return;
    setBusy(groupIndex);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/deleteItem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          items: group
            .filter((item) => item.url !== keeper.url)
            .map(({ url, publicId, resourceType }) => ({ url, publicId, resourceType })),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Delete failed.");
      setGroups((prev) => prev?.filter((_, i) => i !== groupIndex) ?? null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(-1);
    }
  };

  if (groups === null) return <div className="skeleton h-24 rounded-xl" />;

  const reclaimable = groups.reduce(
    (sum, group) => sum + group.slice(1).reduce((s, item) => s + (item.size ?? 0), 0),
    0
  );

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="section-label">Duplicates</h2>
        {groups.length > 0 && (
          <span className="text-[12px]" style={{ color: theme.muted }}>
            {groups.length} group{groups.length === 1 ? "" : "s"} · free up to {mb(reclaimable)} MB
          </span>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded-lg px-3 py-2 text-[13px]" style={{ backgroundColor: theme.secondary, color: "#e5484d" }}>
          {error}
        </p>
      )}

      {groups.length === 0 ? (
        <div
          className="flex flex-col items-center gap-2 rounded-xl px-6 py-8 text-center"
          style={{ border: `1px dashed ${theme.border}`, color: theme.muted }}
        >
          <Icon name="check" size={20} />
          <p className="text-[13px]">No duplicate photos found.</p>
          <p className="text-[12px]">Photos uploaded before today were not analysed and are skipped.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group, gi) => (
            <div key={group[0].url} className="card p-3">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {group.map((item) => (
                  <figure key={item.url} className="min-w-0">
                    <div
                      className="relative aspect-square overflow-hidden rounded-lg"
                      style={{ border: `1px solid ${theme.border}` }}
                    >
                      <Image src={item.url} alt={item.name} fill sizes="20vw" className="object-cover" />
                    </div>
                    <figcaption className="mt-1 flex flex-col gap-1">
                      <span className="truncate text-[11px]" title={item.name}>
                        {item.name}
                      </span>
                      <span className="text-[11px]" style={{ color: theme.muted }}>
                        {mb(item.size ?? 0)} MB
                      </span>
                      <button
                        type="button"
                        disabled={busy === gi}
                        onClick={() => keep(gi, item)}
                        className="btn h-7 text-[11px]"
                      >
                        {busy === gi ? "…" : "Keep this"}
                      </button>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default Duplicates;
