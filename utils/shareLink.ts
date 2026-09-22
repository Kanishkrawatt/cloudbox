/**
 * Smart Share links are stored as a path, never as an absolute URL.
 *
 * The absolute form used to be baked into Firestore when the share was created,
 * so a link made on localhost kept pointing at localhost after deploying, and a
 * domain change orphaned every existing share. The origin is whatever host the
 * page is being viewed on.
 */
export const sharePath = (shareId: string, uid: string) =>
  `/smartshow?id=${encodeURIComponent(`${shareId}-${uid}`)}`;

/** Accepts legacy rows that stored a full URL and returns just the path. */
export const toPath = (stored?: string | null) => {
  if (!stored) return "";
  if (stored.startsWith("/")) return stored;
  try {
    const url = new URL(stored);
    return `${url.pathname}${url.search}`;
  } catch {
    return stored;
  }
};

export const absoluteShareUrl = (path: string, origin?: string) =>
  `${origin ?? (typeof window === "undefined" ? "" : window.location.origin)}${path}`;
