import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

// Exercise the actual authored data, without copying scenarios into fixtures.
const source = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const dataSource = source.slice(source.indexOf('export type GameScreen'), source.indexOf('function playClueTone'));
const context = { Math, exports: {} };
runInNewContext(ts.transpileModule(`${dataSource}\nglobalThis.game = { episodes, recentEpisodeNos, liveEpisodeIds, sceneCollections, caseProfiles, virtualMoneyAtRisk, shuffleClueIds, calculateScore, clueOptions };`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
}).outputText, context);
const game = context.game;

function paths(caseId) {
  const results = [];
  const walk = (id, lost, route, handedOver = false) => {
    assert.ok(!route.includes(id), `cycle: ${caseId} ${id}`);
    const scene = game.sceneCollections[caseId][id];
    assert.ok(scene, `missing ${caseId}/${id}`);
    const balance = Math.max(0, lost - (scene.recoveredPrincipal ?? 0));
    const nextRoute = [...route, id];
    if (scene.autoNext) return walk(scene.autoNext, balance, nextRoute, handedOver);
    assert.ok(scene.choices?.length, `${id} is a dead end`);
    for (const choice of scene.choices) {
      const nextBalance = balance + (choice.virtualLoss ?? 0);
      assert.ok(nextBalance <= game.virtualMoneyAtRisk[caseId]);
      if (choice.virtualTransfer) {
        assert.ok(choice.virtualAmount, `${id} missing amount`);
        assert.ok(choice.virtualLoss > 0, `${id} uncounted transfer`);
      }
      const nextHandover = handedOver || Boolean(choice.virtualHandover);
      if (choice.ending) results.push({ lost: nextBalance, grade: choice.ending, route: nextRoute, handedOver: nextHandover });
      else { assert.ok(choice.next, `${id} missing destination`); walk(choice.next, nextBalance, nextRoute, nextHandover); }
    }
  };
  walk(game.caseProfiles[caseId].start, 0, []);
  return results;
}

test('all authored episodes have valid acyclic paths and bounded money ledgers', () => {
  for (const id of Object.keys(game.sceneCollections)) assert.ok(paths(id).length > 0);
});
test('every Elon and James transfer failure records the actual loss', () => {
  for (const [id, amount] of [['ep01', 200000], ['ep06', 480000]]) {
    for (const path of paths(id).filter((p) => p.grade === 'F')) assert.equal(path.lost, amount);
  }
});
test('coin payout returns principal; later routes lose 180 or 480 ten-thousand won', () => {
  const routes = paths('ep04');
  const early = routes.filter((p) => p.route.includes('coinWithdraw') && !p.route.includes('coinDip'));
  assert.ok(early.length); early.forEach((p) => assert.equal(p.lost, 0));
  assert.deepEqual([...new Set(routes.filter((p) => p.grade === 'F').map((p) => p.lost))].sort(), [1800000, 4800000]);
});
test('coin, ticket and three-party are playable; other upcoming cards start open', () => {
  assert.equal(game.liveEpisodeIds.length, 8);
  assert.equal(game.episodes.filter((e) => !e.live).length, 11);
  assert.ok(game.episodes.find((e) => e.no === '04').live);
  assert.ok(game.episodes.find((e) => e.no === '19').live);
  assert.ok(game.episodes.find((e) => e.no === '16').live);
  for (const no of ['17', '18']) {
    assert.ok(!game.episodes.find((e) => e.no === no).live);
    assert.ok(game.recentEpisodeNos.includes(no));
  }
  assert.ok(game.recentEpisodeNos.includes('04'));
  assert.match(source, /<details className="upcoming-episodes"[^>]*\bopen/);
});

test('three-party endings track physical handover rather than inventing a cash loss', () => {
  const routes = paths('ep16');
  assert.deepEqual([...new Set(routes.map((p) => p.grade))].sort(), ['A', 'C', 'F', 'S']);
  for (const path of routes) {
    assert.ok(path.route.length <= 8);
    assert.equal(path.lost, 0);
    assert.equal(path.handedOver, ['C', 'F'].includes(path.grade));
    if (path.handedOver) {
      assert.ok(path.route.includes('triDeposit'));
      assert.ok(path.route.includes('triPickup'));
      assert.ok(path.route.includes('triDelivered'));
      assert.ok(path.route.includes('triTrace'));
    }
    if (path.grade === 'F') assert.ok(path.route.includes('triCover'));
  }
  assert.deepEqual([...new Set(routes.flatMap((path) => path.route))].sort(), Object.keys(game.sceneCollections.ep16).sort());
  assert.match(source, /setItemHandedOver\(false\)/);
  assert.match(source, /물품 전달 보류 · 입금 50만원 확인 필요/);
});

test('three-party evidence distinguishes a real in-game deposit from the false trade story', () => {
  const scenes = game.sceneCollections.ep16;
  const deposit = scenes.triDeposit.incoming.find((line) => line.tradeRecord?.kind === 'deposit');
  assert.equal(deposit.from, 'system');
  assert.match(deposit.tradeRecord.note, /상대가 보낸 캡처가 아닙니다/);
  assert.ok(scenes.triCheck.clues.includes('triDifferentItem'));
  assert.ok(!scenes.triCheck.clues.includes('triPayerIdentity'));
  assert.ok(scenes.triFaceOff.clues.includes('triPayerIdentity'));
  assert.ok(!scenes.triStart.clues?.length);
  const clues = [...new Set(Object.values(scenes).flatMap((scene) => scene.clues ?? []))];
  assert.equal(clues.length, game.caseProfiles.ep16.clueTotal);
  const known = new Set(game.clueOptions.map((clue) => clue.id));
  for (const clue of clues) assert.ok(known.has(clue), clue);
  assert.ok(paths('ep16').some((path) => new Set(path.route.flatMap((id) => scenes[id].clues ?? [])).size === clues.length));
});

