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
  assert.match(html, /속아 넘어가기 전에 탈출하라/);
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
  const dubuAsset = await readFile(new URL("../public/seoyun-dubu.webp", import.meta.url));
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
  assert.match(source, /seoyunMontageLater/);
  assert.match(source, /foundClues\.length > 0 && <div className=\{`case-meter/);
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
  assert.match(source, /seoyun-dubu\.webp/);
  assert.match(source, /게임 속 가상 서류 · 실제 자격증 아님/);
  assert.match(source, /virtual-transfer-choice/);
  assert.match(source, /readingPause/);
  assert.match(source, /featuredCaseId/);
  assert.doesNotMatch(source, /서울/);
  assert.ok(credentialAsset.byteLength > 70_000 && credentialAsset.byteLength < 130_000);
  assert.ok(dubuAsset.byteLength > 20_000 && dubuAsset.byteLength < 100_000);
  assert.doesNotMatch(source, /광고 보고 사건파일 열기|bannerAds|rewardedNextEpisode|ADVERTISEMENT/);
});

test("uses lightweight WebP assets and deliberate clue signals", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const assetDirectory = new URL("../public/", import.meta.url);
  const assets = await readdir(assetDirectory);

  assert.equal(assets.some((name) => /\.(png|jpe?g)$/i.test(name)), false);
  assert.ok(assets.filter((name) => name.endsWith(".webp")).length >= 5);
  for (const name of assets.filter((asset) => asset.endsWith(".webp"))) {
    const info = await stat(new URL(name, assetDirectory));
    assert.ok(info.size < 275_000, `${name} should remain below 275 KB`);
  }
  assert.match(source, /loading="lazy" decoding="async"/);
  assert.match(source, /fetchPriority="high"/);

  assert.match(source, /cluePrompt\?: boolean/);
  assert.match(source, /highlightedUnfoundClues/);
  assert.match(source, /잡은 증거/);
  assert.match(source, /결정적 단서 있음/);
  assert.match(source, /today-scammer:clue-hint-seen/);
  assert.match(source, /disabled=\{found \|\| wrong\}/);
  assert.match(source, /function calculateScore/);
  assert.match(source, /wrongPenalty = -wrongClues \* 3/);
  assert.match(source, /오판 \{wrongClues\}/);
  assert.match(source, /지금, 사기 냄새 맡아보기/);
  assert.match(source, /sniff-button sniff-action/);
  assert.doesNotMatch(source, /moneyAlert|containsMoneyTalk|돈 얘기, 냄새 맡아보기/);
  assert.match(source, /result-confetti/);
  assert.match(source, /후각 만렙/);
  assert.match(source, /window\.addEventListener\("popstate"/);
  assert.match(source, /todayScammerScreen/);
  assert.doesNotMatch(source, /<em>\{suspicion\}\/\{activeCase\.clueTotal\}<\/em>/);
  assert.doesNotMatch(source, /briefing-image-hitbox|전체 이미지 보기/);
  assert.match(source, /logo-oneul\.webp/);
  assert.match(source, /scammer-02\.webp/);
  assert.match(source, /프로필 사진 크게 보기/);
  assert.match(source, /credential\.src = "\/fake-credentials-06\.webp"/);
  assert.match(source, /dogPhoto\.src = "\/seoyun-dubu\.webp"/);
  assert.match(source, /VideoCallCard/);
  assert.match(source, /AI 영상도 신원 보증이 아닙니다/);
  assert.match(source, /new URLSearchParams\(window\.location\.search\)\.get\("qa"\) === "1"/);
  assert.match(source, /대화 점검 모드/);
  assert.match(source, /빠른 재생/);
  assert.match(styles, /onlinePulse/);
  assert.match(styles, /episode-visual\.has-portrait \{ height: 152px/);
  assert.match(styles, /episode-card\.case-02 .*transform: scale\(1\.3\)/);
  assert.match(styles, /brand-logo \{[^}]*width: min\(78\.2%, 391px\)/);
  assert.doesNotMatch(source, /\(뷰티풀\)|very|Very|Only you|coffee 하고|I need person/);
  assert.match(source, /beautiful합니다/);
  assert.match(source, /cold 커피 한잔/);
});

test("dialogue audit rejects broken clues, premature money replies, and repetitive verification", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const ep01 = source.slice(source.indexOf("const scenes:"), source.indexOf("const romanceScenes:"));
  const ep06 = source.slice(source.indexOf("const romanceScenes:"), source.indexOf("const seoyunScenes:"));
  const ep02 = source.slice(source.indexOf("const seoyunScenes:"), source.indexOf("const clueOptions"));
  const clueBlock = source.slice(source.indexOf("const clueOptions"), source.indexOf("const clueExplanations"));
  const definedClues = new Set([...clueBlock.matchAll(/id: "([A-Za-z]+)"/g)].map((match) => match[1]));

  for (const block of [ep01, ep06, ep02]) {
    for (const match of block.matchAll(/clues: \[([^\]]+)\]/g)) {
      for (const id of [...match[1].matchAll(/"([A-Za-z]+)"/g)].map((item) => item[1])) {
        assert.equal(definedClues.has(id), true, `undefined clue id: ${id}`);
      }
    }
    for (const match of block.matchAll(/choices: \[\n([\s\S]*?)\n\s{4}\],/g)) {
      const labels = [...match[1].matchAll(/\{ text: "([^"]+)"/g)].map((item) => item[1]);
      assert.equal(new Set(labels).size, labels.length, `duplicate choices in scene: ${labels.join(" / ")}`);
    }
  }

  const beforeFirstMoneyAsk = ep02.slice(0, ep02.indexOf("  seoyunDeposit:"));
  assert.doesNotMatch(beforeFirstMoneyAsk, /\{ text: "[^"]*(?:돈도 못 보내|가상 송금|만원 보내기)/);
  assert.match(ep02, /그냥\.\.\. 느낌이 좋았어요 ㅎㅎ/);
  assert.match(ep02, /프로필 사진은 본인 사진 맞죠\?/);
  assert.match(ep02, /산책 다녀오면 저렇게 소파에서 안 움직여요/);
  assert.doesNotMatch(ep02, /말투 편해 보여서요|프로필은 직접 쓴 거 맞죠\?|확인 안 되면 돈도 못 보내/);

  const ep01VideoChoices = [...ep01.matchAll(/\{ text: "[^"]*(?:영상통화 한 번 해주세요|영상(?:통화)?[^".]*켜봐요|영상 켜줘)[^"]*"/g)];
  const ep01NameChoices = [...ep01.matchAll(/\{ text: "[^"]*(?:본명|이름)[^"]*"/g)];
  assert.ok(ep01VideoChoices.length <= 3, `EP.01 repeats video verification ${ep01VideoChoices.length} times`);
  assert.ok(ep01NameChoices.length <= 2, `EP.01 repeats name verification ${ep01NameChoices.length} times`);
});
