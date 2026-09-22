import type { NextApiRequest, NextApiResponse } from "next";
import { addDoc, collection } from "firebase/firestore";
import db from "../../../firebase/firestore";
import { cloudinaryEnv, signParams } from "@/utils/cloudinaryServer";
import { loadShare } from "./[id]";
import { fireWebhook } from "@/utils/webhook";

const safe = (value: string) =>
  value.replace(/[^a-zA-Z0-9-_./]/g, "_").replace(/\.+/g, ".").slice(0, 180);

/** Guest files are capped so a stranger with the link cannot fill the owner's Cloudinary. */
const GUEST_MAX_BYTES = 25 * 1024 ** 2;
const GUEST_MAX_FILES = 50;

/**
 * Lets a recipient add files to a share the owner opened up for it.
 *
 *   { id, step: "sign", fileName }                  a Cloudinary signature scoped to the share
 *   { id, step: "record", name, size, type, url, publicId, resourceType }
 *
 * The record step checks the URL really points into the share's guest folder,
 * so this route cannot be used to attach arbitrary URLs to someone's share.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  const { id, step } = req.body ?? {};
  const loaded = await loadShare(String(id ?? ""));
  if ("error" in loaded) return res.status(loaded.status).json({ error: loaded.error });
  const { uid, shareId, share } = loaded;
  if (!share.allowUploads) return res.status(403).json({ error: "This share does not accept uploads." });

  const { cloudName, apiKey, apiSecret } = cloudinaryEnv();
  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({ error: "Uploads are not configured." });
  }
  const folder = safe(`cloudbox/${uid}/Smartshare/${shareId}/guests`);

  if (step === "sign") {
    const timestamp = Math.round(Date.now() / 1000);
    const publicId = safe(`${req.body.fileName || "file"}-${timestamp}`);
    const signature = signParams({ folder, public_id: publicId, timestamp }, apiSecret);
    return res.status(200).json({ signature, timestamp, apiKey, cloudName, folder, publicId });
  }

  if (step === "record") {
    const { name, size, type, url, publicId, resourceType } = req.body;
    if (typeof url !== "string" || !url.includes(`/${folder}/`) || !url.startsWith("https://res.cloudinary.com/")) {
      return res.status(400).json({ error: "That file is not part of this share." });
    }
    if (typeof size !== "number" || size > GUEST_MAX_BYTES) {
      return res.status(413).json({ error: "Guest files are limited to 25 MB." });
    }
    const files = collection(db, `User/${uid}/Smartshare/${shareId}/files`);
    const guestCount = Number(share.stats?.guestFiles ?? 0);
    if (guestCount >= GUEST_MAX_FILES) {
      return res.status(429).json({ error: "This share has reached its guest upload limit." });
    }
    await addDoc(files, {
      name: String(name ?? "file").slice(0, 200),
      size,
      type: String(type ?? ""),
      url,
      publicId: publicId ?? null,
      resourceType: resourceType ?? null,
      guest: true,
      date: new Date().toDateString(),
    });
    fireWebhook(uid, "share.guest_upload", { shareId, name });
    return res.status(200).json({ status: "Done" });
  }

  return res.status(400).json({ error: "Unknown step." });
}
