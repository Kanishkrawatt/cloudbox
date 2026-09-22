import type { NextApiRequest, NextApiResponse } from "next";
import {
  collection,
  getDocs,
  query,
  doc,
  where,
  deleteDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import db from "../../firebase/firestore";
import { destroyAsset, verifyIdToken } from "@/utils/cloudinaryServer";

type Body = {
  idToken?: string;
  /** Legacy shape: a bare list of URLs. */
  data?: string[];
  items?: { url: string; publicId?: string; resourceType?: string }[];
  deletefromDB?: boolean;
};

/** Finds the Firestore doc for a URL across both of a user's collections. */
const findDocs = async (uid: string, url: string) => {
  const hits: { path: string; id: string; size?: number }[] = [];
  for (const kind of ["Images", "Files"]) {
    const snap = await getDocs(
      query(collection(db, `User/${uid}/${kind}`), where("url", "==", url))
    );
    snap.forEach((d) => hits.push({ path: `User/${uid}/${kind}`, id: d.id, size: d.data().size }));
  }
  return hits;
};

/** Gives the freed megabytes back to the user's quota. */
const refundQuota = async (uid: string, bytes: number) => {
  if (!bytes) return;
  const userRef = doc(db, "User", uid);
  const snap = await getDoc(userRef);
  const Storage = snap.data()?.Storage;
  if (!Storage) return;
  const freed = bytes / 1024 ** 2;
  await updateDoc(userRef, {
    Storage: {
      ...Storage,
      Used: Math.max(0, Storage.Used - freed),
      Free: Math.min(Storage.Total ?? Storage.Free + freed, Storage.Free + freed),
    },
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  const { idToken, data, items, deletefromDB = true }: Body = req.body ?? {};
  const uid = await verifyIdToken(idToken);
  if (!uid) return res.status(401).json({ error: "Sign in again." });

  const targets = items?.length
    ? items
    : (data ?? []).map((url) => ({ url, publicId: undefined, resourceType: undefined }));
  if (!targets.length) return res.status(400).json({ error: "Nothing to delete." });

  const results: string[] = [];
  for (const target of targets) {
    // Legacy items live in Firebase Storage, which is unreachable on the Spark
    // plan; drop the metadata anyway so the library stops showing dead entries.
    results.push(await destroyAsset(target.publicId, target.resourceType));

    if (deletefromDB) {
      const docs = await findDocs(uid, target.url);
      for (const hit of docs) {
        await deleteDoc(doc(db, hit.path, hit.id));
        await refundQuota(uid, hit.size ?? 0);
      }
    }
  }

  return res.status(200).json({ status: "Done", results });
}
