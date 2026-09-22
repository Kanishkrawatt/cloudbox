import { createHmac } from "crypto";
import { doc, getDoc } from "firebase/firestore";
import db from "@/firebase/firestore";

/**
 * Outbound webhooks. A user can register one URL (and a secret) on the profile
 * page; server-side events POST there as JSON, signed with
 * `X-Cloudbox-Signature: sha256=<hmac of the raw body>` so the receiver can
 * check the call really came from us.
 *
 * Fire-and-forget: a slow or dead endpoint must never hold up the request
 * that produced the event.
 */
export type WebhookEvent =
  | "share.opened"
  | "share.downloaded"
  | "share.extend_requested"
  | "share.guest_upload"
  | "share.expired";

export type WebhookConfig = { url: string; secret?: string };

export const sign = (body: string, secret: string) =>
  `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

export const fireWebhook = async (
  uid: string,
  event: WebhookEvent,
  data: Record<string, unknown>,
  configOverride?: WebhookConfig | null
) => {
  try {
    const config =
      configOverride ?? ((await getDoc(doc(db, "User", uid))).data()?.webhook as WebhookConfig | undefined);
    if (!config?.url || !/^https?:\/\//.test(config.url)) return;

    const body = JSON.stringify({ event, at: new Date().toISOString(), data });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    await fetch(config.url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Cloudbox-Event": event,
        ...(config.secret ? { "X-Cloudbox-Signature": sign(body, config.secret) } : {}),
      },
      body,
    }).catch(() => undefined);
    clearTimeout(timer);
  } catch {
    /* webhooks are best-effort */
  }
};
