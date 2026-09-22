import type { NextApiRequest, NextApiResponse } from "next";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import db from "../../firebase/firestore";
import { destroyAsset } from "@/utils/cloudinaryServer";

/**
 * Cleanup job for expired Smart Share links. Meant to be called on a schedule
 * (Vercel cron, GitHub Action, curl); it walks every user, so it is gated on a
 * shared secret rather than left open to the internet.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const secret = process.env.CRON_SECRET;
  const provided =
    req.headers.authorization?.replace("Bearer ", "") ?? String(req.query.secret ?? "");
  if (!secret || provided !== secret) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const users = await getDocs(collection(db, "User"));
  let removed = 0;

  for (const userDoc of users.docs) {
    const uid = userDoc.data().uid ?? userDoc.id;
    const shares = await getDocs(collection(db, `User/${uid}/Smartshare`));

    for (const share of shares.docs) {
      const { date, time } = share.data();
      if (!date || !time) continue;

      const created = new Date(date);
      if (Number.isNaN(created.getTime())) continue;
      const expiresAt = created.getTime() + time * 24 * 60 * 60 * 1000;
      if (expiresAt > Date.now()) continue;

      const files = await getDocs(
        collection(db, `User/${uid}/Smartshare/${share.id}/files`)
      );
      for (const file of files.docs) {
        const data = file.data();
        await destroyAsset(data.publicId, data.resourceType);
        await deleteDoc(file.ref);
      }
      await deleteDoc(doc(db, `User/${uid}/Smartshare/${share.id}`));
      removed += 1;
    }
  }

  return res.status(200).json({ status: "Done", removed });
}
