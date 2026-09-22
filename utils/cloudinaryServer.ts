import { createHash } from "crypto";

/** Cloudinary signs the sorted `key=value&...` param string plus the secret. */
export const signParams = (
  params: Record<string, string | number>,
  secret: string
) => {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(payload + secret).digest("hex");
};

export const cloudinaryEnv = () => ({
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Deletes one asset. Safe to call for items that predate Cloudinary, they have
 * no publicId, so there is nothing to destroy and we just report it.
 */
export const destroyAsset = async (
  publicId?: string,
  resourceType = "image"
): Promise<"deleted" | "skipped" | "failed"> => {
  const { cloudName, apiKey, apiSecret } = cloudinaryEnv();
  if (!publicId || !cloudName || !apiKey || !apiSecret) return "skipped";

  const timestamp = Math.round(Date.now() / 1000);
  const signature = signParams({ public_id: publicId, timestamp }, apiSecret);
  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: apiKey,
    signature,
  });

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
    { method: "POST", body }
  );
  const json = await res.json().catch(() => ({}));
  return json?.result === "ok" || json?.result === "not found" ? "deleted" : "failed";
};

/** Verifies a Firebase ID token against Google's identity endpoint. */
export const verifyIdToken = async (idToken?: string): Promise<string | null> => {
  const key = process.env.NEXT_PUBLIC_api_Key;
  if (!key || !idToken) return null;
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );
  if (!res.ok) return null;
  const body = await res.json();
  return body?.users?.[0]?.localId ?? null;
};
