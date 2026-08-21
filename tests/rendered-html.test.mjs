import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
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
  assert.match(html, /og\.webp/);
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
    { root: "romanceStart", text: source.slice(source.indexOf("const romanceScenes:"), source.indexOf("const seoyunScenes:")) },
    { root: "seoyunStart", text: source.slice(source.indexOf("const seoyunScenes:"), source.indexOf("const clueOptions")) },
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
      const next = line.match(/(?:next|autoNext): "([A-Za-z]+)"/);
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

    const choiceBlocks = [...text.matchAll(/choices: \[\n([\s\S]*?)\n\s{4}\],/g)];
    assert.ok(choiceBlocks.length > 0);
    choiceBlocks.forEach((block) => {
      const choices = block[1].match(/^\s+\{ text:.*$/gm) ?? [];
      const count = choices.length;
      assert.equal(count, 3, `every scene must expose exactly 3 choices`);
      choices.forEach((choice) => {
        assert.match(choice, /(?:next|ending): "[A-Za-z0-9]+"/, `choice must lead to a scene or ending: ${choice.trim()}`);
      });
    });
  };
  blocks.forEach(validate);

  assert.doesNotMatch(source, /카카오페이|Kakao/i);
  assert.match(source, /OO페이/);
});

test("virtual money, paced ending, sharing, and second episode are explicit", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const credentialAsset = await readFile(new URL("../public/fake-credentials-06.webp", import.meta.url));
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
  assert.match(source, /seoyunScenes/);
  assert.match(source, /엄마가 갑자기 수술해야 한대요/);
  assert.match(source, /부모님이랑 제주도/);
  assert.match(source, /아빠는 돌아가셨고/);
  assert.match(source, /J님이 메시지를 쓰다가 지웠습니다/);
  assert.doesNotMatch(source, /김서윤|KIM SEOYUN/);
  assert.match(source, /autoNext: "seoyunDay8"/);
  assert.match(source, /foundClues\.length > 0 && <div className="case-meter"/);
  assert.match(source, /connectedCases = liveEpisodeIds\.filter/);
  assert.match(source, /className="connected-case-card"/);
  assert.match(source, /18만 → 43만 → 120만원/);
  assert.match(source, /없어요\. 그냥 없어요\./);
  assert.match(source, /에이, 거짓말~/);
  assert.doesNotMatch(source, /첫날부터 얻어먹으려고 하네/);
  assert.doesNotMatch(source, /첫날부터 끼니 걱정하게 하네/);
  assert.match(source, /왜 이렇게 꼬치꼬치 물어/);
  assert.match(source, /당신 잊지 않을게요\. goodbuy/);
  assert.match(source, /사랑은 국경 없고 통관료는 있음/);
  assert.match(source, /사건파일 열기/);
  assert.match(source, /fake-credentials-06\.webp/);
  assert.match(source, /게임 속 가상 서류 · 실제 자격증 아님/);
  assert.match(source, /virtual-transfer-choice/);
  assert.match(source, /readingPause/);
  assert.match(source, /featuredCaseId/);
  assert.doesNotMatch(source, /서울/);
  assert.ok(credentialAsset.byteLength > 70_000 && credentialAsset.byteLength < 130_000);
  assert.doesNotMatch(source, /광고 보고 사건파일 열기|bannerAds|rewardedNextEpisode|ADVERTISEMENT/);
});

test("uses lightweight WebP assets and meaningful live signals", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const assetDirectory = new URL("../public/", import.meta.url);
  const assets = await readdir(assetDirectory);

  assert.equal(assets.some((name) => /\.(png|jpe?g)$/i.test(name)), false);
  assert.ok(assets.filter((name) => name.endsWith(".webp")).length >= 5);
  for (const name of assets.filter((asset) => asset.endsWith(".webp"))) {
    const info = await stat(new URL(name, assetDirectory));
    assert.ok(info.size < 400_000, `${name} should remain below 400 KB`);
  }

  assert.match(source, /containsMoneyTalk/);
  assert.match(source, /잡은 증거/);
  assert.match(source, /새 단서 \$\{unfoundClues\.length\}/);
  assert.match(source, /today-scammer:clue-hint-seen/);
  assert.match(source, /disabled=\{found\}/);
  assert.doesNotMatch(source, /<em>\{suspicion\}\/\{activeCase\.clueTotal\}<\/em>/);
  assert.doesNotMatch(source, /briefing-image-hitbox|전체 이미지 보기/);
  assert.match(source, /logo-oneul\.webp/);
  assert.match(source, /scammer-02\.webp/);
  assert.match(source, /프로필 사진 크게 보기/);
  assert.match(source, /credential\.src = "\/fake-credentials-06\.webp"/);
  assert.match(styles, /onlinePulse/);
  assert.match(styles, /episode-visual\.has-portrait \{ height: 152px/);
  assert.doesNotMatch(source, /\(뷰티풀\)|very|Very|Only you|coffee 하고|I need person/);
  assert.match(source, /beautiful합니다/);
  assert.match(source, /cold 커피 한잔/);
});
