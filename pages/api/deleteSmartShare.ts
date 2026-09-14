import type { NextApiRequest, NextApiResponse } from "next";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import db from "../../firebase/firestore";
import { destroyAsset, verifyIdToken } from "@/utils/cloudinaryServer";

/** Deletes one share: its files in Cloudinary, then the Firestore documents. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  const { idToken, shareId } = req.body ?? {};
  const uid = await verifyIdToken(idToken);
  if (!uid) return res.status(401).json({ error: "Sign in again." });
  if (!shareId) return res.status(400).json({ error: "Missing share id." });

  const filesRef = collection(db, `User/${uid}/Smartshare/${shareId}/files`);
  const files = await getDocs(filesRef);

  for (const file of files.docs) {
    const data = file.data();
    await destroyAsset(data.publicId, data.resourceType);
    await deleteDoc(file.ref);
  }
  await deleteDoc(doc(db, `User/${uid}/Smartshare/${shareId}`));

  return res.status(200).json({ status: "Done" });
}
