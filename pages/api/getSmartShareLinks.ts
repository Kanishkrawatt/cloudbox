import type { NextApiRequest, NextApiResponse } from "next";
import { collection, getDocs } from "firebase/firestore";
import db from "../../firebase/firestore";
import { expiryOf } from "./smartshare/[id]";
import { toPath } from "@/utils/shareLink";

export type SmartShareData = {
  id: string;
  /** Path only; the client prefixes it with the origin it is running on. */
  path: string;
  time: number;
  name: string;
  date: string;
  expiresOn: string | null;
  expired: boolean;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ status: "Use POST" });

  const { uid } = req.body ?? {};
  if (!uid) return res.status(400).json({ status: "Missing uid" });

  const snapshot = await getDocs(collection(db, `User/${uid}/Smartshare`));
  const data: SmartShareData[] = snapshot.docs.map((docSnap) => {
    const { path, smartLink, time, name, date } = docSnap.data();
    const expiresOn = expiryOf(date, time);
    return {
      id: docSnap.id,
      path: toPath(path ?? smartLink),
      time,
      name,
      date,
      expiresOn: expiresOn ? expiresOn.toDateString() : null,
      expired: expiresOn ? expiresOn.getTime() < Date.now() : false,
    };
  });

  // Newest first, so the link you just made is at the top.
  data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return res.status(200).json({ status: "Done", data });
}
