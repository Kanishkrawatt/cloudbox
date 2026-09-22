import type { NextApiRequest, NextApiResponse } from "next";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import db from "../../firebase/firestore";
import { verifyIdToken } from "@/utils/cloudinaryServer";

/**
 * Rename or move library items, looked up by URL like /api/deleteItem does.
 *
 *   { idToken, urls: [...], name }        rename (single url makes sense)
 *   { idToken, urls: [...], folderId }    move into a folder; "" = back to the library root
 *
 * Items are found across the root Images/Files collections and every folder's,
 * so an item can be moved between folders as well as in and out of one.
 */
const KINDS = ["Images", "Files"] as const;

const findDocs = async (uid: string, url: string) => {
  const hits: { path: string; id: string; kind: string; data: Record<string, unknown> }[] = [];
  const paths: { path: string; kind: string }[] = KINDS.map((kind) => ({ path: `User/${uid}/${kind}`, kind }));
  const folders = await getDocs(collection(db, `User/${uid}/Folders`));
  folders.forEach((f) =>
    KINDS.forEach((kind) => paths.push({ path: `User/${uid}/Folders/${f.id}/${kind}`, kind }))
  );
  for (const { path, kind } of paths) {
    const snap = await getDocs(query(collection(db, path), where("url", "==", url)));
    snap.forEach((d) => hits.push({ path, id: d.id, kind, data: d.data() }));
  }
  return hits;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  const { idToken, urls, name, folderId } = req.body ?? {};
  const uid = await verifyIdToken(idToken);
  if (!uid) return res.status(401).json({ error: "Sign in again." });
  if (!Array.isArray(urls) || !urls.length) return res.status(400).json({ error: "Nothing to update." });

  const rename = typeof name === "string" && name.trim();
  const move = typeof folderId === "string";
  if (!rename && !move) return res.status(400).json({ error: "Nothing to change." });

  let changed = 0;
  for (const url of urls) {
    for (const hit of await findDocs(uid, url)) {
      if (rename) {
        await updateDoc(doc(db, hit.path, hit.id), { name: name.trim().slice(0, 200) });
        changed += 1;
      }
      if (move) {
        const target = folderId
          ? `User/${uid}/Folders/${folderId}/${hit.kind}`
          : `User/${uid}/${hit.kind}`;
        if (target === hit.path) continue;
        await addDoc(collection(db, target), { ...hit.data, ...(rename ? { name: name.trim() } : {}) });
        await deleteDoc(doc(db, hit.path, hit.id));
        changed += 1;
      }
    }
  }
  return res.status(200).json({ status: "Done", changed });
}
