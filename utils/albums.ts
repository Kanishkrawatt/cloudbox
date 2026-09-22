/**
 * Date-driven groupings over the image library. Items carry `date` as
 * `Date.prototype.toDateString()` output ("Tue Sep 23 2025"), which is only
 * day-granular, so everything here works in whole days.
 */
type Dated = { date: string };

const DAY = 24 * 60 * 60 * 1000;

/** Calendar-day index, taken from the local date so timezones never shift a day. */
export const dayOf = (item: Dated) => {
  const d = new Date(item.date);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);
};

/** Photos taken on today's month and day in any earlier year, newest year first. */
export const onThisDay = <T extends Dated>(items: T[], today = new Date()) => {
  const month = today.getMonth();
  const day = today.getDate();
  const year = today.getFullYear();
  return items
    .filter((item) => {
      const d = new Date(item.date);
      return !Number.isNaN(d.getTime()) && d.getMonth() === month && d.getDate() === day && d.getFullYear() < year;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export type Album<T> = { title: string; start: string; end: string; items: T[] };

/**
 * Splits the library into runs of consecutive shooting days. A run becomes a
 * suggested album when it spans more than one day or holds several photos:
 * that is what a trip or an event looks like, as opposed to one stray shot.
 */
export const suggestAlbums = <T extends Dated>(
  items: T[],
  { maxGapDays = 1, minPhotos = 4 } = {}
): Album<T>[] => {
  const dated = items
    .map((item) => ({ item, day: dayOf(item) }))
    .filter((x): x is { item: T; day: number } => x.day !== null)
    .sort((a, b) => a.day - b.day);

  const runs: { item: T; day: number }[][] = [];
  for (const entry of dated) {
    const run = runs[runs.length - 1];
    if (run && entry.day - run[run.length - 1].day <= maxGapDays) run.push(entry);
    else runs.push([entry]);
  }

  return runs
    .filter((run) => run.length >= minPhotos)
    .map((run) => {
      const start = new Date(run[0].day * DAY);
      const end = new Date(run[run.length - 1].day * DAY);
      return {
        title: albumTitle(start, end),
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10),
        items: run.map((x) => x.item),
      };
    })
    .reverse();
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const albumTitle = (start: Date, end: Date) => {
  const s = `${start.getUTCDate()} ${MONTHS[start.getUTCMonth()]}`;
  if (start.getTime() === end.getTime()) return `${s} ${start.getUTCFullYear()}`;
  const sameMonth = start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear();
  const e = sameMonth
    ? `${end.getUTCDate()} ${MONTHS[end.getUTCMonth()]}`
    : `${end.getUTCDate()} ${MONTHS[end.getUTCMonth()]}`;
  return sameMonth
    ? `${start.getUTCDate()}–${e} ${end.getUTCFullYear()}`
    : `${s} – ${e} ${end.getUTCFullYear()}`;
};
