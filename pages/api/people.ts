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
  type FaceGroupResult,
} from "@/utils/faceApi";
import { toStored, type Stored } from "./faceGroup";

/**
 * People across the whole library, not just one share.
 *
 *   { idToken, action: "status" }                 stored clusters, if any
 *   { idToken, action: "run", threshold? }        (re)group every image; 202 + jobId for big libraries
 *   { idToken, action: "poll", jobId }            finish a queued run
 *   { idToken, action: "rename", index, name }    label a cluster
 *
 * Cluster order is not stable between runs, so names are re-attached by
 * overlap: the new cluster sharing the most photos with an old named one
 * inherits its name.
 */
export const config = { maxDuration: 60 };

export type PeopleDoc = Stored & { names: (string | null)[] };

const JOB_THRESHOLD = 4;

const carryNames = (previous: PeopleDoc | undefined, next: Stored): (string | null)[] => {
  if (!previous?.names?.some(Boolean)) return next.people.map(() => null);
  return next.people.map((person) => {
    let best: { name: string; overlap: number } | null = null;
    previous.people.forEach((old, i) => {
      const name = previous.names[i];
      if (!name) return;
      const overlap = old.photos.filter((url) => person.photos.includes(url)).length;
      if (overlap > 0 && (!best || overlap > best.overlap)) best = { name, overlap };
    });
    return best ? (best as { name: string }).name : null;
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  const { idToken, action, threshold, jobId, index, name } = req.body ?? {};
  const uid = await verifyIdToken(idToken);
  if (!uid) return res.status(401).json({ error: "Sign in again." });

  const userRef = doc(db, "User", uid);
  const stored = (await getDoc(userRef)).data()?.people as PeopleDoc | undefined;

  if (action === "status") {
    return res.status(200).json({ people: stored ?? null, available: faceApiConfigured() });
  }

  if (action === "rename") {
    if (!stored || typeof index !== "number" || !stored.people[index]) {
      return res.status(400).json({ error: "No such person." });
    }
    const names = [...(stored.names ?? stored.people.map(() => null))];
    names[index] = typeof name === "string" && name.trim() ? name.trim().slice(0, 40) : null;
    await setDoc(userRef, { people: { ...stored, names } }, { merge: true });
    return res.status(200).json({ status: "Done", names });
  }

  if (!faceApiConfigured()) {
    return res.status(503).json({ error: "Face features are not configured.", configured: false });
  }

  const images = await getDocs(collection(db, `User/${uid}/Images`));
  const urls = images.docs.map((d) => d.data().url as string).filter(Boolean);

  const finish = async (body: FaceGroupResult) => {
    const next = toStored(body, urls, threshold);
    const people: PeopleDoc = { ...next, names: carryNames(stored, next) };
    await setDoc(userRef, { people }, { merge: true });
    return people;
  };

  if (action === "poll") {
    const { ok, status, body } = await faceJobStatus(jobId);
    if (!ok) return res.status(status).json({ error: faceApiError(status, body) });
    if (body.status && body.status !== "done") return res.status(200).json({ state: body.status, jobId });
    return res.status(200).json({ state: "done", people: await finish(body) });
  }

  if (action === "run") {
    if (urls.length < 2) return res.status(400).json({ error: "Upload at least two photos first." });
    if (urls.length > JOB_THRESHOLD) {
      const { ok, status, body } = await submitFaceJob(urls, threshold);
      if (!ok) return res.status(status).json({ error: faceApiError(status, body) });
      return res.status(202).json({ state: "queued", jobId: body.jobId, images: body.images });
    }
    const { ok, status, body } = await groupFaces(urls, threshold);
    if (!ok) return res.status(status).json({ error: faceApiError(status, body) });
    return res.status(200).json({ state: "done", people: await finish(body) });
  }

  return res.status(400).json({ error: "Unknown action." });
}
