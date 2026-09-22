/**
 * Cloudinary upload helper.
 *
 * Firebase Storage refuses every request on the no-cost Spark plan (HTTP 402
 * since Sept 2024), so file bytes live in Cloudinary instead. Firestore still
 * holds the metadata and Firebase Auth still owns the session.
 *
 * Uploads are *signed*: the browser asks our API for a signature (which proves
 * it holds a valid Firebase ID token) and only then talks to Cloudinary, so the
 * API secret never reaches the client and strangers can't upload to the account.
 */
export type CloudinaryUpload = {
  url: string;
  publicId: string;
  resourceType: string;
  bytes: number;
};

export const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

export const cloudinaryConfigured = () => CLOUD_NAME.length > 0;

export type SignResponse = {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  publicId: string;
};

export async function uploadToCloudinary({
  file,
  idToken,
  folder,
  fileName,
  onProgress,
}: {
  file: File;
  idToken: string;
  /** Path under the user's own folder, e.g. "Images" or "Folders/<id>/Images". */
  folder: string;
  fileName: string;
  onProgress?: (percent: number) => void;
}): Promise<CloudinaryUpload> {
  const signRes = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, folder, fileName }),
  });
  if (!signRes.ok) {
    const body = await signRes.json().catch(() => ({}));
    throw new Error(body.error ?? "Could not authorise the upload.");
  }
  const sign: SignResponse = await signRes.json();
  return uploadSigned(file, sign, onProgress);
}

/** Sends the bytes to Cloudinary with a signature obtained elsewhere. */
export function uploadSigned(
  file: File,
  sign: SignResponse,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUpload> {
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sign.apiKey);
  form.append("timestamp", String(sign.timestamp));
  form.append("signature", sign.signature);
  form.append("folder", sign.folder);
  form.append("public_id", sign.publicId);

  return new Promise<CloudinaryUpload>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    // `auto` lets one endpoint take images, video and plain documents.
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${sign.cloudName}/auto/upload`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onerror = () => reject(new Error("Network error while uploading."));
    xhr.onload = () => {
      let body: any = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* handled below */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.secure_url) {
        resolve({
          url: body.secure_url,
          publicId: body.public_id,
          resourceType: body.resource_type ?? "image",
          bytes: body.bytes ?? file.size,
        });
      } else {
        reject(new Error(body?.error?.message ?? `Upload failed (${xhr.status}).`));
      }
    };
    xhr.send(form);
  });
}
