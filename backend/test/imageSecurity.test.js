const test = require("node:test");
const assert = require("node:assert/strict");
const { safeImageUrl, ripleyImage } = require("../src/controllers/imageController");

test("image proxy restricts protocol, credentials, port, host and path", () => {
  assert.ok(safeImageUrl("https://rimage.ripley.cl/home.ripley/Attachment/WOP/1/1234/image.webp"));
  for (const url of [
    "http://rimage.ripley.cl/home.ripley/Attachment/x",
    "https://rimage.ripley.cl:8080/home.ripley/Attachment/x",
    "https://user:pass@rimage.ripley.cl/home.ripley/Attachment/x",
    "https://rimage.ripley.cl.evil.test/home.ripley/Attachment/x",
    "https://simple.ripley.cl/redirect?url=http://127.0.0.1",
    "https://rimage.ripley.cl/redirect",
    "file://rimage.ripley.cl/etc/passwd",
    "https://127.0.0.1/home.ripley/Attachment/x",
    ["https://rimage.ripley.cl/home.ripley/Attachment/x"],
  ]) assert.equal(safeImageUrl(url), null, String(url));
});

test("invalid image input is rejected before launching a download", async () => {
  const response = { status(code) { this.code = code; return this; }, json(data) { this.data = data; } };
  await ripleyImage({ query: { url: "https://localhost/private" }, params: {} }, response, error => { throw error; });
  assert.equal(response.code, 400);
});
