import React, { useMemo, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import db from "@/firebase/firestore";
import { useAuth } from "@/utils/contexts/auth";
import { datatype, themeType } from "@/components/types";
import { suggestAlbums, type Album } from "@/utils/albums";
import Icon from "@/components/ui/icons";

/**
 * Albums the library seems to contain, from runs of consecutive shooting days.
 * "Create" makes a folder and moves the photos into it, which is the same
 * Firestore shape the Upload page writes for a folder.
 */
const SuggestedAlbums = ({
  data,
  theme,
  onCreated,
}: {
  data: datatype[];
  theme: themeType;
  onCreated: () => void;
}) => {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const suggested = useMemo(() => suggestAlbums(data), [data]);
  const albums = suggested.filter((a) => !dismissed.includes(a.start));
  if (albums.length === 0) return null;

  const create = async (album: Album<datatype>) => {
    if (!user?.uid) return;
    setBusy(album.start);
    setError(null);
    try {
      await axios.post("/api/addFolder", { uid: user.uid, folderName: album.title });
      const folders = await axios.post("/api/getFolders", { uid: user.uid });
      const folder = (folders.data?.data ?? []).find((f: { name: string }) => f.name === album.title);
      if (!folder) throw new Error("Folder was not created.");

      const root = collection(db, `User/${user.uid}/Images`);
      const target = collection(db, `User/${user.uid}/Folders/${folder.id}/Images`);
      for (const item of album.items) {
        const snap = await getDocs(query(root, where("url", "==", item.url)));
        for (const d of snap.docs) {
          await addDoc(target, d.data());
          await deleteDoc(doc(root, d.id));
        }
      }
      setDismissed((prev) => [...prev, album.start]);
      onCreated();
    } catch (err: any) {
      setError(err?.message ?? "Could not create that album.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="px-4 py-5 sm:px-6">
      <h2 className="section-label mb-3">Suggested albums</h2>
      {error && (
        <p className="mb-3 rounded-lg px-3 py-2 text-[13px]" style={{ backgroundColor: theme.secondary, color: "#e5484d" }}>
          {error}
        </p>
      )}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {albums.map((album) => (
          <div key={album.start} className="card w-60 shrink-0 p-3">
            <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-lg">
              {album.items.slice(0, 4).map((item) => (
                <span key={item.url} className="relative aspect-square" style={{ backgroundColor: theme.secondary }}>
                  <Image src={item.url} alt="" fill sizes="120px" className="object-cover" />
                </span>
              ))}
            </div>
            <p className="mt-2 truncate text-[13px] font-medium">{album.title}</p>
            <p className="text-[12px]" style={{ color: theme.muted }}>
              {album.items.length} photos
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => create(album)}
                className="btn btn-primary h-8 flex-1 text-[12px]"
              >
                <Icon name="folder" size={13} />
                {busy === album.start ? "Creating…" : "Create album"}
              </button>
              <button
                type="button"
                aria-label="Dismiss"
                className="btn h-8 w-8 px-0"
                onClick={() => setDismissed((prev) => [...prev, album.start])}
              >
                <Icon name="close" size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SuggestedAlbums;
