import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import db from "@/firebase/firestore";
import { faceApiConfigured, faceJobStatus, submitFaceJob, type FaceGroupResult } from "@/utils/faceApi";
import { toStored } from "@/pages/api/faceGroup";

/**
 * Finishes a share's face sorting from the server, regardless of who asks.
 *
 * Sorting used to depend on the owner's browser polling the job: close the
 * tab (or restart the dev server) and the share sat on "running" forever
 * while the result evaporated from the face service's memory. Now the job id
 * is stored on the share, and any read of the share (owner list or recipient
 * poll) moves it along: fetch the result if done, resubmit once if the job
 * vanished, mark failed after that.
 */
const MAX_ATTEMPTS = 2;

export const shareImageUrls = async (uid: string, shareId: string) => {
  const files = await getDocs(collection(db, `User/${uid}/Smartshare/${shareId}/files`));
  return files.docs
    .map((d) => d.data())
    .filter((f) => (f.type ?? "").startsWith("image/"))
    .map((f) => f.url as string);
};

export const advanceShareFaces = async (uid: string, shareId: string) => {
  if (!faceApiConfigured()) return;
  const ref = doc(db, `User/${uid}/Smartshare/${shareId}`);
  const share = (await getDoc(ref)).data();
  if (!share || share.faceStatus !== "running") return;

  const attempts: number = share.faceAttempts ?? 0;
  const urls = await shareImageUrls(uid, shareId);

  const submit = async () => {
    if (attempts >= MAX_ATTEMPTS || urls.length < 2) {
      await setDoc(ref, { faceStatus: "failed" }, { merge: true });
      return;
    }
    const { ok, body } = await submitFaceJob(urls, share.faceThreshold ?? undefined);
    await setDoc(
      ref,
      ok
        ? { faceJobId: body.jobId, faceAttempts: attempts + 1, faceSubmittedAt: new Date().toISOString() }
        : { faceStatus: "failed" },
      { merge: true }
    );
  };

  if (!share.faceJobId) return submit();

  const { ok, status, body } = await faceJobStatus(share.faceJobId);
  // In-memory jobs vanish when the free instance sleeps: resubmit, don't fail.
  if (status === 404) return submit();
  if (!ok) return;
  if (body.status && body.status !== "done") {
    if (body.status === "failed") await setDoc(ref, { faceStatus: "failed" }, { merge: true });
    return;
  }
  const stored = toStored(body as FaceGroupResult, urls, share.faceThreshold ?? undefined);
  await setDoc(ref, { faceGroups: stored, sortByFace: true, faceStatus: "done" }, { merge: true });
};
