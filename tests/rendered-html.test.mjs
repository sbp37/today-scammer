import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

test("conversation graph has no broken, unreachable, or looping branches", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const blocks = [
    { root: "start", text: source.slice(source.indexOf("const scenes:"), source.indexOf("const romanceScenes:")) },
    { root: "romanceStart", text: source.slice(source.indexOf("const romanceScenes:"), source.indexOf("const clueOptions")) },
  ];

  const validate = ({ root, text }) => {
    const graph = {};
    let current = null;
    for (const line of text.split("\n")) {
      const node = line.match(/^\s{2}([A-Za-z]+): \{$/);
      if (node) {
        current = node[1];
        graph[current] = { next: [], endings: [] };
        continue;
      }
      if (!current) continue;
      const next = line.match(/next: "([A-Za-z]+)"/);
      const ending = line.match(/ending: "([SACF])"/);
      if (next) graph[current].next.push(next[1]);
      if (ending) graph[current].endings.push(ending[1]);
    }

    const targets = Object.values(graph).flatMap((node) => node.next);
    assert.deepEqual([...new Set(targets.filter((id) => !graph[id]))], []);

    const reached = new Set([root]);
    const endings = new Set();
    const queue = [root];
    while (queue.length) {
      const id = queue.shift();
      graph[id].endings.forEach((ending) => endings.add(ending));
      graph[id].next.forEach((next) => {
        if (!reached.has(next)) {
          reached.add(next);
          queue.push(next);
        }
      });
    }
    assert.deepEqual(Object.keys(graph).filter((id) => !reached.has(id)), []);
    assert.deepEqual([...endings].sort(), ["A", "C", "F", "S"]);

    const visit = (id, path = []) => {
      assert.equal(path.includes(id), false, `loop detected: ${[...path, id].join(" -> ")}`);
      graph[id].next.forEach((next) => visit(next, [...path, id]));
    };
    visit(root);
  };
  blocks.forEach(validate);

  assert.doesNotMatch(source, /카카오페이|Kakao/i);
  assert.match(source, /OO페이/);
});

test("virtual money, paced ending, sharing, and second episode are explicit", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const credentialAsset = await readFile(new URL("../public/fake-credentials-06.png", import.meta.url));
  const failureChoices = source.match(/^.*ending: "F".*$/gm) ?? [];

  assert.ok(failureChoices.length >= 4);
  failureChoices.forEach((choice) => {
    assert.match(choice, /\[게임 내 가상 송금\]/);
    assert.match(choice, /virtualTransfer: true/);
  });
  assert.match(source, /게임 속 시뮬레이션입니다|게임 속 가상 송금입니다/);
  assert.match(source, /게임 시뮬레이션 · 실제 금전 거래 없음/);
  assert.match(source, /CASE \$\{activeCase\.no\} 대화 기록 분석이 완료됐습니다/);
  assert.match(source, /phase === "resolved"/);
  assert.match(source, /친구도 살아남는지 보내보기/);
  assert.match(source, /romanceScenes/);
  assert.match(source, /사랑은 국경 없고 통관료는 있습니다/);
  assert.match(source, /사건파일 열기/);
  assert.match(source, /fake-credentials-06\.png/);
  assert.match(source, /GAME PROP · 실제 자격증 아님/);
  assert.ok(credentialAsset.byteLength > 100_000);
  assert.doesNotMatch(source, /광고|bannerAds|rewardedNextEpisode|ADVERTISEMENT/);
});
