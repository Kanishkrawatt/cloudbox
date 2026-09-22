import type { NextApiRequest, NextApiResponse } from "next";
import { verifyIdToken } from "@/utils/cloudinaryServer";
import { fireWebhook } from "@/utils/webhook";

/** Sends a `webhook.test` event to the URL in the body, so a user can check their receiver before saving. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });
  const { idToken, url, secret } = req.body ?? {};
  const uid = await verifyIdToken(idToken);
  if (!uid) return res.status(401).json({ error: "Sign in again." });
  if (typeof url !== "string" || !/^https:\/\//.test(url)) {
    return res.status(400).json({ error: "Webhook URLs must start with https://." });
  }
  await fireWebhook(uid, "webhook.test", { uid }, { url, secret });
  return res.status(200).json({ status: "Sent" });
}
