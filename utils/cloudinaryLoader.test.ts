import { test } from "node:test";
import assert from "node:assert/strict";
import loader from "./cloudinaryLoader.ts";

test("inserts a sized, auto-format derivative for Cloudinary URLs", () => {
  const out = loader({ src: "https://res.cloudinary.com/demo/image/upload/v1/cloudbox/u/Images/a.jpg", width: 400 });
  assert.equal(out, "https://res.cloudinary.com/demo/image/upload/w_400,c_limit,f_auto,q_auto/v1/cloudbox/u/Images/a.jpg");
});

test("keeps existing transformations and honours quality", () => {
  const out = loader({ src: "https://res.cloudinary.com/demo/image/upload/c_thumb,g_face/v1/a.jpg", width: 160, quality: 60 });
  assert.equal(out, "https://res.cloudinary.com/demo/image/upload/w_160,c_limit,f_auto,q_60/c_thumb,g_face/v1/a.jpg");
});

test("leaves other hosts alone", () => {
  const src = "https://lh3.googleusercontent.com/a/photo.jpg";
  assert.equal(loader({ src, width: 100 }), src);
});
