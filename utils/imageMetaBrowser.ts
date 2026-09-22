import { dHashFromGray } from "./imageMeta";

/**
 * Browser side of upload-time image analysis. Runs before the bytes leave the
 * machine, so nothing here costs a Cloudinary add-on or a server round trip.
 * Every step is best-effort: a failure returns partial metadata, never throws.
 */
/** OCR is slow and memory-hungry; skip anything this large. */
const OCR_MAX_BYTES = 8 * 1024 ** 2;

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode failed"));
    };
    img.src = url;
  });

export const computePhash = async (file: File) => {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = 9;
  canvas.height = 8;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  ctx.drawImage(img, 0, 0, 9, 8);
  const { data } = ctx.getImageData(0, 0, 9, 8);
  const gray: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    gray.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }
  return dHashFromGray(gray);
};

/** tesseract.js is ~2 MB of wasm; loaded on first use only. */
export const extractText = async (file: File, onProgress?: (pct: number) => void) => {
  if (file.size > OCR_MAX_BYTES) return undefined;
  const { recognize } = await import("tesseract.js");
  const result = await recognize(file, "eng", {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text" && onProgress) onProgress(Math.round(m.progress * 100));
    },
  });
  const text = result.data.text.replace(/\s+/g, " ").trim();
  // Anything under a few words is noise from a photo, not a document.
  return text.split(" ").length >= 3 ? text.slice(0, 2000) : undefined;
};
