import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import test from "node:test";

test("Google Play bundle keeps ads out of chat and offers permanent ad removal", async () => {
  const root = new URL("../", import.meta.url);
  const html = await readFile(new URL("google-play-dist/index.html", root), "utf8");
  const scriptNames = [...html.matchAll(/src="\.\/assets\/([^"]+\.js)"/g)].map((match) => match[1]);
  const scripts = await Promise.all(scriptNames.map((name) => readFile(new URL(`google-play-dist/assets/${name}`, root), "utf8")));
  const bundle = scripts.join("\n");
  const wrapper = await readFile(new URL("google-play/main.tsx", root), "utf8");
  const game = await readFile(new URL("app/page.tsx", root), "utf8");
  const manifest = await readFile(new URL("android/app/src/main/AndroidManifest.xml", root), "utf8");
  const variables = await readFile(new URL("android/variables.gradle", root), "utf8");

  assert.match(html, /<title>오늘의 사기꾼<\/title>/);
  assert.doesNotMatch(bundle, /pagead2|adsbygoogle|securepubads|googletag/);
  assert.match(wrapper, /screen === "home" \|\| screen === "ending"/);
  assert.match(wrapper, /AdMob\.removeBanner/);
  assert.match(wrapper, /AdMob\.prepareRewardVideoAd/);
  assert.match(wrapper, /AdMob\.showRewardVideoAd/);
  assert.match(wrapper, /today_scammer_ad_free/);
  assert.match(wrapper, /isConsumable: false/);
  assert.match(wrapper, /getPurchases/);
  assert.match(game, /평생 광고 없이/);
  assert.match(game, /3,900원/);
  assert.match(game, /모든 광고 영구 제거/);
  assert.match(game, /앞으로 공개되는 신규 사건도 광고 없이 플레이합니다/);
assert.match(game, /계속 바뀌는 사기 수법을 짧은 상황극으로 미리 겪어보세요/);
assert.match(game, /속아 넘어가기 전에 탈출하세요/);
  assert.match(manifest, /com\.google\.android\.gms\.ads\.APPLICATION_ID/);
  assert.match(variables, /compileSdkVersion = 36/);
  assert.match(variables, /targetSdkVersion = 36/);

  for (const icon of [
    "mipmap-mdpi/ic_launcher.png",
    "mipmap-hdpi/ic_launcher.png",
    "mipmap-xhdpi/ic_launcher.png",
    "mipmap-xxhdpi/ic_launcher.png",
    "mipmap-xxxhdpi/ic_launcher.png",
  ]) {
    const iconInfo = await stat(new URL(`android/app/src/main/res/${icon}`, root));
    assert.ok(iconInfo.size > 1_000, `${icon} should use the Today Scammer artwork`);
  }

  const publicAssets = await readdir(new URL("google-play-dist/", root));
  assert.ok(publicAssets.includes("logo-oneul.webp"));
  assert.ok(publicAssets.includes("scammer-01.webp"));
  assert.ok(publicAssets.includes("scammer-02.webp"));
  assert.ok(publicAssets.includes("scammer-06.webp"));
});
