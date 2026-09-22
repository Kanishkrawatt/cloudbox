import { test } from "node:test";
import assert from "node:assert/strict";
import { dHashFromGray, hamming, groupDuplicates, tagsFor } from "./imageMeta.ts";

test("dHash is 16 hex chars and deterministic", () => {
  const gray = Array.from({ length: 72 }, (_, i) => (i % 9) * 20);
  const hash = dHashFromGray(gray);
  assert.match(hash, /^[0-9a-f]{16}$/);
  assert.equal(hash, dHashFromGray(gray));
});

test("hamming counts differing bits", () => {
  assert.equal(hamming("0000000000000000", "0000000000000000"), 0);
  assert.equal(hamming("0000000000000000", "000000000000000f"), 4);
  assert.equal(hamming("ffffffffffffffff", "0000000000000000"), 64);
  assert.equal(hamming("abc", "abcd"), Infinity);
});

test("groupDuplicates clusters near hashes and skips unhashed", () => {
  const a = { name: "a", phash: "0000000000000000" };
  const b = { name: "b", phash: "0000000000000001" }; // 1 bit off a
  const c = { name: "c", phash: "ffffffffffffffff" }; // far
  const d = { name: "d" }; // no hash
  const groups = groupDuplicates([a, b, c, d]);
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].map((x) => x.name).sort(), ["a", "b"]);
});

test("tagsFor derives kind, folder and frequent OCR words", () => {
  const tags = tagsFor({
    type: "image/png",
    folder: "Receipts",
    text: "Total total TOTAL invoice 2024 the this amazon amazon",
  });
  assert.ok(tags.includes("image"));
  assert.ok(tags.includes("receipts"));
  // OCR words come last, most frequent first.
  assert.deepEqual(tags.slice(-3), ["total", "amazon", "invoice"]);
  assert.ok(!tags.includes("this"));
  assert.ok(!tags.includes("2024"));
});
