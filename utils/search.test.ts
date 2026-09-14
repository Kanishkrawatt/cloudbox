import { test } from "node:test";
import assert from "node:assert/strict";
import { filterItems, filterGroups } from "./search.ts";

const items = [
  { name: "beach.png" },
  { name: "Invoice.pdf" },
  { name: "notes" },
  {},
];

test("empty query returns everything", () => {
  assert.equal(filterItems("   ", items).length, items.length);
});

test("match is case-insensitive and partial", () => {
  assert.deepEqual(filterItems("INVO", items), [{ name: "Invoice.pdf" }]);
});

test("items without a name are dropped, not thrown on", () => {
  assert.deepEqual(filterItems("zzz", items), []);
});

test("groups keep only matching members and drop empty groups", () => {
  const groups = [
    { date: "Mon", data: [{ name: "a.png" }, { name: "b.png" }] },
    { date: "Tue", data: [{ name: "c.png" }] },
  ];
  assert.deepEqual(filterGroups("b", groups), [
    { date: "Mon", data: [{ name: "b.png" }] },
  ]);
  assert.deepEqual(filterGroups("", groups), groups);
});
