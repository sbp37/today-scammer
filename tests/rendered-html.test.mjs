import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the scammer roster", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>오늘의 사기꾼/);
  assert.match(html, /SCAMMER ARCHIVE/);
  assert.match(html, /억만장자가/);
  assert.match(html, /COMING SOON/);
  assert.match(html, /og\.png/);
});

test("ships without starter preview residue", async () => {
  const response = await render();
  const html = await response.text();

  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/);
  assert.doesNotMatch(html, /Your site is taking shape|Starter Project/);
  assert.match(html, /말이 무너지기 전에 탈출하라/);
});
