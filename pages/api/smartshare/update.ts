import type { NextApiRequest, NextApiResponse } from "next";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import db from "../../../firebase/firestore";
import { verifyIdToken } from "@/utils/cloudinaryServer";

/**
 * Owner edits to an existing share.
 *
 *   { idToken, shareId, extendDays }         adds days to the lifetime, clears the request flag
 *   { idToken, shareId, allowUploads }        toggle
 *   { idToken, shareId, burnAfterDownload }   toggle
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  const { idToken, shareId, extendDays, allowUploads, burnAfterDownload } = req.body ?? {};
  const uid = await verifyIdToken(idToken);
  if (!uid) return res.status(401).json({ error: "Sign in again." });
  if (!shareId) return res.status(400).json({ error: "Missing share id." });

  const ref = doc(db, `User/${uid}/Smartshare/${shareId}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) return res.status(404).json({ error: "That share no longer exists." });

  const patch: Record<string, number | boolean> = {};
  if (typeof extendDays === "number" && extendDays > 0 && extendDays <= 30) {
    patch.time = (snap.data().time ?? 0) + extendDays;
    patch.extendRequested = false;
  }
  if (typeof allowUploads === "boolean") patch.allowUploads = allowUploads;
  if (typeof burnAfterDownload === "boolean") patch.burnAfterDownload = burnAfterDownload;
  if (!Object.keys(patch).length) return res.status(400).json({ error: "Nothing to change." });

  await updateDoc(ref, patch);
  return res.status(200).json({ status: "Done", ...patch });
}
