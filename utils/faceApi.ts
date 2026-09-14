/**
 * Server-side client for the Sort-by-Face service.
 *
 * Contract (see Kanishkrawatt/Sort-Image-by-Face):
 *   POST /api/compare   two photos -> {match, distance, a:{faces,...}, b:{...}}
 *   POST /api/group     blocking, <= 40 images
 *   POST /api/jobs      202 {jobId,...}, <= 250 images
 *   GET  /api/jobs/:id  job status, then the same body as /api/group
 *   GET  /api/status    limits, queue depth, threshold
 * Auth is an `x-api-key` header. The key stays server-side: never expose it
 * with a NEXT_PUBLIC_ prefix.
 *
 * Notes that shape the UI:
 * - a photo appears under EVERY person in it, so groups overlap
 * - person `id` is a zero-based index, NOT stable between runs, so we persist
 *   the photo URL sets and never the id
 * - the service runs on a free Render instance: ~47s cold start, ~1-3s per
 *   image, and in-memory jobs are lost when the instance sleeps
 */
export type FacePerson = {
  id: number;
  photos: string[];
  faceCount?: number;
  faces?: { url: string; score: number; box: { x: number; y: number; width: number; height: number } }[];
};

export type FaceGroupResult = {
  people: FacePerson[];
  noFaces?: string[];
  failed?: { url: string; error: string }[];
  stats?: Record<string, number>;
};

export const faceApiConfig = () => ({
  baseUrl: (process.env.FACE_API_URL ?? "https://server-yg89.onrender.com").replace(/\/$/, ""),
  apiKey: process.env.FACE_API_KEY ?? "",
});

export const faceApiConfigured = () => Boolean(faceApiConfig().apiKey);

/**
 * Width we hand the face service.
 *
 * Measured on the free Render instance (512MB, 0.1 CPU): eight photos at w_1600
 * killed the process mid-job (502, then the in-memory job was gone), while the
 * same eight at w_800 returned 4 people / 10 faces in ~46s, repeatably. Raise
 * this if the service ever moves to a bigger box.
 */
export const FACE_IMAGE_WIDTH = 800;

/** Cheaper for the service to fetch and decode than a full-size original. */
export const downscaled = (url: string, width = FACE_IMAGE_WIDTH) =>
  url.includes("/image/upload/") && !url.includes(`/upload/w_${width}`)
    ? url.replace("/image/upload/", `/image/upload/w_${width}/`)
    : url;

const request = async (path: string, init: RequestInit = {}, timeoutMs = 120_000) => {
  const { baseUrl, apiKey } = faceApiConfig();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        ...(init.headers ?? {}),
      },
    });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, body };
  } finally {
    clearTimeout(timer);
  }
};

/** Turns the service's failure modes into something worth showing a user. */
export const faceApiError = (status: number, body: any) => {
  if (status === 401) return "The face service rejected our API key.";
  if (status === 503) return "The face service has no API key configured yet.";
  if (status === 404) return "That face job expired. Run sorting again.";
  if (status === 413) return "Too many images for one request.";
  return body?.error ?? `Face service error (${status}).`;
};

export const groupFaces = (urls: string[], threshold?: number) =>
  request("/api/group", {
    method: "POST",
    body: JSON.stringify({ imageUrls: urls.map((u) => downscaled(u)), threshold }),
  });

export const submitFaceJob = (urls: string[], threshold?: number) =>
  request("/api/jobs", {
    method: "POST",
    body: JSON.stringify({ imageUrls: urls.map((u) => downscaled(u)), threshold }),
  }, 30_000);

/**
 * A finished job nests its payload under `result`, unlike /api/group which
 * returns it at the top level. Unwrap so both paths hand back the same shape.
 */
export const faceJobStatus = async (jobId: string) => {
  const res = await request(`/api/jobs/${encodeURIComponent(jobId)}`, { method: "GET" }, 30_000);
  if (res.ok && res.body?.result) {
    return { ...res, body: { ...res.body.result, status: res.body.status } };
  }
  return res;
};

/**
 * Compares the highest-scoring face in each photo.
 *
 * Read `distance`, not `match`: the boolean is only `distance < threshold`, and
 * the distributions overlap badly (different people measured as close as 0.40,
 * the same person as far as 0.93). `faces > 1` in either photo means the answer
 * is ambiguous, because some other face may have won the comparison.
 */
export const compareFaces = (a: string, b: string, threshold?: number) =>
  request("/api/compare", {
    method: "POST",
    body: JSON.stringify({ a: downscaled(a), b: downscaled(b), threshold }),
  });

export const faceServiceStatus = () => request("/api/status", { method: "GET" }, 60_000);

export type FaceBox = { x: number; y: number; width: number; height: number };

/**
 * Crops to one specific face.
 *
 * The service reports boxes in the space of the image it was given, which is the
 * w_800 derivative we send, so the crop is chained after the same w_800 step and
 * the coordinates line up. Without this we would fall back to g_face, which
 * picks the most prominent face in the photo - often the wrong person in a
 * group shot.
 */
export const faceCrop = (url: string, box?: FaceBox, size = 160) => {
  if (!url.includes("/image/upload/")) return url;
  if (!box) return url.replace("/image/upload/", `/image/upload/c_thumb,g_face,w_${size},h_${size}/`);

  // Widen the box so the crop is a portrait rather than a tight face rectangle.
  const pad = Math.round(Math.max(box.width, box.height) * 0.45);
  const x = Math.max(0, Math.round(box.x) - pad);
  const y = Math.max(0, Math.round(box.y) - pad);
  const w = Math.round(box.width) + pad * 2;
  const h = Math.round(box.height) + pad * 2;

  return url.replace(
    "/image/upload/",
    `/image/upload/w_${FACE_IMAGE_WIDTH}/c_crop,x_${x},y_${y},w_${w},h_${h}/c_fill,w_${size},h_${size}/`
  );
};

/** Cloudinary crops to the face itself, so group chips need no server-side crop. */
export const faceThumb = (url: string, size = 96) =>
  url.includes("/image/upload/")
    ? url.replace("/image/upload/", `/image/upload/c_thumb,g_face,w_${size},h_${size}/`)
    : url;
