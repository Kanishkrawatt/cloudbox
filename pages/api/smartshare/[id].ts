import type { NextApiRequest, NextApiResponse } from "next";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  increment,
  type DocumentData,
  type DocumentReference,
} from "firebase/firestore";
import db from "../../../firebase/firestore";
import { fireWebhook } from "@/utils/webhook";
import { advanceShareFaces } from "@/utils/faceJobs";

// Finishing a face job can take a status call to a slow service.
export const config = { maxDuration: 60 };

export type SharePayload = {
  name: string;
  date: string;
  expiresInDays: number | null;
  expiresOn: string | null;
  /** "running" while the AI is still grouping, "done" once people are ready. */
  faceStatus: "running" | "done" | "failed" | null;
  /** Present when the owner enabled face sorting; photos may repeat across people. */
  people: {
    photos: string[];
    faceCount: number;
    face?: { url: string; box: { x: number; y: number; width: number; height: number } };
  }[];
  noFaces: string[];
  /** Recipients may add their own files to this share. */
  allowUploads: boolean;
  /** The link stops working after the first download. */
  burnAfterDownload: boolean;
  /** A recipient has asked the owner for more time. */
  extendRequested: boolean;
  files: {
    name: string;
    size: number;
    type: string;
    url: string;
    /** Set when a recipient, not the owner, added the file. */
    guest?: boolean;
  }[];
};

/** Share ids look like "<shareId>-<uid>"; a uid may itself contain dashes. */
export const splitShareId = (raw: string) => {
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

/**
 * Loads a share and tells the caller why it is unavailable, if it is. Shared
 * by every recipient-facing route so expiry and burn are enforced once.
 */
type LoadedShare =
  | { error: string; status: number }
  | {
      uid: string;
      shareId: string;
      ref: DocumentReference<DocumentData>;
      share: DocumentData;
      expiresOn: Date | null;
    };

export const loadShare = async (raw: string): Promise<LoadedShare> => {
  const parts = splitShareId(raw);
  if (!parts) return { error: "Malformed share link.", status: 400 };
  const ref = doc(db, `User/${parts.uid}/Smartshare/${parts.shareId}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { error: "This share link no longer exists.", status: 404 };
  const share = snap.data();
  const expiresOn = expiryOf(share.date, share.time);
  if (expiresOn && expiresOn.getTime() < Date.now()) {
    return { error: "This share link has expired.", status: 410 };
  }
  if (share.burnedAt) {
    return { error: "This link was for a single download and has been used.", status: 410 };
  }
  return { ...parts, ref, share, expiresOn };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SharePayload | { error: string }>
) {
  try {
    let loaded = await loadShare(String(req.query.id ?? ""));
    if ("error" in loaded) return res.status(loaded.status).json({ error: loaded.error });

    // Move a stuck face job along and re-read, so a recipient's poll can
    // finish sorting even after the owner closed their tab.
    if (loaded.share.faceStatus === "running") {
      await advanceShareFaces(loaded.uid, loaded.shareId).catch(() => undefined);
      const again = await loadShare(String(req.query.id ?? ""));
      if (!("error" in again)) loaded = again;
    }
    const { uid, shareId, ref, share, expiresOn } = loaded;

    // `peek` is for background polling (face status); only a real open counts.
    if (!req.query.peek) {
      updateDoc(ref, { "stats.opens": increment(1) }).catch(() => undefined);
      fireWebhook(uid, "share.opened", { shareId, name: share.name ?? null });
    }

    const filesSnap = await getDocs(collection(db, `User/${uid}/Smartshare/${shareId}/files`));

    return res.status(200).json({
      name: share.name ?? "Shared files",
      date: share.date ?? "",
      expiresInDays: share.time ?? null,
      expiresOn: expiresOn ? expiresOn.toDateString() : null,
      faceStatus: share.faceStatus ?? (share.faceGroups ? "done" : null),
      people: share.faceGroups?.people ?? [],
      noFaces: share.faceGroups?.noFaces ?? [],
      allowUploads: Boolean(share.allowUploads),
      burnAfterDownload: Boolean(share.burnAfterDownload),
      extendRequested: Boolean(share.extendRequested),
      files: filesSnap.docs.map((d) => {
        const data = d.data();
        return {
          name: data.name ?? "file",
          size: data.size ?? 0,
          type: data.type ?? "",
          url: data.url,
          ...(data.guest ? { guest: true } : {}),
        };
      }),
    });
  } catch {
    return res.status(500).json({ error: "Could not load this share." });
  }
}
