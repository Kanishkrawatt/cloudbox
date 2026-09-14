import type { NextApiRequest, NextApiResponse } from "next";
import { cloudinaryEnv, signParams, verifyIdToken } from "@/utils/cloudinaryServer";

/** Keeps folder/file names inside the character set Cloudinary accepts. */
const safe = (value: string) =>
  value.replace(/[^a-zA-Z0-9-_./]/g, "_").replace(/\.+/g, ".").slice(0, 180);

/**
 * Signs one Cloudinary upload for the caller.
 *
 * Trust boundary: the caller must present a Firebase ID token, which is verified
 * against Google before anything is signed. Without that check this route would
 * let anyone upload into the account.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  // Authenticate first: an anonymous caller learns nothing about our config.
  const { idToken, folder, fileName } = req.body ?? {};
  const uid = await verifyIdToken(idToken);
  if (!uid) return res.status(401).json({ error: "Sign in again to upload." });

  const { cloudName, apiKey, apiSecret } = cloudinaryEnv();
  if (!cloudName || !apiKey || !apiSecret) {
    return res
      .status(500)
      .json({ error: "Cloudinary is not configured. Set the CLOUDINARY_* env vars." });
  }

  const timestamp = Math.round(Date.now() / 1000);
  // Scoped to the verified uid, so a token can only write into its own space.
  const scopedFolder = safe(`cloudbox/${uid}/${folder ?? "Files"}`);
  const publicId = safe(`${fileName || "file"}-${timestamp}`);

  const signature = signParams(
    { folder: scopedFolder, public_id: publicId, timestamp },
    apiSecret
  );

  return res
    .status(200)
    .json({ signature, timestamp, apiKey, cloudName, folder: scopedFolder, publicId });
}
