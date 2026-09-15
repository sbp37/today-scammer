import assert from "node:assert/strict";
import { stat, readFile } from "node:fs/promises";
import test from "node:test";

test("builds an uploadable today-scammer Apps in Toss bundle", async () => {
  const root = new URL("../", import.meta.url);
  const config = await readFile(new URL("apps-in-toss.config.ts", root), "utf8");
  const sourceStyles = await readFile(new URL("app/globals.css", root), "utf8");
  const html = await readFile(new URL("ait-dist/index.html", root), "utf8");
  const scriptNames = [...html.matchAll(/src="\.\/assets\/([^"]+\.js)"/g)].map((match) => match[1]);
  const styleNames = [...html.matchAll(/href="\.\/assets\/([^"]+\.css)"/g)].map((match) => match[1]);
  const scripts = await Promise.all(scriptNames.map((name) => readFile(new URL(`ait-dist/assets/${name}`, root), "utf8")));
  const styles = await Promise.all(styleNames.map((name) => readFile(new URL(`ait-dist/assets/${name}`, root), "utf8")));
  const bundledScripts = scripts.join("\n");
  const bundledStyles = styles.join("\n");
  const bundle = await stat(new URL("today-scammer.ait", root));

  assert.match(config, /appName: "today-scammer"/);
  assert.match(config, /displayName: "오늘의 사기꾼"/);
  assert.match(config, /primaryColor: "#d82418"/);
  assert.match(config, /icon: "https:\/\/static\.toss\.im\/appsintoss\/78263\/cd6a08e3-aec0-451e-a977-77ac29ca6abb\.png"/);
  assert.match(config, /withTitle: true/);
  assert.match(config, /webBundleDir: "ait-dist"/);
  assert.match(html, /<title>오늘의 사기꾼<\/title>/);
  assert.ok(bundle.size > 100_000, "AIT bundle should contain the built game");
  assert.ok(bundle.size < 100_000_000, "AIT bundle must stay below the 100 MB upload limit");
  assert.doesNotMatch(bundledScripts, /pagead2|adsbygoogle|securepubads|googletag/);
  assert.match(bundledScripts, /ait\.v2\.live\.6141fea128c44f43/);
  assert.match(bundledScripts, /ait\.v2\.live\.72cbbf1ba4fb488b/);
  assert.match(bundledScripts, /userEarnedReward/);
  assert.match(bundledScripts, /attachBanner/);
  assert.match(bundledStyles, /toss-banner-home/);
  assert.match(bundledStyles, /toss-banner-result/);
  assert.match(bundledScripts, /generateHapticFeedback/);
  assert.match(bundledScripts, /tickWeak/);
  assert.match(bundledScripts, /today-scammer:free-case/);
  assert.match(bundledScripts, /intoss:\/\/today-scammer/);
  assert.match(bundledScripts, /intoss-private:\/\/appsintoss/);
  assert.match(bundledScripts, /today-scammer\.vercel\.app\/og\.webp/);
  assert.match(bundledScripts, /ait\.0000067248\.7f2a9b8a\.308820a07b\.8678318855/);
  assert.match(bundledScripts, /today-scammer:seen-new-episodes/);
  assert.match(bundledScripts, /01M1HCH8T18CN3A7AT6XFS70TN/);
  assert.match(bundledScripts, /grantReward/);
  assert.match(bundledScripts, /3,900원/);
  assert.match(bundledScripts, /createOneTimePurchaseOrder/);
  assert.match(bundledScripts, /getCompletedOrRefundedOrders/);
  assert.match(bundledScripts, /showFullScreenAd/);
  assert.match(bundledScripts, /앱인토스 인앱 결제/);
  assert.match(bundledScripts, /Toss Ads/);
  assert.match(bundledScripts, /카드번호 등 결제수단 정보를 직접 수집하거나 저장하지 않습니다/);
  assert.match(bundledScripts, /톱스타가 나만/);
  assert.match(bundledScripts, /군의관이 4억 택배를/);
  assert.doesNotMatch(bundledScripts, /인생역전 코인 선생님/);
  assert.match(bundledScripts, /takea@naver\.com/);
  assert.match(bundledScripts, /문의·제보/);
  assert.match(bundledScripts, /dataset\.runtime=.?toss/);
  assert.match(bundledStyles, /--toss-navigation-height:64px/);
  assert.match(bundledStyles, /100dvh - var\(--toss-navigation-height\)/);
  assert.match(bundledStyles, /\.choice-list button\{[^}]*min-height:54px/);
  assert.match(sourceStyles, /\.reply-dock \{[^}]*flex: 0 0 auto/);
  assert.match(html, /today-scammer\.apps\.tossmini\.com/);

  for (const asset of ["logo-oneul.webp", "scammer-01.webp", "scammer-02.webp", "scammer-03-v1.webp", "scammer-04.webp", "scammer-06.webp", "scammer-07.webp", "scammer-16.webp", "scammer-19.webp", "celebrity-selfie-07.webp", "seoyun-dubu.webp", "fake-credentials-06.webp"]) {
    const assetInfo = await stat(new URL(`ait-dist/${asset}`, root));
    assert.ok(assetInfo.size > 0, `${asset} should be included in the Toss bundle`);
  }
});
