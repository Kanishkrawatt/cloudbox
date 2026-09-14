import type { NextApiRequest, NextApiResponse } from "next";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import db from "../../firebase/firestore";
import { verifyIdToken } from "@/utils/cloudinaryServer";
import {
  faceApiConfigured,
  faceApiError,
  groupFaces,
  submitFaceJob,
  faceJobStatus,
} from "@/utils/faceApi";

/**
 * Works out which of the user's photos they appear in.
 *
 * One grouping call covers the whole library: the reference face goes in with
 * the photos, and whichever person contains the reference is "me". Comparing
 * every photo separately would be one request per image.
 */
export const config = { maxDuration: 60 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  if (!faceApiConfigured()) {
    return res.status(503).json({ error: "Face features are not configured.", configured: false });
  }

  const { idToken, threshold, refresh, jobId } = req.body ?? {};
  const uid = await verifyIdToken(idToken);
  if (!uid) return res.status(401).json({ error: "Sign in again." });

  const userRef = doc(db, "User", uid);
  const userData = (await getDoc(userRef)).data();
  const face = userData?.faceProfile;
  if (!face?.enrolled || !face.referenceUrl) {
    return res.status(400).json({ error: "Add a photo of your face first.", needsEnrollment: true });
  }

  const cached = userData?.faceMatches;
  if (!refresh && cached?.photos && cached.threshold === (threshold ?? null)) {
    return res.status(200).json({ photos: cached.photos, updatedAt: cached.updatedAt, cached: true });
  }

  const images = await getDocs(collection(db, `User/${uid}/Images`));
  const urls = images.docs.map((d) => d.data().url as string).filter(Boolean);
  if (urls.length === 0) return res.status(200).json({ photos: [], updatedAt: null });

  const finish = async (body: any) => {
    // The reference face is in the batch, so "me" is whichever person contains
    // it. The reference itself is dropped from the result.
    const mine = (body.people ?? []).find((person: { photos: string[] }) =>
      person.photos?.includes(face.referenceUrl)
    );
    const matched: string[] = (mine?.photos ?? []).filter(
      (url: string) => url !== face.referenceUrl
    );
    // The service echoes the downscaled URLs it was given; map back to the
    // originals so the result can be compared against what the library stores.
    const photos = urls.filter((original) => {
      const tail = original.split("/upload/")[1];
      return matched.some((url) => tail && url.endsWith(tail));
    });
    const updatedAt = new Date().toISOString();
    await setDoc(
      userRef,
      { faceMatches: { photos, updatedAt, threshold: threshold ?? null } },
      { merge: true }
    );
    return { photos, updatedAt, stats: body.stats ?? null };
  };

  // Polling a job started by an earlier call.
  if (jobId) {
    const { ok, status, body } = await faceJobStatus(jobId);
    if (!ok) return res.status(status).json({ error: faceApiError(status, body) });
    if (body.status && body.status !== "done") {
      return res.status(200).json({ state: body.status, jobId });
    }
    return res.status(200).json({ state: "done", ...(await finish(body)) });
  }

  // One reference plus the library: past a handful of photos this outlives a
  // serverless request, so it goes through the job queue.
  if (urls.length + 1 > 4) {
    const { ok, status, body } = await submitFaceJob([face.referenceUrl, ...urls], threshold);
    if (!ok) return res.status(status).json({ error: faceApiError(status, body) });
    return res.status(202).json({ state: "queued", jobId: body.jobId, images: body.images });
  }

  const { ok, status, body } = await groupFaces([face.referenceUrl, ...urls], threshold);
  if (!ok) return res.status(status).json({ error: faceApiError(status, body) });

  return res.status(200).json({ state: "done", ...(await finish(body)) });
}
