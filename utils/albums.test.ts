import { test } from "node:test";
import assert from "node:assert/strict";
import { onThisDay, suggestAlbums } from "./albums.ts";

const d = (s: string) => ({ date: new Date(s).toDateString() });

test("onThisDay matches month+day in earlier years only, newest first", () => {
  const items = [d("2023-09-23"), d("2024-09-23"), d("2025-09-23"), d("2024-09-22"), { date: "garbage" }];
  const hits = onThisDay(items, new Date("2025-09-23T12:00:00"));
  assert.deepEqual(
    hits.map((h) => new Date(h.date).getFullYear()),
    [2024, 2023]
  );
});

test("suggestAlbums groups consecutive days and drops small runs", () => {
  const trip = [d("2025-03-14"), d("2025-03-14"), d("2025-03-15"), d("2025-03-16"), d("2025-03-17")];
  const stray = [d("2025-04-01")];
  const later = [d("2025-06-01"), d("2025-06-01"), d("2025-06-01"), d("2025-06-01")];
  const albums = suggestAlbums([...stray, ...trip, ...later]);
  assert.equal(albums.length, 2);
  // newest first
  assert.equal(albums[0].items.length, 4);
  assert.equal(albums[0].title, "1 Jun 2025");
  assert.equal(albums[1].items.length, 5);
  assert.equal(albums[1].title, "14–17 Mar 2025");
});
