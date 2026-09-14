import type { NextApiRequest, NextApiResponse } from "next";
import { doc, getDoc, setDoc } from "firebase/firestore";
import db from "../../firebase/firestore";
import { verifyIdToken, destroyAsset } from "@/utils/cloudinaryServer";
import { faceApiConfigured, compareFaces, faceApiError } from "@/utils/faceApi";

/**
 * Stores one reference photo of the account owner's face.
 *
 * It exists so the library can be filtered to "photos of me". It is deliberately
 * NOT a login or a lock: face comparison cannot tell a person from a photograph
 * of that person, and the descriptor distances for same-person and
 * different-person overlap, so no threshold separates them.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  const { idToken, action, url, publicId } = req.body ?? {};
  const uid = await verifyIdToken(idToken);
  if (!uid) return res.status(401).json({ error: "Sign in again." });

  const userRef = doc(db, "User", uid);

  if (action === "status") {
    const face = (await getDoc(userRef)).data()?.faceProfile;
    return res.status(200).json({
      enrolled: Boolean(face?.enrolled),
      enrolledAt: face?.enrolledAt ?? null,
      available: faceApiConfigured(),
    });
  }

  if (action === "enroll") {
    if (!faceApiConfigured()) {
      return res.status(503).json({ error: "Face features need the face service. Set FACE_API_KEY." });
    }
    if (!url) return res.status(400).json({ error: "Missing the captured face." });

    // Comparing the photo with itself is the cheapest way to ask how many faces
    // it holds: zero is unusable, more than one makes later matches ambiguous.
    const { ok, status, body } = await compareFaces(url, url);
    if (status === 422) {
      await destroyAsset(publicId);
      return res.status(422).json({ error: "No face found in that photo. Try again with more light." });
    }
    if (!ok) return res.status(status).json({ error: faceApiError(status, body) });
    if ((body.a?.faces ?? 0) > 1) {
      await destroyAsset(publicId);
      return res.status(422).json({ error: "More than one face in shot. Make sure you are alone in frame." });
    }

    const previous = (await getDoc(userRef)).data()?.faceProfile;
    if (previous?.referencePublicId) await destroyAsset(previous.referencePublicId);

    await setDoc(
      userRef,
      {
        faceProfile: {
          enrolled: true,
          referenceUrl: url,
          referencePublicId: publicId ?? null,
          enrolledAt: new Date().toISOString(),
        },
      },
      { merge: true }
    );
    return res.status(200).json({ enrolled: true });
  }

  if (action === "remove") {
    const face = (await getDoc(userRef)).data()?.faceProfile;
    if (face?.referencePublicId) await destroyAsset(face.referencePublicId);
    await setDoc(userRef, { faceProfile: { enrolled: false } }, { merge: true });
    return res.status(200).json({ enrolled: false });
  }

  return res.status(400).json({ error: "Unknown action." });
}
