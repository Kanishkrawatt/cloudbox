import type { NextApiRequest, NextApiResponse } from "next";
import { updateDoc, increment } from "firebase/firestore";
import { loadShare } from "./[id]";
import { fireWebhook } from "@/utils/webhook";

/**
 * Recipient-side events on a share. No auth: anyone holding the link can
 * download or ask for more time, which is exactly who these come from.
 *
 *   { id, event: "download", file? }  counts a download; burns a one-shot link
 *   { id, event: "extend" }           flags the share so the owner sees the ask
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  const { id, event, file } = req.body ?? {};
  const loaded = await loadShare(String(id ?? ""));
  if ("error" in loaded) return res.status(loaded.status).json({ error: loaded.error });
  const { uid, shareId, ref, share } = loaded;

  if (event === "download") {
    const burn = Boolean(share.burnAfterDownload);
    await updateDoc(ref, {
      "stats.downloads": increment(1),
      ...(burn ? { burnedAt: new Date().toISOString() } : {}),
    });
    fireWebhook(uid, "share.downloaded", { shareId, file: file ?? null, burned: burn });
    return res.status(200).json({ status: "Done", burned: burn });
  }

  if (event === "extend") {
    if (!share.extendRequested) {
      await updateDoc(ref, { extendRequested: true });
      fireWebhook(uid, "share.extend_requested", { shareId, name: share.name ?? null });
    }
    return res.status(200).json({ status: "Done" });
  }

  return res.status(400).json({ error: "Unknown event." });
}
