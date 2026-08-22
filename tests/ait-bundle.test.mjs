import assert from "node:assert/strict";
import { stat, readFile } from "node:fs/promises";
import test from "node:test";

test("builds an uploadable today-scammer Apps in Toss bundle", async () => {
  const root = new URL("../", import.meta.url);
  const config = await readFile(new URL("apps-in-toss.config.ts", root), "utf8");
  const html = await readFile(new URL("ait-dist/index.html", root), "utf8");
  const bundle = await stat(new URL("today-scammer.ait", root));

  assert.match(config, /appName: "today-scammer"/);
  assert.match(config, /primaryColor: "#d82418"/);
  assert.match(config, /webBundleDir: "ait-dist"/);
  assert.match(html, /<title>오늘의 사기꾼<\/title>/);
  assert.ok(bundle.size > 100_000, "AIT bundle should contain the built game");
  assert.ok(bundle.size < 100_000_000, "AIT bundle must stay below the 100 MB upload limit");

  for (const asset of ["logo-oneul.webp", "scammer-01.webp", "scammer-02.webp", "scammer-06.webp", "seoyun-dubu.webp", "fake-credentials-06.webp"]) {
    const assetInfo = await stat(new URL(`ait-dist/${asset}`, root));
    assert.ok(assetInfo.size > 0, `${asset} should be included in the Toss bundle`);
  }
});
