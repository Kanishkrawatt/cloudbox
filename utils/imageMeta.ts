/**
 * Pure helpers for the metadata we attach to an image at upload time:
 * a perceptual hash for duplicate detection, and search tags derived from
 * OCR text and the file itself. Browser-only work (canvas, tesseract) lives in
 * imageMetaBrowser.ts so this file stays testable under node.
 */

/** dHash: 8x8 comparisons of neighbouring pixels on a 9x8 grayscale grid, as a 16-char hex string. */
export const dHashFromGray = (gray: number[] | Uint8ClampedArray, width = 9, height = 8) => {
  let bits = "";
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      const left = gray[y * width + x];
      const right = gray[y * width + x + 1];
      bits += left > right ? "1" : "0";
    }
  }
  return bits
    .match(/.{4}/g)!
    .map((nibble) => parseInt(nibble, 2).toString(16))
    .join("");
};

/** Number of differing bits between two equal-length hex hashes. */
export const hamming = (a: string, b: string) => {
  if (a.length !== b.length) return Infinity;
  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    let xor = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (xor) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  return distance;
};

/** Below this many differing bits (of 64) two photos are treated as the same shot. */
export const DUPLICATE_THRESHOLD = 6;

/**
 * Groups items whose hashes are within the threshold of each other.
 * Single-link: A~B and B~C puts all three together. Items without a hash are
 * ignored. Returns only groups of two or more.
 */
export const groupDuplicates = <T extends { phash?: string }>(
  items: T[],
  threshold = DUPLICATE_THRESHOLD
): T[][] => {
  const hashed = items.filter((item) => item.phash);
  const parent = hashed.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));

  // ponytail: O(n²) pairwise scan, fine for a personal library; bucket by hash prefix if it ever isn't.
  for (let i = 0; i < hashed.length; i++) {
    for (let j = i + 1; j < hashed.length; j++) {
      if (hamming(hashed[i].phash!, hashed[j].phash!) <= threshold) {
        parent[find(i)] = find(j);
      }
    }
  }

  const groups = new Map<number, T[]>();
  hashed.forEach((item, i) => {
    const root = find(i);
    groups.set(root, [...(groups.get(root) ?? []), item]);
  });
  return Array.from(groups.values()).filter((group) => group.length > 1);
};

const STOP = new Set([
  "this", "that", "with", "from", "have", "your", "will", "what", "when", "there",
  "their", "about", "which", "would", "these", "other", "into", "than", "then", "them",
]);

/**
 * Search tags for one file: its broad kind, the folder it went into, and the
 * most frequent words the OCR pass found. Lower-cased and de-duplicated.
 */
export const tagsFor = ({
  type,
  folder,
  text,
  limit = 12,
}: {
  type: string;
  folder?: string;
  text?: string;
  limit?: number;
}) => {
  const tags = new Set<string>();

  const kind = type.split("/")[0];
  if (kind === "image" || kind === "video" || kind === "audio") tags.add(kind);
  if (type.includes("pdf")) tags.add("pdf");
  if (/spreadsheet|excel|csv/.test(type)) tags.add("spreadsheet");
  if (/word|document/.test(type)) tags.add("document");
  if (/zip|compressed|tar/.test(type)) tags.add("archive");
  if (type === "image/png" && text && text.length > 40) tags.add("screenshot");

  if (folder) tags.add(folder.toLowerCase());

  if (text) {
    const counts = new Map<string, number>();
    for (const raw of text.toLowerCase().split(/[^a-z0-9]+/)) {
      if (raw.length < 4 || raw.length > 24 || STOP.has(raw) || /^\d+$/.test(raw)) continue;
      counts.set(raw, (counts.get(raw) ?? 0) + 1);
    }
    Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .forEach(([word]) => tags.add(word));
  }

  return Array.from(tags);
};