test('ticket episode has four endings, three accurate transfers and no long or orphaned branches', () => {
  const routes = paths('ep19');
  assert.deepEqual([...new Set(routes.map((p) => p.grade))].sort(), ['A', 'C', 'F', 'S']);
  for (const path of routes) {
    assert.ok(path.route.length <= 9);
    if (path.grade === 'F') {
      assert.equal(path.lost, 720000);
      assert.ok(path.route.includes('ticketError'));
      assert.ok(path.route.includes('ticketSecondPaid'));
      assert.ok(path.route.includes('ticketFinal'));
    } else if (path.grade === 'C') assert.ok([180000, 360000].includes(path.lost));
    else assert.equal(path.lost, 0);
  }
  assert.deepEqual([...new Set(routes.flatMap((path) => path.route))].sort(), Object.keys(game.sceneCollections.ep19).sort());
});

test('ticket evidence follows a request; every clue is registered and all seven can be encountered', () => {
  const scenes = game.sceneCollections.ep19;
  assert.ok(scenes.ticketStart.incoming.every((line) => !line.ticketProof));
  for (const choice of scenes.ticketStart.choices) {
    assert.equal(choice.next, 'ticketProof');
    assert.match(choice.text, /인증|내역|확인/);
  }
  assert.ok(scenes.ticketProof.incoming.some((line) => line.ticketProof?.price === '180,000원'));
  const known = new Set(game.clueOptions.map((clue) => clue.id));
  const clues = [...new Set(Object.values(scenes).flatMap((scene) => scene.clues ?? []))];
  assert.equal(clues.length, game.caseProfiles.ep19.clueTotal);
  for (const clue of clues) assert.ok(known.has(clue), clue);
  assert.ok(!scenes.ticketStart.clues?.length);
  assert.ok(paths('ep19').some((path) => new Set(path.route.flatMap((id) => scenes[id].clues ?? [])).size === clues.length));
  assert.ok(scenes.ticketRush.incoming.some((line) => typeof line === 'string' && line.includes('3분')));
  assert.ok(scenes.ticketError.clues.includes('ticketRepeat'));
  assert.ok(!scenes.ticketOffer.clues.includes('ticketRepeat'));
});
test('clue order is shuffled once per game without correctness-based positions', () => {
  const orders = new Set(Array.from({ length: 12 }, () => {
    const order = game.shuffleClueIds();
    assert.equal(new Set(order).size, game.clueOptions.length);
    return order.join(',');
  }));
  assert.ok(orders.size > 1);
  assert.doesNotMatch(source, /interleaveClueOptions|minorityPositions/);
});
test('early safe exit with all encountered evidence can receive full score', () => {
  assert.equal(game.calculateScore({ virtualMoneyLost: 0, virtualMoneyAtRisk: 200000, decisionScore: 30, foundClues: 2, totalClues: 2, earlyDetection: true, wrongClues: 0 }).total, 100);
});

test('direct episode links also mark the episode seen when entering chat', () => {
  assert.match(source, /const enterChat = \(\) => \{[\s\S]*?markNewEpisodeSeen\(activeCase.no\);[\s\S]*?openChatAt\(activeCaseId, activeCase.start\)/);
  assert.doesNotMatch(source, /useState(?:<string\[\]>)?\(getSeenNewEpisodeNos\)/);
  assert.doesNotMatch(source, /useState\(isNoAdsTestMode\)/);
});
test('selfie follows conversation and all routes to it have a contextual introduction', () => {
  for (const path of paths('ep07')) {
    assert.ok(path.route.indexOf('starProof') >= 3);
    assert.ok(path.route.indexOf('starDocumentary') < path.route.indexOf('starProof'));
  }
  assert.ok(!game.sceneCollections.ep02.seoyunFirstTransfer.clues?.includes('amountEscalation'));
  assert.ok(game.sceneCollections.ep02.seoyunSecondAsk.clues.includes('amountEscalation'));
});
test('every episode starts with one shared entry notice instead of duplicate scene notices', () => {
  for (const [caseId, profile] of Object.entries(game.caseProfiles)) {
    const firstScene = game.sceneCollections[caseId][profile.start];
    assert.ok(firstScene.incoming.every((message) => typeof message === 'string' || message.from !== 'system'), caseId);
  }
  assert.match(source, /님과의 대화가 시작되었습니다/);
  assert.doesNotMatch(source, /님이 대화방에 입장했습니다/);
});
test('coin clue labels match the revised private-room and withdrawal flow', () => {
  const labels = Object.fromEntries(game.clueOptions.map((clue) => [clue.id, clue.label]));
  assert.match(labels.borrowedProof, /100만원이 148만원/);
  assert.match(labels.scriptedReviews, /소수방/);
  assert.match(labels.ownApp, /검색 안 되는 전용 링크/);
  assert.match(labels.withdrawalFee, /새로 30만원/);
  assert.doesNotMatch(labels.casualTone, /형님/);
  const finalCopy = [...game.sceneCollections.ep04.coinTax.incoming, ...game.sceneCollections.ep04.coinFinal.incoming]
    .filter((message) => typeof message === 'string')
    .join(' ');
  assert.doesNotMatch(finalCopy, /666만원/);
  const longestCoinRoute = Math.max(...paths('ep04').map((route) => route.route.length));
  assert.ok(longestCoinRoute <= 10, `coin route is still too long: ${longestCoinRoute}`);
});
