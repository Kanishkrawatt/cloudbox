import type { NextApiRequest, NextApiResponse } from "next";
import { collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import db from "../../firebase/firestore";
import { verifyIdToken } from "@/utils/cloudinaryServer";
import {
  faceApiConfigured,
  faceApiError,
  groupFaces,
  submitFaceJob,
  faceJobStatus,
  type FaceGroupResult,
} from "@/utils/faceApi";

/**
 * Over this many images the blocking endpoint outlives a serverless request:
 * eight photos take ~46s on the free instance, and Vercel caps a function at
 * 60s. Anything bigger goes through the job queue and is polled instead.
 */
const JOB_THRESHOLD = 4;

// The face service is slow enough that the default 10s would cut it off.
export const config = { maxDuration: 60 };

type Stored = {
  people: {
    photos: string[];
    faceCount: number;
    /** Best face for this person: which photo, and where in it. */
    face?: { url: string; box: { x: number; y: number; width: number; height: number } };
  }[];
  noFaces: string[];
  sortedAt: string;
  threshold: number | null;
};

/**
 * Person ids are not stable between runs, so only the URL sets are persisted.
 *
 * The service echoes the downscaled URLs it was sent, so each one is mapped back
 * to the original the library stores; otherwise nothing would ever match.
 */
const toOriginal = (url: string, originals: string[]) => {
  const tail = url.split("/upload/")[1];
  return originals.find((original) => tail && original.endsWith(tail.replace(/^w_\d+\//, ""))) ?? url;
};

const toStored = (
  result: FaceGroupResult,
  originals: string[],
  threshold?: number
): Stored => ({
  people: (result.people ?? []).map((person) => {
    // Highest-scoring detection is the cleanest crop for the chip.
    const best = [...(person.faces ?? [])].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
    return {
      photos: (person.photos ?? []).map((url) => toOriginal(url, originals)),
      faceCount: person.faceCount ?? person.photos?.length ?? 0,
      ...(best?.box
        ? { face: { url: toOriginal(best.url, originals), box: best.box } }
        : {}),
    };
  }),
  noFaces: (result.noFaces ?? []).map((url) => toOriginal(url, originals)),
  sortedAt: new Date().toISOString(),
  threshold: threshold ?? null,
});

/** The share's image URLs, needed both to sort and to map results back. */
const shareImageUrls = async (uid: string, shareId: string) => {
  const files = await getDocs(collection(db, `User/${uid}/Smartshare/${shareId}/files`));
  return files.docs
    .map((d) => d.data())
    .filter((f) => (f.type ?? "").startsWith("image/"))
    .map((f) => f.url as string);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  if (!faceApiConfigured()) {
    return res.status(503).json({
      error: "Face sorting is not configured. Set FACE_API_KEY (and FACE_API_URL) on the server.",
      configured: false,
    });
  }

  const { idToken, shareId, jobId, threshold } = req.body ?? {};
  const uid = await verifyIdToken(idToken);
  if (!uid) return res.status(401).json({ error: "Sign in again." });
  if (!shareId) return res.status(400).json({ error: "Missing share id." });

  const shareRef = doc(db, `User/${uid}/Smartshare/${shareId}`);
  const share = await getDoc(shareRef);
  if (!share.exists()) return res.status(404).json({ error: "That share no longer exists." });

  // Polling an existing job.
  if (jobId) {
    const { ok, status, body } = await faceJobStatus(jobId);
    if (!ok) return res.status(status).json({ error: faceApiError(status, body) });
    if (body.status && body.status !== "done") {
      return res.status(200).json({ state: body.status, jobId });
    }
    const stored = toStored(
      body as FaceGroupResult,
      await shareImageUrls(uid, shareId),
      threshold
    );
    await setDoc(
      shareRef,
      { faceGroups: stored, sortByFace: true, faceStatus: "done" },
      { merge: true }
    );
    return res.status(200).json({ state: "done", ...stored });
  }

  const urls = await shareImageUrls(uid, shareId);

  if (urls.length < 2) {
    await setDoc(shareRef, { faceStatus: "failed" }, { merge: true });
    return res.status(400).json({ error: "Add at least two photos to sort by face." });
  }

  // Long batches go through the job queue; the request would otherwise outlive
  // the serverless timeout on a 0.1 CPU instance.
  if (urls.length > JOB_THRESHOLD) {
    const { ok, status, body } = await submitFaceJob(urls, threshold);
    if (!ok) {
      await setDoc(shareRef, { faceStatus: "failed" }, { merge: true });
      return res.status(status).json({ error: faceApiError(status, body) });
    }
    return res.status(202).json({ state: "queued", jobId: body.jobId, images: body.images });
  }

  const { ok, status, body } = await groupFaces(urls, threshold);
  if (!ok) return res.status(status).json({ error: faceApiError(status, body) });

  const stored = toStored(body as FaceGroupResult, urls, threshold);
  await setDoc(
    shareRef,
    { faceGroups: stored, sortByFace: true, faceStatus: "done" },
    { merge: true }
  );
  return res.status(200).json({ state: "done", ...stored });
}
