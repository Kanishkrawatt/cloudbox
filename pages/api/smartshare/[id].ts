import type { NextApiRequest, NextApiResponse } from "next";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import db from "../../../firebase/firestore";

export type SharePayload = {
  name: string;
  date: string;
  expiresInDays: number | null;
  expiresOn: string | null;
  /** Present when the owner enabled face sorting; photos may repeat across people. */
  people: {
    photos: string[];
    faceCount: number;
    face?: { url: string; box: { x: number; y: number; width: number; height: number } };
  }[];
  noFaces: string[];
  files: {
    name: string;
    size: number;
    type: string;
    url: string;
  }[];
};

/** Share ids look like "<shareId>-<uid>"; a uid may itself contain dashes. */
const splitShareId = (raw: string) => {
  const at = raw.indexOf("-");
  if (at < 1) return null;
  return { shareId: raw.slice(0, at), uid: raw.slice(at + 1) };
};

export const expiryOf = (date?: string, days?: number) => {
  if (!date || !days) return null;
  const created = new Date(date);
  if (Number.isNaN(created.getTime())) return null;
  return new Date(created.getTime() + days * 24 * 60 * 60 * 1000);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SharePayload | { error: string }>
) {
  const parts = splitShareId(String(req.query.id ?? ""));
  if (!parts) return res.status(400).json({ error: "Malformed share link." });

  try {
    const shareSnap = await getDoc(
      doc(db, `User/${parts.uid}/Smartshare/${parts.shareId}`)
    );
    if (!shareSnap.exists()) {
      return res.status(404).json({ error: "This share link no longer exists." });
    }
    const share = shareSnap.data();
    const expiresOn = expiryOf(share.date, share.time);

    // Enforced on read: the cleanup job runs on its own schedule, and an
    // expired link must stop working the moment it expires either way.
    if (expiresOn && expiresOn.getTime() < Date.now()) {
      return res.status(410).json({ error: "This share link has expired." });
    }

    const filesSnap = await getDocs(
      collection(db, `User/${parts.uid}/Smartshare/${parts.shareId}/files`)
    );

    return res.status(200).json({
      name: share.name ?? "Shared files",
      date: share.date ?? "",
      expiresInDays: share.time ?? null,
      expiresOn: expiresOn ? expiresOn.toDateString() : null,
      people: share.faceGroups?.people ?? [],
      noFaces: share.faceGroups?.noFaces ?? [],
      files: filesSnap.docs.map((d) => {
        const data = d.data();
        return {
          name: data.name ?? "file",
          size: data.size ?? 0,
          type: data.type ?? "",
          url: data.url,
        };
      }),
    });
  } catch {
    return res.status(500).json({ error: "Could not load this share." });
  }
}
