"use client";

/**
 * next/image loader that asks Cloudinary for the exact size instead of routing
 * every thumbnail through Vercel's image optimizer.
 *
 * Why: the optimizer is a serverless hop per image per size, cold, metered,
 * and cached only per region. Cloudinary already sits behind a global CDN, so
 * `w_<px>,f_auto,q_auto` derivatives are generated once and then served from
 * the edge for everyone. That is the image cache; nothing to run ourselves.
 *
 * Non-Cloudinary URLs (avatars, legacy Firebase Storage) pass through untouched.
 */
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const marker = "/upload/";
  if (!src.includes("res.cloudinary.com") || !src.includes(marker)) return src;
  // Respect any transformation already in the URL (face crops etc.) by
  // prepending ours; Cloudinary applies chained segments in order.
  const [head, tail] = src.split(marker);
  const q = quality ? `q_${quality}` : "q_auto";
  return `${head}${marker}w_${width},c_limit,f_auto,${q}/${tail}`;
}
