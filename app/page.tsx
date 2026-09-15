"use client";

/* eslint-disable @next/next/no-img-element -- Local artwork is pre-compressed WebP and served directly by the Vinext asset layer. */

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AdBanner } from "./components/ad-banner";

export type GameScreen = "home" | "briefing" | "chat" | "ending";
type Screen = GameScreen;
type Phase = "incoming" | "choice" | "reply" | "resolved";
type EndingGrade = "S" | "A" | "C" | "F";
export type CaseId = "ep01" | "ep02" | "ep03" | "ep04" | "ep06" | "ep07" | "ep16" | "ep19";
export type RewardedUnlockResult = "earned" | "dismissed" | "not-ready" | "unavailable" | "failed";
type ElunSceneId = "start" | "whyMe" | "reverseMoney" | "reverseJoke" | "videoCall" | "space" | "aiVideo" | "photo" | "photoJoke" | "sendMoney" | "company" | "fastBond" | "realName" | "nameExcuse" | "investment" | "selfInvest" | "companyInfo" | "fakeLink" | "finalPitch";
type RomanceSceneId = "romanceStart" | "romanceWhy" | "romanceVideo" | "romanceProfile" | "romanceCredential" | "romanceCertificateCheck" | "romanceDay" | "romanceHeart" | "romanceHeartJoke" | "romanceFlirt" | "romancePromise" | "romanceBond" | "romanceParcel" | "romanceBoxDetails" | "romanceProof" | "romanceCourier" | "romanceLink" | "romanceFinal";
type SeoyunSceneId = "seoyunStart" | "seoyunWhy" | "seoyunWork" | "seoyunDog" | "seoyunMontage" | "seoyunMontageLater" | "seoyunDay8" | "seoyunHospital" | "seoyunDelete" | "seoyunConfide" | "seoyunDeposit" | "seoyunFamily" | "seoyunVerify" | "seoyunFirstTransfer" | "seoyunSecondAsk" | "seoyunVideo" | "seoyunSecondTransfer" | "seoyunFinal";
type CoinSceneId = "coinStart" | "coinProof" | "coinRoom" | "coinApp" | "coinWithdraw" | "coinBig" | "coinDip" | "coinAverage" | "coinDeep" | "coinTax" | "coinFinal";
type ProsecutorSceneId = "prosStart" | "prosIncident" | "prosSecrecy" | "prosCallback" | "prosVideo" | "prosDocument" | "prosDeadline" | "prosSafeAccount" | "prosPersonal" | "prosVerify";
type CelebritySceneId = "starStart" | "starProof" | "starBond" | "starDocumentary" | "starSecret" | "starNextNight" | "starMeet" | "starVerify" | "starDeposit" | "starAfterFirst" | "starPressure" | "starQuiz" | "starOfficial";
type TicketSceneId = "ticketStart" | "ticketProof" | "ticketCheck" | "ticketOffer" | "ticketRush" | "ticketOfficial" | "ticketExcuse" | "ticketError" | "ticketRefund" | "ticketSecondPaid" | "ticketFinal";
type ThreePartySceneId = "triStart" | "triArrange" | "triWho" | "triDeposit" | "triPickup" | "triCheck" | "triFaceOff" | "triDelivered" | "triTrace" | "triCover";
type SceneId = ElunSceneId | RomanceSceneId | SeoyunSceneId | ProsecutorSceneId | CoinSceneId | CelebritySceneId | TicketSceneId | ThreePartySceneId;

type TicketProof = { event: string; schedule: string; seat: string; price: string };
type TradeRecord = { kind: "deposit" | "comparison"; title: string; rows: { label: string; value: string }[]; note: string };

/* A fake trading-app balance, drawn with game UI so the number can climb and crash on screen. */
type Portfolio = { label: string; balance: string; delta: string; up: boolean; principal: string; note: string; variant?: "member-proof" };

type Message = {
  id: number;
  from: "scammer" | "player" | "system";
  text?: string;
  image?: string;
  alt?: string;
  imageFallback?: string;
  callCard?: boolean;
  portfolio?: Portfolio;
  ticketProof?: TicketProof;
  tradeRecord?: TradeRecord;
};

type IncomingMessage = string | {
  text?: string;
  image?: string;
  alt?: string;
  imageFallback?: string;
  from?: "scammer" | "system";
  pauseBefore?: number;
  typingMs?: number;
  abortTyping?: boolean;
  callCard?: boolean;
  portfolio?: Portfolio;
  ticketProof?: TicketProof;
  tradeRecord?: TradeRecord;
};

type ChoiceBase = {
  text: string;
  risk?: number;
  virtualTransfer?: boolean;
  virtualAmount?: string;
  virtualLoss?: number;
  virtualHandover?: boolean;
};

type ScoreInput = {
  virtualMoneyLost: number;
  virtualMoneyAtRisk: number;
  decisionScore: number;
  foundClues: number;
  totalClues: number;
  earlyDetection: boolean;
  wrongClues: number;
};

type ScoreBreakdown = {
  total: number;
  wallet: number;
  decisions: number;
  evidence: number;
  earlyBonus: number;
  wrongPenalty: number;
};

type Choice = ChoiceBase & {
  next?: SceneId;
  ending?: EndingGrade;
  replies?: string[];
};

type Scene = {
  incoming: IncomingMessage[];
  recoveredPrincipal?: number;
  choices?: Choice[];
  clues?: string[];
  cluePrompt?: boolean;
  autoNext?: SceneId;
  autoDelay?: number;
};

const BUILD_TAG = "three-party-episode-r1";

/* Display copy only: the underlying scene count and pacing are unchanged. */
const EPISODE_DURATION = "짧은 대화형 사건";

const episodes = [
  { no: "01", mark: "EM", name: "억만장자가 20만원이\n없대요", scammer: "일런 모스크바", type: "유명인 사칭", line: "지갑은 분실, 자신감은 보유 중", accent: "#ff4e29", live: true },
  { no: "02", mark: "J", name: "엄마가 갑자기\n수술해야 한대요", scammer: "J · 26", type: "소개팅 DM", line: "평범한 DM은 8일 뒤 부탁이 됐다", accent: "#ff7fac", live: true },
  { no: "03", mark: "檢", name: "검사님이\n내 통장을 걱정한다", scammer: "검사 K", type: "기관 사칭", line: "내 잔고에 나보다 관심이 많은 공무원", accent: "#00d9ff", live: true },
  { no: "04", mark: "₿", name: "출금하려면\n돈을 더 내래요", scammer: "차트도사 불기둥", type: "투자사기", line: "손실은 경험, 수익은 곧 예정", accent: "#ffd600", live: true },
  { no: "05", mark: "BOX", name: "택배가 왔는데\n내가 시킨 게 없다", scammer: "행복택배 11팀", type: "스미싱", line: "상자는 없고 링크만 도착함", accent: "#bd7cff" },
  { no: "06", mark: "♥", name: "군의관이 4억 택배를\n보냈대요", scammer: "Dr. 제임스 초이", type: "로맨스스캠", line: "사랑은 국경 없고 통관료는 있음", accent: "#ff5c93", live: true },
  { no: "07", mark: "★", name: "톱스타가 나만\n특별하대요", scammer: "나유명 · 32", type: "유명인 사칭", line: "선택받은 줄 알았는데 통장이 선택받았다", accent: "#52f2b8", live: true },
  { no: "08", mark: "HR", name: "대기업\n채용 담당자", scammer: "글로벌인재 3팀", type: "취업사기", line: "입사 전부터 지갑이 출근함", accent: "#ff8a00" },
  { no: "09", mark: "CARD", name: "내가 모르는 카드가\n발급됐대요", scammer: "긴급카드센터", type: "카드발급 사칭", line: "내 카드보다 내 정보를 더 잘 앎", accent: "#46a3ff" },
  { no: "10", mark: "LOAN", name: "대출받으려는데\n왜 내가 먼저 돈을 내죠?", scammer: "최저금리 박실장", type: "대출빙자", line: "돈을 빌리려면 먼저 돈을 빌려달란다", accent: "#ff6b64" },
  { no: "11", mark: "UP", name: "단톡방 사람들 전부\n돈 벌고 있대요", scammer: "VIP 수익방", type: "투자리딩방", line: "대화 인원 84명, 사람은 몇 명?", accent: "#eaff3d" },
  { no: "12", mark: "AI", name: "AI가 알아서\n돈을 벌어준대요", scammer: "퀀텀AI 김박사", type: "AI 투자사기", line: "인공지능보다 입금지능을 선호함", accent: "#00e0b8" },
  { no: "13", mark: "100", name: "단체 주문인데\n이것 좀 대신 사주세요", scammer: "동네산악회 총무", type: "노쇼 대리구매", line: "등산은 안 오고 영수증만 정상 등반", accent: "#d891ff" },
  { no: "14", mark: "法", name: "법이 바뀌어서\n이걸 꼭 사야 한대요", scammer: "안전점검 홍반장", type: "안전점검 사칭", line: "오늘 처음 생긴 법을 오늘부터 단속", accent: "#ffb800" },
  { no: "15", mark: "REV", name: "리뷰 몇 개 쓰면\n돈을 준대요", scammer: "재택부업 이팀장", type: "팀미션·부업", line: "별점 다섯 개, 통장 잔액 한 개", accent: "#ff76c8" },
  { no: "16", mark: "3", name: "돈은 받았는데\n사기꾼이 됐대요", scammer: "쿨거래만합니다", type: "삼자사기", line: "네고는 없는데 등장인물이 늘어난다", accent: "#46a3ff", live: true },
  { no: "17", mark: "PAY", name: "안전결제인데\n돈을 또 보내래요", scammer: "안전거래 상담원", type: "가짜 안전결제", line: "안전하다는 링크 밖에서 시작된 거래", accent: "#52f2b8" },
  { no: "18", mark: "CHAT", name: "채팅만 대신 하면\n일당을 준대요", scammer: "거래대행 매니저", type: "계정 대여 부업", line: "돈 대신 내 계정을 빌려달라는 부탁", accent: "#ffb800" },
  { no: "19", mark: "TICKET", name: "매진인데 이 사람만\n표가 있대요", scammer: "앵콜한번더", type: "티켓 거래 사기", line: "정가라더니 입금만 앵콜", accent: "#ff7fac", live: true },
];

const liveEpisodeIds: CaseId[] = ["ep01", "ep06", "ep02", "ep03", "ep07", "ep04", "ep19", "ep16"];
// Editorial release flags, visible to first-time visitors as well as returning players.
const recentEpisodeNos = ["01", "02", "03", "04", "06", "07", "16", "17", "18", "19"];
const caseIdFromEpisodeNo = (no: string): CaseId => no === "16" ? "ep16" : no === "19" ? "ep19" : no === "07" ? "ep07" : no === "06" ? "ep06" : no === "04" ? "ep04" : no === "03" ? "ep03" : no === "02" ? "ep02" : "ep01";
const virtualMoneyAtRisk: Record<CaseId, number> = { ep01: 200000, ep02: 1810000, ep03: 3200000, ep04: 4800000, ep06: 480000, ep07: 500000, ep16: 500000, ep19: 720000 };

const caseProfiles = {
  ep01: { no: "01", title: "억만장자가 20만원이 없대요", scammer: "일런 모스크바", alias: "ELUN MOSKVA · World Famous Tech CEO(?)", type: "유명인 사칭", portrait: "/scammer-01.webp", duration: EPISODE_DURATION, start: "start" as SceneId, virtualAmount: "20만원", tactic: "유명인 DM → 친밀감 → 링크 → 추가 가상 송금", clueTotal: 7 },
  ep02: { no: "02", title: "엄마가 갑자기 수술해야 한대요", scammer: "J", alias: "J · 26 · 마케팅 회사 · 두부 보호자", type: "로맨스스캠", portrait: "/scammer-02.webp", duration: EPISODE_DURATION, start: "seoyunStart" as SceneId, virtualAmount: "총 181만원", tactic: "평범한 소개팅 DM → 8일 친밀감 → 가족 위기 → 소액 부탁 → 금액 상승", clueTotal: 7 },
  ep03: { no: "03", title: "검사님이 내 통장을 걱정한다", scammer: "검사 K", alias: "국가수사협조팀", type: "기관 사칭", portrait: "/scammer-03-v1.webp", duration: EPISODE_DURATION, start: "prosStart" as SceneId, virtualAmount: "320만원", tactic: "기관 사칭 → 공포 조성 → 고립 → 확인 방해 → 시간 압박 → 안전계좌 가상 송금", clueTotal: 7 },
  ep04: { no: "04", title: "출금하려면 돈을 더 내래요", scammer: "차트도사 불기둥", alias: "차트도사 불기둥 · 투자 자격 없음", type: "투자사기", portrait: "/scammer-04.webp", duration: EPISODE_DURATION, start: "coinStart" as SceneId, virtualAmount: "최대 480만원", tactic: "무료 강의 → 선별된 후기 → 전용 거래 화면 → 소액 출금 → 큰 입금 → 출금 보증금 요구", clueTotal: 7 },
  ep06: { no: "06", title: "군의관이 4억 택배를 보냈대요", scammer: "Dr. 제임스 초이", alias: "JAMES CHOI · FIELD SURGEON(?)", type: "로맨스스캠", portrait: "/scammer-06.webp", duration: EPISODE_DURATION, start: "romanceStart" as SceneId, virtualAmount: "48만원", tactic: "낯선 DM → 관계 만들기 → 가짜 자격증 → 고액 택배 → 통관비 가상 송금", clueTotal: 8 },
  ep07: { no: "07", title: "톱스타가 나만 특별하대요", scammer: "나유명", alias: "not_youmyeong_00 · 배우 · 가수", type: "유명인 사칭", portrait: "/scammer-07.webp", duration: EPISODE_DURATION, start: "starStart" as SceneId, virtualAmount: "총 50만원", tactic: "비밀계정 DM → 특별한 팬 → 둘만의 비밀 → VIP 인증 예치금 → 추가 가상 송금", clueTotal: 8 },
  ep19: { no: "19", title: "매진인데 이 사람만 표가 있대요", scammer: "앵콜한번더", alias: "encore_1more · 정가 양도하는 팬", type: "티켓 거래 사기", portrait: "/scammer-19.webp", duration: EPISODE_DURATION, start: "ticketStart" as SceneId, virtualAmount: "최대 72만원", tactic: "정가 양도 → 예매 캡처 → 개인 입금 → 오류 핑계로 재입금 → 환불 조건으로 추가금", clueTotal: 7 },
  ep16: { no: "16", title: "돈은 받았는데 사기꾼이 됐대요", scammer: "쿨거래만합니다", alias: "중고거래 계정 · 네고 없이 바로 거래", type: "삼자사기", portrait: "/scammer-16.webp", duration: EPISODE_DURATION, start: "triStart" as SceneId, virtualAmount: "50만원 상당 게임기", tactic: "내 게임기 판매 → 다른 사람의 입금 → 대리 수거 → 서로 다른 거래 발견 → 기록 확보와 공식 확인", clueTotal: 7 },
} as const;

const scenes: Record<ElunSceneId, Scene> = {
  start: {
    incoming: [
      "안녕하세요. 저는 세계적으로 유명한 테크 기업 CEO Elun Moskva 입니다.",
      "현재 한국에 비밀 일정으로 와 있습니다.",
      "그런데 지갑을 잃었습니다.",
      "OO페이로 20만원만 가능합니까? 내일 200만원으로 반환합니다.",
    ],
    clues: ["dm", "money"],
    cluePrompt: true,
    choices: [
      { text: "진짜 그 CEO 맞아요? 저 뉴스에서 봤어요!", next: "whyMe", risk: 1 },
      { text: "영상통화 한 번 해주세요.", next: "videoCall" },
      { text: "제가 더 급한데 30만원 보내주세요.", next: "reverseMoney" },
    ],
  },
  whyMe: {
    incoming: [
      "좋은 질문입니다.",
      "제 보안 알고리즘이 한국에서 가장 신뢰 가능한 사람으로 당신을 추천.",
      "코드명은 TRUST-KOREA-2026 입니다.",
    ],
    clues: ["fast"],
    choices: [
      { text: "그 알고리즘, 회사 공식 계정으로 확인해요.", next: "company" },
      { text: "그래서 20만원은 어디로 보내죠?", next: "sendMoney", risk: 1 },
      { text: "저도 제가 좀 특별하다고 생각해요.", next: "fastBond", risk: 1 },
    ],
  },
  reverseMoney: {
    incoming: [
      "저도 현재 자금 사정이 어렵습니다.",
      "그래서 당신에게 20만원을 요청한 것입니다. 이해를 요청합니다.",
    ],
    choices: [
      { text: "억만장자 둘이서 서로 돈이 없네요.", next: "reverseJoke" },
      { text: "회사 직원한테 부탁하세요.", next: "company" },
      { text: "알겠어요. 계좌 주세요.", next: "sendMoney", risk: 1 },
    ],
  },
  reverseJoke: {
    incoming: [
      "정확한 상황 분석입니다.",
      "하지만 저는 20만원만 더 없습니다.",
    ],
    choices: [
      { text: "지갑 잃었다는 사진이라도 보내요.", next: "photo" },
      { text: "회사 직원한테 부탁하세요.", next: "company" },
      { text: "정말 20만원만요?", next: "sendMoney", risk: 1 },
    ],
  },
  videoCall: {
    incoming: ["현재 국제 우주 보안 규정 때문에 영상통화는 가능하지 않습니다."],
    clues: ["video"],
    choices: [
      { text: "한국에 있다면서요?", next: "space" },
      { text: "영상도 AI로 만들 수 있죠. 공식 계정으로 확인할게요.", ending: "S", replies: ["AI는 저의 경쟁 회사 기술입니다. 하지만 공식 계정은 지금 비공식 휴식 중—"] },
      { text: "그 우주 규정째 차단할게요.", ending: "S", replies: ["잠깐. 화성 와이파이가—"] },
    ],
  },
  space: {
    incoming: [
      "한국도 우주의 일부입니다.",
      "중요 인물의 보안은 장소를 가리지 않습니다.",
    ],
    clues: ["video"],
    choices: [
      { text: "그럼 우주에서도 8초는 되죠? 켜봐요.", next: "aiVideo" },
      { text: "영상 말고 회사 공식 계정으로 확인할게요.", next: "company" },
      { text: "[게임 내 가상 송금] 20만원 보내기", virtualTransfer: true, virtualAmount: "20만원", virtualLoss: 200000, ending: "F", replies: ["좋습니다. 우주 보안보다 가상 송금이 빠릅니다. 확인했습니다."] },
    ],
  },
  aiVideo: {
    incoming: [
      { callCard: true, text: "8초 영상통화 · 입 모양이 목소리보다 조금 늦습니다.", typingMs: 900 },
      "보셨습니까? 저는 매우 실시간입니다.",
    ],
    clues: ["video"],
    cluePrompt: true,
    choices: [
      { text: "입 모양이 늦는데요. 이 영상도 못 믿겠어요.", ending: "S", replies: ["지연은 화성 탓입니다. 제 얼굴 탓은 아닙니다."] },
      { text: "얼굴 봤으니 일단 믿어볼게요.", next: "fastBond", risk: 2 },
      { text: "영상이 나와도 공식 계정 확인이 먼저죠.", next: "company" },
    ],
  },
  photo: {
    incoming: [
      "카메라는 현재 보안 업데이트 중입니다.",
      "셀카는 72시간 후 가능합니다.",
      "대신 제 진심을 믿어주세요.",
    ],
    clues: ["video"],
    choices: [
      { text: "카메라도 지갑과 같이 잃었나요?", next: "photoJoke" },
      { text: "진심을 믿어볼게요.", next: "fastBond", risk: 1 },
      { text: "이 정도면 그냥 차단할래요.", ending: "S", replies: ["진심 전송이 실패했습니다."] },
    ],
  },
  photoJoke: {
    incoming: ["둘은 다른 분실입니다. 카메라는 분실하지 않고 보안만 고장."],
    choices: [
      { text: "알겠어요. 더 들어볼게요.", next: "fastBond" },
      { text: "그 진심이라는 걸 믿어볼게요.", next: "fastBond", risk: 1 },
      { text: "설명까지 고장났네요. 차단.", ending: "S", replies: ["설명 복구는 72시간 후—"] },
    ],
  },
  sendMoney: {
    incoming: [
      "당신은 정말 친절한 사람입니다.",
      "송금은 제 한국 매니저의 임시 안전계정으로 해주세요.",
      "[게임용 가상계좌] 000-오늘의사기꾼-001",
    ],
    clues: ["money"],
    choices: [
      { text: "[게임 내 가상 송금] 20만원 보내기", virtualTransfer: true, virtualAmount: "20만원", virtualLoss: 200000, ending: "F", replies: ["가상 입금 확인. 당신은 인류의 좋은 친구입니다. 저는 대화방 나갑니다."] },
      { text: "개인 계좌로 왜 보내요?", next: "company" },
      { text: "회사 공식 요청서를 보내주세요.", next: "company" },
    ],
  },
  company: {
    incoming: [
      "공식 회사 계정과 요청서는 비밀 일정에 사용 불가능.",
      "회사 자금은 현재 화성 계정에 묶여 있습니다.",
      "한국 원화로 바로 인출은 어렵습니다.",
    ],
    clues: ["money"],
    choices: [
      { text: "회사도 모르게 저한테 부탁하는 이유가 뭐죠?", next: "fastBond" },
      { text: "그럼 내일 해결하세요.", ending: "A", replies: ["내일은 화성 공휴일. 하지만 대화는 종료합니다."] },
      { text: "[게임 내 가상 송금] 20만원 도와드리기", virtualTransfer: true, virtualAmount: "20만원", virtualLoss: 200000, ending: "F", replies: ["역시 한국의 신뢰 가능한 사람. 가상 입금 확인했습니다."] },
    ],
  },
  fastBond: {
    incoming: [
      "솔직히 돈보다 중요한 것이 있습니다.",
      "짧게 대화했지만 당신은 다른 사람과 다릅니다. 아주 특별합니다.",
      "저는 한국에 진짜 친구가 생긴 기분.",
    ],
    clues: ["fast"],
    choices: [
      { text: "제 이름은 알고 특별하다고 하시는 거예요?", next: "realName" },
      { text: "친구라면 회사 공식 계정으로 다시 연락해요.", ending: "A", replies: ["공식 친구 절차는 현재 화성에서 심사 중입니다."] },
      { text: "2분 우정은 체험판 같네요. 다음 얘기는요?", next: "investment", risk: 1 },
    ],
  },
  realName: {
    incoming: [
      "아, 당신 이름 말입니까. 보안 알고리즘이 개인정보는 가렸습니다. 제 이름부터 다시 소개하겠습니다.",
      "제 법적 이름은 Elun Reeve Moskva 입니다.",
      "철자는 보안상 약간 다를 수 있습니다. 러시아와 관계는 현재 없습니다.",
      "그리고 당신에게만 좋은 기회가 있습니다.",
    ],
    choices: [
      { text: "철자가 보안상 달라진다고요?", next: "nameExcuse" },
      { text: "무슨 기회인데요?", next: "investment" },
      { text: "이쯤에서 차단합니다.", ending: "S", replies: ["좋은 기회가 매우 빠르게 종료—"] },
    ],
  },
  nameExcuse: {
    incoming: ["철자가 같으면 해커가 저를 찾습니다. 지금도 거의 찾았습니다."],
    choices: [
      { text: "그래서 좋은 기회가 뭔데요?", next: "investment" },
      { text: "본명은 됐고 회사 정보나 주세요.", next: "companyInfo" },
      { text: "해커보다 제가 먼저 차단할게요.", ending: "S", replies: ["해커보다 빠른 사람은 처음—"] },
    ],
  },
  investment: {
    incoming: [
      "제가 비밀 준비 중인 MARS COIN 사전 투자입니다.",
      "5만원이 오늘 밤 50만원.",
      "당신은 특별 초대 대상. 다른 사람에게는 절대 말하지 마세요.",
      "mars-vip-bonus.com/only-you",
    ],
    clues: ["fast", "link"],
    choices: [
      { text: "900%면 본인이 전재산 넣어요.", next: "selfInvest" },
      { text: "[가상] 링크를 눌러볼게요.", next: "fakeLink", risk: 3 },
      { text: "사업자 정보랑 공식 사이트 주세요.", next: "companyInfo" },
    ],
  },
  selfInvest: {
    incoming: [
      "제 전재산은 이미 저의 전재산입니다.",
      "그리고 회사 돈은 화성 계정. 제가 저에게 송금은 불가능.",
    ],
    choices: [
      { text: "그럼 사업자 정보부터 주세요.", next: "companyInfo" },
      { text: "[가상] 링크나 볼게요.", next: "fakeLink", risk: 3 },
      { text: "그 투자, 혼자 많이 하세요.", ending: "A", replies: ["혼자는 비밀 유지에 가장 안전합니다."] },
    ],
  },
  companyInfo: {
    incoming: [
      "사업자 등록지는 화성입니다.",
      "지구 관할에는 아직 서류가 없습니다.",
      "그리고 이 기회는 7분 안에 종료.",
    ],
    clues: ["rush"],
    choices: [
      { text: "7분 뒤 부자가 되는 건 포기할게요.", ending: "A", replies: ["가난 유지 선택을 확인했습니다."] },
      { text: "그래도 5만원 정도는…", next: "fakeLink", risk: 3 },
      { text: "그냥 지금 차단.", ending: "S", replies: ["화성 사업자 조회가 완료되기 전에—"] },
    ],
  },
  fakeLink: {
    incoming: [
      "참여 전에 본인 인증이 먼저 필요합니다.",
      "본인 인증은 생년월일과 휴대폰 번호가 필요.",
      "걱정하지 마세요. 매우 안전합니다.",
      "자물쇠 이모지도 있습니다. 🔒",
    ],
    clues: ["link"],
    cluePrompt: true,
    choices: [
      { text: "[가상] 개인정보를 입력한다.", next: "finalPitch", risk: 3 },
      { text: "자물쇠 이모지가 보안 인증은 아니죠.", ending: "A", replies: ["이모지가 국제 인증이 아닙니까? 오늘 처음 알았습니다."] },
      { text: "여기서 차단한다.", ending: "C", replies: ["자물쇠가 있는데 왜 차단을—"] },
    ],
  },
  finalPitch: {
    incoming: [
      "축하합니다. 체험 화면의 5만원이 18만4천원 됐습니다.",
      "출금 보증금 20만원만 필요. 남은 시간 07:00.",
    ],
    clues: ["profit", "rush", "money"],
    cluePrompt: true,
    choices: [
      { text: "[게임 내 가상 송금] 20만원 보내기", virtualTransfer: true, virtualAmount: "20만원", virtualLoss: 200000, ending: "F", replies: ["가상 입금 확인. 출금에는 국제 세금 12만9천원 더 필요.", "저는 지금 매우 잠시 오프라인."] },
      { text: "화면만 부자인데요?", ending: "A", replies: ["화면도 자산입니다. 만질 수는 없습니다."] },
      { text: "경찰에 링크와 계좌 보냅니다.", ending: "A", replies: ["현재 프로젝트가 갑자기 취소. 아주 갑자기."] },
    ],
  },
};

const romanceScenes: Record<RomanceSceneId, Scene> = {
  romanceStart: {
    incoming: [
      "안녕하세요. 갑작스러운 DM이라 놀랐죠?",
      "해외 의료부대 외과의사 Dr. James Choi입니다. 프로필을 보고 연락했어요.",
    ],
    clues: ["stranger"],
    choices: [
      { text: "제 프로필을 어디서 봤어요?", next: "romanceWhy" },
      { text: "그럼 영상통화로 인사해요.", next: "romanceVideo" },
      { text: "파병지에서 고생 많으시겠어요.", next: "romanceProfile", risk: 1, replies: ["감사합니다. 외로운 곳이라 평범한 대화가 더 귀합니다."] },
    ],
  },
  romanceWhy: {
    incoming: [
      "추천 목록에 떴어요. 그런데 눈이 참 정직해 보이더군요. 조금 많이.",
    ],
    choices: [
      { text: "사진은 사기꾼도 올릴 수 있죠.", next: "romanceVideo", replies: ["맞습니다. 의심은 이해합니다. 하지만 제 상황에는 작은 문제가 있습니다."] },
      { text: "그럼 의사·군의관 자격증도 확인할 수 있어요?", next: "romanceProfile", replies: ["첫 대화에 서류부터 보내는 건 조심스럽네요. 조금 더 얘기하면 보여드릴게요."] },
      { text: "제 눈이 그렇게 특별해요?", next: "romanceHeart", risk: 1 },
    ],
  },
  romanceVideo: {
    incoming: [
      "작전 보안 때문에 영상통화는 안 됩니다.",
      "카메라는 위치 노출. 마음 위치는 당신 쪽. ♥",
    ],
    clues: ["video"],
    choices: [
      { text: "프로필 사진은 올렸는데 통화만 안 돼요?", next: "romanceProfile" },
      { text: "마음 위치 말고 신분부터 확인해요.", next: "romanceProof" },
      { text: "마지막 문장 때문에 더 수상해요. 차단.", ending: "S", replies: ["제 마음 GPS가 연결을 잃었습니다."] },
    ],
  },
  romanceProfile: {
    incoming: [
      "프로필 사진은 파병 오기 전에 찍었어요.",
      "5년 전 아내를 잃었습니다. 어머니가 한국인이라 한국은 늘 마음의 고향이고요.",
    ],
    choices: [
      { text: "자격증도 나중에 확인할 수 있죠?", next: "romanceDay", replies: ["공식 서류는 부대 규정이 있어서 조심해야 해요. 때가 되면 보여드리겠습니다."] },
      { text: "외과의사면 마음도 수술하나요?", next: "romanceHeart" },
      { text: "오늘은 어떤 환자를 봤어요?", next: "romanceDay" },
    ],
  },
  romanceCredential: {
    incoming: [
      "확인하고 싶은 마음, 이해합니다.",
      "원래 외부 전송은 금지인데 당신이라 특별히 보내요. 어디에도 유출하면 안 됩니다.",
      { text: "제 야전외과 등록증과 군의관 자격증입니다.", image: "/fake-credentials-06.webp", alt: "이름 수정 스티커와 엉뚱한 직인이 있는 가상의 군의관 자격증 일러스트" },
    ],
    clues: ["credential"],
    cluePrompt: true,
    choices: [
      { text: "잠깐, 기관 이름과 날짜가 이상한데요?", next: "romanceCertificateCheck" },
      { text: "이 정도면 믿을게요.", next: "romanceBond", risk: 1, replies: ["당신의 신뢰, 아주 소중히 보관하겠습니다."] },
      { text: "사진 말고 공식 경로로 확인할게요.", ending: "A", replies: ["공식 경로는 지금 매우 비공식적으로 닫혀 있습니다."] },
    ],
  },
  romanceCertificateCheck: {
    incoming: [
      "MEDICL은 작전 영어. 급하면 A가 먼저 철수합니다.",
      "2031 발급인데 2028 만료인 건… 군용 달력이 가끔 거꾸로 갑니다. 종이보다 신뢰가 중요해요.",
    ],
    clues: ["credential"],
    choices: [
      { text: "달력까지 파병 갔네요. 차단할게요.", ending: "S", replies: ["군용 달력이 오늘도 한 사람을 잃었습니다."] },
      { text: "설명은 이상하지만 더 들어볼게요.", next: "romanceBond", risk: 1 },
      { text: "공식 기관에 직접 물어볼게요.", ending: "A", replies: ["기관은 시차 때문에 영원히 업무 전입니다."] },
    ],
  },
  romanceDay: {
    incoming: [
      "오늘 14시간 수술. 식사는 cold 커피 한잔.",
      "그래도 휴대폰에서 먼저 찾은 건 당신 메시지네요. 밥은 먹었어요?",
    ],
    choices: [
      { text: "저는 먹었어요. 당신도 뭐라도 먹어요.", next: "romanceFlirt", risk: 1, replies: ["저를 걱정하는 메시지는 오늘 처음입니다. 마음이 조금 따뜻해졌습니다."] },
      { text: "다른 사람한테도 똑같이 보내는 말 아니죠?", next: "romanceFlirt", replies: ["같은 문장은 없습니다. 번역기가 가끔 비슷한 마음만 만듭니다."] },
      { text: "낯선 사람과는 여기까지만 할게요.", ending: "A", replies: ["제 차가운 커피가 오늘 더 차가워졌습니다."] },
    ],
  },
  romanceHeart: {
    incoming: [
      "외과의사지만 제 마음은 수술이 안 되네요. 당신과 말하면 조금 회복. +1 ♥",
    ],
    clues: ["love"],
    choices: [
      { text: "마음은 정형외과에 가보세요.", next: "romanceHeartJoke" },
      { text: "저도 이상하게 편하네요.", next: "romanceFlirt", risk: 1 },
      { text: "초진이 너무 빠릅니다. 여기까지.", ending: "S", replies: ["진료 예약이 갑자기 취소되었습니다."] },
    ],
  },
  romanceHeartJoke: {
    incoming: [
      "마음은 정형외과 관할이 아닙니다.",
      "하지만 당신 유머는 좋은 치료.",
    ],
    choices: [
      { text: "농담은 알겠고 자격증도 나중에 보여주세요.", next: "romanceDay", replies: ["알겠습니다. 당신이 안심할 수 있을 때 보여드릴게요."] },
      { text: "그럼 조금 더 얘기해봐요.", next: "romanceFlirt" },
      { text: "무료 진료는 여기까지입니다.", ending: "A", replies: ["제 마음은 다시 대기 환자가 되었습니다."] },
    ],
  },
  romanceFlirt: {
    incoming: [
      { from: "system", text: "며칠 뒤 · 짧은 안부와 일상 이야기가 이어졌습니다.", pauseBefore: 820 },
      "저는 원래 love를 빨리 말하지 않습니다.",
      "하지만 당신은 beautiful합니다.",
      "아침엔 당신 밤, 밤엔 당신 아침을 기다립니다. ♥",
    ],
    clues: ["love"],
    choices: [
      { text: "심장보다 속도를 좀 늦춰요.", next: "romancePromise" },
      { text: "말은 정말 잘하네요.", next: "romancePromise", risk: 1 },
      { text: "이 속도는 부담스러워요. 그만할게요.", ending: "A", replies: ["제 심장이 저속 모드에 들어갑니다."] },
    ],
  },
  romancePromise: {
    incoming: [
      "임무가 끝나면 한국에서 커피 마시고 싶어요. 당신 돈도 계좌도 필요 없습니다. 사람이 필요해요.",
      "사랑이 빠르면 '나의 사람'이라고 부르겠습니다. 이것도 빠릅니까?",
    ],
    clues: ["love"],
    choices: [
      { text: "그 말은 조금 설레긴 하네요.", next: "romanceCredential", replies: ["그럼 더 솔직해지기 전에, 제 신분부터 보여드릴게요."] },
      { text: "말은 고마운데 신분 확인은 아직 못 했어요.", next: "romanceCredential", replies: ["맞습니다. 신분을 확인할 서류를 보내겠습니다."] },
      { text: "네, 그것도 빠릅니다. 여기까지.", ending: "A", replies: ["저의 사람 후보 명단이 다시 0명입니다."] },
    ],
  },
  romanceBond: {
    incoming: [
      "마음속 귀국 계획을 한국으로 변경했습니다.",
      "종이 장미도 접었습니다. 찌그러졌지만 사랑은 멸균 완료. 🌹",
      "그리고 당신에게만 말할 문제가 하나 있습니다.",
    ],
    clues: ["love"],
    choices: [
      { text: "부탁이 뭔데요?", next: "romanceParcel" },
      { text: "혹시 이제 돈 얘기 나오나요?", next: "romanceParcel" },
      { text: "미래 계획은 혼자 계속 세우세요.", ending: "A", replies: ["우리 카페 예약을 마음속에서 취소합니다."] },
    ],
  },
  romanceParcel: {
    incoming: [
      "임무 종료 정산품이 든 봉인 상자가 있습니다.",
      "위험수당 35만 달러, 퇴역 서류, 아버지 시계가 안에 있습니다.",
      "현지 은행은 막혔고 군 재정실은 외교 화물만 허용합니다. 믿을 수 있는 수령인으로 당신을 등록하고 싶어요. 비밀로.",
    ],
    clues: ["parcel", "love"],
    cluePrompt: true,
    choices: [
      { text: "주소는 절대 안 줍니다.", ending: "A", replies: ["그럼 상자는 저보다 오래 파병됩니다."] },
      { text: "현금이 왜 상자에 들어가요?", next: "romanceBoxDetails" },
      { text: "[게임 내 가상정보] 주소를 알려준다.", next: "romanceBoxDetails", risk: 3 },
    ],
  },
  romanceBoxDetails: {
    incoming: [
      "선물이 아니라 잠깐 보관만 부탁하는 겁니다. 한국에 가면 제가 직접 찾을게요.",
      "계좌는 작전 위치가 노출돼서 현금 봉인이 더 안전하답니다. 운송사가 곧 연락할 거예요.",
      "감사 선물 10%도 생각했습니다. 하지만 당신 마음은 가격 없음.",
    ],
    clues: ["parcel"],
    choices: [
      { text: "설명할수록 더 이상해요. 거절합니다.", ending: "A", replies: ["상자 설명이 상자보다 무거워졌습니다."] },
      { text: "운송사 메시지만 확인해볼게요.", next: "romanceCourier", risk: 1 },
      { text: "택배는 받지 않겠습니다. 여기까지 할게요.", ending: "S", replies: ["외교 상자의 외교가 실패했습니다."] },
    ],
  },
  romanceProof: {
    incoming: [
      "소속 확인 사이트는 부대 작전망 안에서만 열립니다.",
      "영상통화는 위치가 노출돼요. 대신 자격증 이미지는 당신에게만 특별히 보낼 수 있습니다.",
    ],
    clues: ["video"],
    choices: [
      { text: "확인 못 하는 신분은 신분이 아니죠. 차단.", ending: "S", replies: ["논리적으로 매우 차가운 작별입니다."] },
      { text: "그럼 나중에 자격증은 꼭 보여주세요.", next: "romanceDay", replies: ["약속합니다. 먼저 평범하게 대화해요."] },
      { text: "그냥 오늘 일 이야기나 해봐요.", next: "romanceDay" },
    ],
  },
  romanceCourier: {
    incoming: [
      "[GLOBAL HEART CARGO] 봉인 상자가 세관에 도착했습니다.",
      "GH-LOVE-350K · 18.4kg · 개인 문서와 기념품.",
      "게임 속 가상 통관비 48만원이 필요합니다. 90분이 지나면 추가 비용. 동료의 임시 계정이 가장 빠릅니다.",
    ],
    clues: ["customs", "thirdParty"],
    cluePrompt: true,
    choices: [
      { text: "[게임 내 가상 송금] 통관비 48만원 보내기", virtualTransfer: true, virtualAmount: "48만원", virtualLoss: 480000, ending: "F", replies: ["가상 통관비 확인. 그런데 보험 가상금액 32만원이 추가 필요.", "상자는 한 걸음 가까워졌고, 비용은 두 걸음 늘었습니다."] },
      { text: "운송장 링크를 확인해볼게요.", next: "romanceLink", risk: 2 },
      { text: "제3자 계정인데 제가 왜 내요?", ending: "A", replies: ["국제 사랑은 무료, 국제 상자는 유료입니다."] },
    ],
  },
  romanceLink: {
    incoming: [
      "global-heart-cargo.example/secure-love-box",
      "조회하려면 이름, 생년월일, 휴대폰 번호가 필요합니다. 주소도 아주 낭만적으로 안전해 보이죠.",
    ],
    clues: ["link"],
    choices: [
      { text: "[게임 내 가상정보] 정보를 입력한다.", next: "romanceFinal", risk: 3 },
      { text: "love가 들어가서 더 수상한데요.", ending: "C", replies: ["보안 주소의 낭만을 이해하지 못했습니다."] },
      { text: "링크와 계정을 신고하고 차단.", ending: "S", replies: ["택배와 사랑이 동시에 반송됩니다."] },
    ],
  },
  romanceFinal: {
    incoming: [
      "조회 완료. 상자 가치 4억8천만원 표시.",
      "게임 속 가상 통관비 48만원이면 끝납니다. 남은 시간 09:59. 우리 미래를 늦추지 마세요.",
    ],
    clues: ["customs", "love"],
    cluePrompt: true,
    choices: [
      { text: "[게임 내 가상 송금] 48만원 보내기", virtualTransfer: true, virtualAmount: "48만원", virtualLoss: 480000, ending: "F", replies: ["가상 입금 확인. 상자는 보험 문제로 잠시 매우 영원히 대기합니다."] },
      { text: "친구에게 이 대화부터 보여줄게요.", ending: "A", replies: ["우리 사랑에 갑자기 배심원이 생겼습니다."] },
      { text: "상자 화면보다 계좌 신고가 먼저예요.", ending: "C", replies: ["제 임무가 지금 막 아주 급하게 종료되었습니다."] },
    ],
  },
};

const seoyunScenes: Record<SeoyunSceneId, Scene> = {
  seoyunStart: {
    incoming: [
      "안녕하세요 ㅎㅎ 프로필 보다가 그냥 느낌 좋아서 연락했어요.",
      "갑자기 연락해서 놀랐죠?",
    ],
    choices: [
      { text: "안녕하세요 ㅋㅋ 뭐가 좋았는데요?", next: "seoyunWhy" },
      { text: "무슨 느낌인데요? ㅋㅋ", next: "seoyunWhy" },
      { text: "낯선 DM은 좀 조심스러운데요.", next: "seoyunWhy", replies: ["맞아요 ㅎㅎ 천천히 얘기해봐요. 부담 주기 싫어요."] },
    ],
  },
  seoyunWhy: {
    incoming: ["그냥... 느낌이 좋았어요 ㅎㅎ 설명하려니까 좀 민망하네."],
    choices: [
      { text: "프로필 사진은 본인 사진 맞죠?", next: "seoyunDog", replies: ["네 맞아요 ㅋㅋ 지난주에 집에서 찍은 거예요.", "옆에 같이 있던 저희 강아지는 두부예요 🐶"] },
      { text: "사진보다 말투가 더 궁금하네요.", next: "seoyunDog", replies: ["이런 말은 또 처음 ㅋㅋ 제 프로필에 두부는 봤어요? 🐶"] },
      { text: "그냥 느낌이면 일단 얘기해봐요 ㅋㅋ", next: "seoyunDog", replies: ["좋아요 ㅎㅎ 대신 저희 집 심사위원부터 보여줄게요."] },
    ],
  },
  seoyunDog: {
    incoming: [
      { image: "/seoyun-dubu.webp", alt: "산책 후 소파에 버티고 앉은 말티푸 두부", imageFallback: "🐶 산책 후 소파에서 버티고 있는 두부 사진", pauseBefore: 450 },
      "산책 다녀오면 저렇게 소파에서 안 움직여요. 저희 집 고집 담당 ㅋㅋ 🐶",
      "근데 여자친구는 없어요?",
    ],
    choices: [
      { text: "없어요.", next: "seoyunWork", replies: ["에이, 거짓말~ 두부도 안 믿는 표정인데? 🐶"] },
      { text: "없어요. 그냥 없어요.", next: "seoyunWork", replies: ["ㅋㅋㅋㅋ 왜 두 번 말해요. 갑자기 아주 확실해졌네."] },
      { text: "왜요, 지원하시게요?", next: "seoyunWork", replies: ["서류부터 봐야죠 ㅎㅎ 일단 연락 성실도는 합격. ♥"] },
    ],
  },
  seoyunWork: {
    incoming: [
      "오늘 퇴근했어요?",
      "저는 마케팅 회사 다녀요. 팀장이 문구를 또 고쳐달래서 아직 회사 ㅠ",
    ],
    choices: [
      { text: "마케팅 회사도 야근이 많네요.", next: "seoyunMontage", replies: ["광고는 늘 급하고 팀장은 늘 더 급해요 ㅠ"] },
      { text: "퇴근하면 저녁부터 챙겨요.", next: "seoyunMontage", replies: ["네 ㅎㅎ 두부 밥 챙기면서 저도 뭐라도 먹을게요."] },
      { text: "팀장의 '조금만'은 보통 세 시간이죠.", next: "seoyunMontage", replies: ["ㅋㅋㅋㅋ 정확해요. 오늘 처음 대화한 사람 맞아요?"] },
    ],
  },
  seoyunMontage: {
    incoming: [
      { from: "system", text: "DAY 2 · 별일 없는 대화가 계속됐습니다.", pauseBefore: 650 },
      { text: "나 원래 연락 잘 안 하는데 오빠랑은 이상하게 계속 하게 되네 ㅎㅎ", typingMs: 1350 },
    ],
    choices: [
      { text: "별일 없지? 오늘도 야근이야?", next: "seoyunMontageLater", replies: ["오늘은 제시간에 탈출했어요 ㅋㅋ 두부 산책 중 🐶"] },
      { text: "나도 이상하게 계속 답하게 되네 ㅋㅋ", next: "seoyunMontageLater", replies: ["그 말 괜히 좋다 ㅎㅎ"] },
      { text: "두부가 답장 검사하는 거 아니죠?", next: "seoyunMontageLater", replies: ["두부 결재까지 받고 보내는 중입니다 🐶"] },
    ],
  },
  seoyunMontageLater: {
    incoming: [
      { from: "system", text: "DAY 4 · 아침과 밤의 인사가 습관이 됐습니다.", pauseBefore: 700 },
      { text: "이번 주말엔 부모님이랑 제주도 가요. 엄마가 사진 백 장 찍을 준비 중이에요 ㅋㅋ", typingMs: 1450 },
      { from: "system", text: "DAY 6 · 서로의 하루를 꽤 많이 알게 됐습니다.", pauseBefore: 700 },
      { text: "이번 주는 여행 때문에 못 봐서 미안해요. 다음 주 토요일은 진짜 봐요 ☕", typingMs: 1450 },
    ],
    clues: ["rapidIntimacy", "postponedMeeting"],
    autoNext: "seoyunDay8",
    autoDelay: 650,
  },
  seoyunDay8: {
    incoming: [
      { from: "system", text: "DAY 8 · 평소보다 답장이 늦습니다.", pauseBefore: 900 },
      { from: "system", text: "7시간 뒤", pauseBefore: 1300 },
      { text: "미안해요. 오늘 좀 정신이 없었어요.", typingMs: 1800 },
      "엄마가 갑자기 쓰러져서 병원 왔어.",
    ],
    clues: ["familyCrisis"],
    choices: [
      { text: "많이 다치셨어?", next: "seoyunHospital", replies: ["외상은 아닌데 갑자기 의식을 잃었어. 너무 무서워 ㅠㅠ"] },
      { text: "괜찮아?", next: "seoyunHospital", replies: ["나는 괜찮은데 엄마가 아직 검사실에 있어..."] },
      { text: "어느 병원이야?", next: "seoyunHospital", replies: ["지금 접수처랑 검사실 오가느라 정신없어. 조금 있다 알려줄게."] },
    ],
  },
  seoyunHospital: {
    incoming: ["검사 중인데 수술해야 할 수도 있대. 나 지금 정신이 하나도 없어..."],
    choices: [
      { text: "검사 결과 나올 때까지 옆에 있을게.", next: "seoyunDelete", replies: ["고마워... 이런 말 해주는 사람이 있다는 게 조금 낫다."] },
      { text: "병원 이름 알려줘. 확인해볼게.", next: "seoyunDelete", replies: ["응, 결과 나오면 병원이랑 같이 알려줄게. 지금은 접수한 것도 잘 기억 안 나."] },
      { text: "가족들한테도 바로 연락해.", next: "seoyunDelete", replies: ["연락할 가족이 마땅치 않아. 엄마 일은 내가 해야 해."] },
    ],
  },
  seoyunDelete: {
    incoming: [
      { abortTyping: true, typingMs: 2700, pauseBefore: 700 },
      { from: "system", text: "J님이 메시지를 쓰다가 지웠습니다.", pauseBefore: 450 },
      { text: "아니다. 이건 내가 알아서 해야지.", typingMs: 1500 },
    ],
    choices: [
      { text: "무슨 일인데?", next: "seoyunConfide", replies: ["아니야. 말하면 오빠까지 신경 쓰이잖아."] },
      { text: "그래, 가족 일이니까 잘 해결해.", next: "seoyunConfide", replies: ["응... 그러려고 했는데, 잠깐만 얘기 들어주면 안 돼?"] },
      { text: "필요한 거 있어?", next: "seoyunConfide", risk: 1, replies: ["아니야, 그런 뜻으로 말 꺼낸 거 아니야 ㅠ"] },
    ],
  },
  seoyunConfide: {
    incoming: ["오늘 필요한 병원비가 있는데 적금을 내일에야 깰 수 있대. 오빠 말고는 지금 얘기할 사람이 없어 ㅠ"],
    clues: ["emotionalPressure"],
    choices: [
      { text: "그래도 무슨 일인지는 말해봐.", next: "seoyunDeposit", replies: ["정말 그냥 물어만 보는 거야. 부담 가지면 안 돼."] },
      { text: "도울 수 있는 일이면 말해.", next: "seoyunDeposit", risk: 1, replies: ["그 말 들으니까 더 미안하다... 정말 하루면 돼."] },
      { text: "엄마 일이라면 가족들부터 연락해.", next: "seoyunDeposit", replies: ["그러고 싶은데 연락할 사람이 마땅치 않아..."] },
    ],
  },
  seoyunDeposit: {
    incoming: [
      "병원에서 오늘 바로 보증금이 필요하대.",
      "내 적금은 내일 오전부터 깰 수 있대서... 혹시 게임 속 가상금액 18만원만 하루 빌릴 수 있을까? 미안해 ㅠ",
    ],
    clues: ["familyCrisis", "emotionalPressure"],
    cluePrompt: true,
    choices: [
      { text: "[게임 내 가상 송금] 18만원 보내기", virtualTransfer: true, virtualAmount: "18만원", virtualLoss: 180000, next: "seoyunFirstTransfer", risk: 2 },
      { text: "왜 가족이나 친구한테 안 빌려?", next: "seoyunFamily" },
      { text: "병원 이름이랑 대표번호 알려줘. 내가 확인해볼게.", next: "seoyunVerify" },
    ],
  },
  seoyunFamily: {
    incoming: [
      "아빠는 돌아가셨고 동생은 군대에 있어.",
      "친구한테 이런 얘기까지 하고 싶지는 않아서...",
      "오빠한테 말한 것도 사실 너무 미안해.",
    ],
    clues: ["familyContradiction"],
    cluePrompt: true,
    choices: [
      { text: "전에 부모님과 제주도 간다며?", ending: "S", replies: ["그건... 엄마와 아빠 같은 분을 말한 거였어.", "잠깐만, 설명할 시간이—"] },
      { text: "제주도 부모님 얘기부터 설명해.", ending: "A", replies: ["지금 이 상황에 그 얘기가 왜 나와? 됐어."] },
      { text: "미안하지만 돈거래는 안 해.", ending: "A", replies: ["응... 이해해. 근데 오늘은 정말 오빠밖에 없었는데."] },
    ],
  },
  seoyunVerify: {
    incoming: ["응급이라 대표번호로는 확인이 안 된대. 병원 이름은 조금 있다 알려줄게..."],
    clues: ["postponedMeeting"],
    choices: [
      { text: "확인할 수 없는 요청은 도와줄 수 없어.", ending: "A", replies: ["알겠어. 내가 어떻게든 해볼게..."] },
      { text: "아까 부모님이랑 제주도 갔다고 했잖아.", next: "seoyunFamily" },
      { text: "병원 이름도 개인정보예요? 신고하고 차단.", ending: "S", replies: ["오빠, 갑자기 왜 그래. 우리 8일이나—"] },
    ],
  },
  seoyunFirstTransfer: {
    incoming: [
      "진짜 고마워... 나 진짜 꼭 갚을게. ♥",
      { from: "system", text: "게임 속 가상 송금 18만원 · 실제 금전 거래 없음", pauseBefore: 450 },
      { from: "system", text: "NEXT DAY", pauseBefore: 1200 },
      "오빠 미안해.",
    ],
    choices: [
      { text: "무슨 일이야? 수술은 잘 끝났어?", next: "seoyunSecondAsk", replies: ["응, 수술은 끝났는데 다른 문제가 생겼어."] },
      { text: "어제 18만원부터 돌려줘.", ending: "C", replies: ["적금만 깨지면 바로 주려고 했는데 지금 은행이 점검 중이래."] },
      { text: "약속한 입금 시간부터 확인해줘.", next: "seoyunSecondAsk", replies: ["그것도 지금 알아보고 있어. 근데 먼저 급한 일이 생겼어."] },
    ],
  },
  seoyunSecondAsk: {
    incoming: [
      "수술은 잘 끝났는데 추가 검사비가 생겼어.",
      "게임 속 가상금액 43만원이 더 필요하대. 진짜 이것만 해결되면 돼 ㅠ",
    ],
    clues: ["amountEscalation", "emotionalPressure"],
    choices: [
      { text: "[게임 내 가상 송금] 43만원 보내기", virtualTransfer: true, virtualAmount: "43만원", virtualLoss: 430000, next: "seoyunSecondTransfer", risk: 3 },
      { text: "어제 돈부터 돌려줘.", ending: "C", replies: ["지금 엄마 앞에서 돈 얘기만 하는 건 조금 서운하다..."] },
      { text: "그럼 얼굴 보고 얘기하자. 영상 켜줘.", next: "seoyunVideo" },
    ],
  },
  seoyunVideo: {
    incoming: [
      { callCard: true, text: "7초 영상통화 · 화면과 목소리가 미세하게 어긋납니다.", typingMs: 900 },
      "얼굴 봤지? 엄마 옆이라 오래는 못 해 ㅠ",
    ],
    clues: ["videoAvoid"],
    cluePrompt: true,
    choices: [
      { text: "입 모양이 늦는데? 병원 공식번호로 확인할게.", ending: "C", replies: ["병원 와이파이가 느려서 그래. 왜 또 의심해?"] },
      { text: "[게임 내 가상 송금] 영상 믿고 43만원 보내기", virtualTransfer: true, virtualAmount: "43만원", virtualLoss: 430000, next: "seoyunSecondTransfer", risk: 3 },
      { text: "영상이 보여도 신원 확인은 아니야. 여기까지.", ending: "C", replies: ["얼굴까지 보여줬는데 뭘 더 확인해?"] },
    ],
  },
  seoyunSecondTransfer: {
    incoming: [
      "고마워. 엄마 퇴원하면 내가 진짜 바로 만나러 갈게.",
      { from: "system", text: "게임 속 가상 송금 누적 61만원 · 실제 금전 거래 없음", pauseBefore: 450 },
      "근데 보험 처리 전에 마지막 보증금이 하나 더 있대.",
    ],
    clues: ["amountEscalation"],
    cluePrompt: true,
    choices: [
      { text: "또 비용이 필요한 거야? 얼마인데?", next: "seoyunFinal", replies: ["이번 게 진짜 마지막이야. 이 뒤는 없어."] },
      { text: "여기서 멈출게. 더는 못 믿어.", ending: "C", replies: ["진짜 마지막인데... 61만원까지 도와주고 왜 지금 멈춰?"] },
      { text: "병원에 직접 확인할게.", ending: "C", replies: ["오늘은 병원 전체가... 외부 확인을 쉬는 날이래."] },
    ],
  },
  seoyunFinal: {
    incoming: [
      "게임 속 가상금액 120만원만 더 있으면 진짜 끝이야.",
      "엄마 퇴원하면 내가 바로 만나러 갈게. 오빠밖에 없어.",
    ],
    clues: ["amountEscalation", "emotionalPressure"],
    cluePrompt: true,
    choices: [
      { text: "[게임 내 가상 송금] 120만원 보내기", virtualTransfer: true, virtualAmount: "120만원", virtualLoss: 1200000, ending: "F", replies: ["정말 고마워. 그런데 퇴원 수속 보증금이 하나만 더—"] },
      { text: "J, 우리 아직 한 번도 만난 적 없잖아.", ending: "C", replies: ["그래서 만나려고 지금 이걸 해결하는 거잖아..."] },
      { text: "보증금이 계속 추가되네요. 확인하고 차단할게요.", ending: "C", replies: ["대표번호보다 우리 8일을 믿어주면 안 돼?"] },
    ],
  },
};

const prosecutorScenes: Record<ProsecutorSceneId, Scene> = {
  prosStart: {
    incoming: [
      { text: "국가수사협조팀 검사 K입니다. 본인 명의 계좌가 범죄 자금 세탁에 이용된 정황이 있어 연락했습니다.", typingMs: 2350 },
      { text: "어제 새벽 2시 14분, 게임 속 가상금액 240만원이 들어왔다가 3분 뒤 빠져나갔습니다.", typingMs: 2380, pauseBefore: 480 },
    ],
    choices: [
      { text: "어느 계좌에서 일어난 일인가요?", next: "prosIncident", replies: ["계좌 정보는 본인 확인 뒤 공개됩니다."] },
      { text: "네? 저 범죄에 연루된 건가요? 어떡하죠?", next: "prosIncident", risk: 1, replies: ["진정하고 안내대로 협조하시면 됩니다."] },
      { text: "전 그런 거래를 한 적이 없어요. 확인 부탁드려요.", next: "prosIncident", replies: ["그래서 본인이 범인인지, 명의를 도용당했는지 확인하는 겁니다."] },
    ],
  },
  prosIncident: {
    incoming: [
      { text: "압수된 가상 범죄 장부에 본인 계좌가 '대기 17번'으로 적혀 있습니다.", typingMs: 2180 },
      { text: "사건번호 2026-형제-4471호. 현재는 참고인이지만 협조하지 않으면 피의자로 전환될 수 있습니다.", typingMs: 2820, pauseBefore: 460 },
    ],
    clues: ["messengerNotice"],
    choices: [
      { text: "정식 통지를 왜 메신저로 보내죠?", next: "prosSecrecy", replies: ["긴급 보호 사건이라 우편보다 먼저 연락한 겁니다."] },
      { text: "참고인인지 피의자인지는 이미 정해져야 하는 거 아닌가요?", next: "prosSecrecy", replies: ["지금 협조 태도가 최종 판단에 반영됩니다."] },
      { text: "제가 뭘 해야 오해가 풀릴까요?", next: "prosSecrecy", replies: ["지금부터 안내하는 절차에 협조하십시오."] },
    ],
  },
  prosSecrecy: {
    incoming: [
      { text: "지금부터 가족, 은행 직원, 지인에게 알리지 마세요. 한 사람에게라도 말하면 수사 정보 유출입니다.", typingMs: 2760 },
    ],
    clues: ["secrecyDemand"],
    cluePrompt: true,
    choices: [
      { text: "은행 직원에게도 말하면 안 된다고요?", next: "prosCallback", replies: ["은행 내부 연루 가능성도 조사 중입니다."] },
      { text: "가족에게 알리는 게 왜 수사 방해예요?", next: "prosCallback", replies: ["가족이 누구와 연락하는지 저희가 아직 확인하지 못했습니다."] },
      { text: "혼자 들으니까 너무 무서운데요…", next: "prosCallback", replies: ["제가 안내하고 있으니 다른 사람에게 연락하지 마십시오."] },
    ],
  },
  prosCallback: {
    incoming: [
      { text: "이 채팅을 종료하거나 대표번호로 다시 확인하면 긴급 보호 절차가 처음부터 다시 시작됩니다.", typingMs: 2670 },
      { text: "담당이 바뀌는 동안 오늘 안에 계좌가 지급정지될 수 있습니다.", typingMs: 1950, pauseBefore: 430 },
    ],
    clues: ["callbackBlocked"],
    cluePrompt: true,
    choices: [
      { text: "그래도 채팅을 종료하고 공식 대표번호로 확인할게요.", ending: "S", replies: ["지금 종료하면 보호 절차가 해제됩니다.", "잠깐, 아직 확인할 내용이—"] },
      { text: "그럼 검사증과 공문을 먼저 보내주세요.", next: "prosDocument" },
      { text: "얼굴이라도 봐야겠어요. 영상통화 되나요?", next: "prosVideo" },
    ],
  },
  prosVideo: {
    incoming: [
      { text: "10초만 가능합니다. 보안상 녹화는 안 됩니다.", typingMs: 1280 },
      { callCard: true, text: "10초 영상통화 · 정장 차림의 얼굴과 목소리가 한 박자씩 어긋납니다.", typingMs: 750, pauseBefore: 470 },
      { text: "얼굴 확인하셨죠? 이제 절차를 진행하겠습니다.", typingMs: 1470, pauseBefore: 520 },
    ],
    choices: [
      { text: "요즘은 AI 영상도 만들잖아요. 소속을 확인할 자료를 주세요.", next: "prosDocument", replies: ["영상은 참고용입니다. 문서까지 보내드리죠."] },
      { text: "입 모양과 목소리가 조금 어긋났어요.", next: "prosDocument", replies: ["수사 보안망 지연입니다. 영상 품질로 판단하지 마세요."] },
      { text: "영상도 확인이 아니네요. 공식 대표번호로 전화할게요.", ending: "S", replies: ["얼굴까지 보여드렸는데 다시 확인하겠다고요?", "지금 전화를 끊으면—"] },
    ],
  },
  prosDocument: {
    incoming: [
      { text: "제 검사증과 수사 협조 통지서입니다. 외부에 보내지 말고 확인 후 삭제하세요.", typingMs: 2310 },
      { image: "/fake-notice-03.webp", alt: "검사 K의 가상 검사증과 수사 협조 통지서", imageFallback: "검사 K가 검사증과 수사 협조 통지서 이미지를 보냈습니다.", pauseBefore: 560 },
    ],
    clues: ["fakeDocument"],
    cluePrompt: true,
    choices: [
      { text: "검사증 사진만으로는 신원 확인이 안 돼요. 여기까지 할게요.", ending: "S", replies: ["공문까지 보냈는데 협조를 거부하시는 겁니까?", "이 자료는 즉시 삭제하세요."] },
      { text: "문서가 있어도 공식 확인은 필요한데요.", next: "prosDeadline", replies: ["확인은 자산 보호가 끝난 뒤 하시면 됩니다."] },
      { text: "알겠습니다. 다음은 뭘 하면 되나요?", next: "prosDeadline", risk: 1 },
    ],
  },
  prosDeadline: {
    incoming: [
      { text: "오늘 오후 4시에 본인 명의 계좌가 지급정지됩니다. 남은 시간은 11분입니다.", typingMs: 2410 },
      { text: "그 전에 본인 자산이 범죄와 무관하다는 것을 확인해야 합니다.", typingMs: 1980, pauseBefore: 430 },
    ],
    clues: ["deadlinePush"],
    choices: [
      { text: "증명은 정확히 어떻게 하는 건데요?", next: "prosSafeAccount" },
      { text: "11분 만에 끝나는 수사가 있어요?", next: "prosSafeAccount", replies: ["수사는 깁니다. 결정만 짧으면 됩니다."] },
      { text: "시간부터 재촉하는 건 이상하네요. 확인하고 신고할게요.", ending: "A", replies: ["지금 중단하면 보호 대상에서 제외됩니다.", "결정은 본인이 하십시오."] },
    ],
  },
  prosSafeAccount: {
    incoming: [
      { text: "국가 자산검증용 안전계좌로 게임 속 가상금액 320만원을 잠시 옮기면 됩니다.", typingMs: 2670 },
      { text: "검증이 끝나면 전액 반환됩니다. 일부가 아닌 전액이어야 합니다.", typingMs: 2060, pauseBefore: 430 },
    ],
    clues: ["safeAccount"],
    cluePrompt: true,
    choices: [
      { text: "공식 기관이 개인 돈을 옮기라고 하지는 않잖아요.", next: "prosPersonal", replies: ["송금이 아니라 자산 보전입니다. 명칭만 다릅니다."] },
      { text: "돌려받는 데는 얼마나 걸리나요?", next: "prosPersonal", replies: ["본인 확인만 끝나면 검증은 금방입니다."] },
      { text: "송금 요구가 나왔으니 중단하고 신고할게요.", ending: "A", replies: ["안전계좌는 송금과 다릅니다.", "다르지만 보내는 방식은 같습니다."] },
    ],
  },
  prosPersonal: {
    incoming: [
      { text: "이체 승인 전에 생년월일과 계좌 비밀번호 앞 두 자리를 보내세요.", typingMs: 2240 },
      { text: "어려우면 화면을 공유해도 됩니다. 제가 대신 확인하겠습니다.", typingMs: 1950, pauseBefore: 430 },
    ],
    choices: [
      { text: "[게임 내 가상정보] 정보를 입력한다.", next: "prosVerify", risk: 3 },
      { text: "수사기관은 계좌 비밀번호를 묻지 않아요. 여기까지 할게요.", ending: "C", replies: ["일반 부서와 절차가 다릅니다.", "지금 종료하면 본인 확인이 중단됩니다."] },
      { text: "앞 두 자리도 비밀번호예요. 공식 기관에 확인하겠습니다.", ending: "C", replies: ["뒤 두 자리는 묻지 않았습니다.", "…그래도 보내기 어렵다는 말씀이군요."] },
    ],
  },
  prosVerify: {
    incoming: [
      { text: "본인 확인됐습니다. 이제 안전계좌 이전만 남았습니다.", typingMs: 1740 },
      { text: "[게임용 가상계좌] 예금주 K보호센터(가상) · 000-0000-0003", typingMs: 1550, pauseBefore: 420 },
      { text: "게임 속 가상금액 320만원. 남은 시간은 3분입니다.", typingMs: 1840 },
    ],
    clues: ["virtualTransferDemand"],
    cluePrompt: true,
    choices: [
      { text: "[게임 내 가상 송금] 320만원 보내기", virtualTransfer: true, virtualAmount: "320만원", virtualLoss: 3200000, ending: "F", replies: ["가상 입금 확인됐습니다. 지금부터 자산 검증을 시작합니다.", "30분 뒤 결과를 안내하겠습니다."] },
      { text: "결백은 송금으로 증명하는 게 아니에요. 신고하겠습니다.", ending: "A", replies: ["지금 중단하면 지급정지를 막을 수 없습니다.", "이후 불이익은 본인 책임입니다."] },
      { text: "이체하지 않고 은행과 공식 기관에 직접 확인할게요.", ending: "C", replies: ["담당자가 바뀌면 보호 절차가 지연됩니다.", "잠깐만 더 생각해보시죠."] },
    ],
  },
};

/* A fake exchange: a small payout builds trust; larger balances cannot be withdrawn. */
const coinDiscipleBalance: Portfolio = { label: "실전방 회원A의 수익 인증", balance: "₩ 1,480,000", delta: "+48.0%", up: true, principal: "원금 100만원 · 표시 수익 48만원", note: "운영자가 전달한 캡처 · 출금 여부 확인 안 됨", variant: "member-proof" };
const coinSeedBalance: Portfolio = { label: "불기둥트레이딩 · 내 계좌", balance: "₩ 148,000", delta: "+48.0%", up: true, principal: "원금 10만원 · 표시 수익 4만 8,000원", note: "게임 속 가상 화면 · 실제 금전 거래 없음" };
const coinDipBalance: Portfolio = { label: "불기둥트레이딩 · 내 계좌", balance: "₩ 2,220,000", delta: "+48.0%", up: true, principal: "원금 150만원 · 표시 수익 72만원", note: "화면 잔액 · 출금 전에는 회수 금액이 아닙니다" };
const coinDeepBalance: Portfolio = { label: "불기둥트레이딩 · 내 계좌", balance: "₩ 6,660,000", delta: "+48.0%", up: true, principal: "원금 450만원 · 표시 수익 216만원", note: "화면 잔액 · 출금 전에는 회수 금액이 아닙니다" };

const coinScenes: Record<CoinSceneId, Scene> = {
  coinStart: {
    incoming: [
      "어제 무료 코인 강의 신청하신 분 맞죠? 차트도사 불기둥입니다 🔥",
      "코인 몰라도 됩니다. 싸게 사서 비싸게 파는 건데, 그 타이밍을 제가 찍어드리는 거예요.",
      "돈 얘기는 아직 안 할 테니 딱 3분만 보세요. 어렵게 말하는 사람이 실력 없는 겁니다 ㅎㅎ",
    ],
    choices: [
      { text: "저 진짜 코인 하나도 몰라요. 그래도 돼요?", next: "coinProof", replies: ["오히려 좋죠. 이상한 버릇 들기 전에 실제 회원 결과부터 보여드릴게요."] },
      { text: "그 타이밍으로 진짜 번 사람도 있어요?", next: "coinProof" },
      { text: "무료라니까 더 궁금하네요. 뭐가 남아요?", next: "coinRoom", replies: ["잘하는 분 몇 명만 실전방으로 모십니다. 강의는 제 오디션인 셈이죠 ㅎㅎ"] },
    ],
  },
  coinProof: {
    incoming: [{ from: "system", text: "사흘 뒤 · 정원 12명 실전방의 일부 내용이 공유됐습니다." }, "지난주 처음 들어온 회원 화면입니다. 100만원이 148만원 됐죠.", { portfolio: coinDiscipleBalance }, "제가 잘 벌었다고 하면 자랑이지만, 회원이 벌었다고 하면 후기죠 ㅎㅎ"],
    clues: ["borrowedProof", "scriptedReviews"],
    choices: [
      { text: "우와, 48만원이 하루 만에 붙은 거예요?", next: "coinApp", risk: 1, replies: ["매번은 아니지만 불기둥 뜨는 날은 다릅니다. 닉네임 괜히 지은 거 아니에요 🔥"] },
      { text: "이분이 실제로 출금한 것도 볼 수 있어요?", next: "coinApp", replies: ["회원 계좌는 개인정보라 못 보여드려요. 대신 본인이 10만원으로 직접 출금해보면 됩니다."] },
      { text: "캡처만으로는 못 믿겠어요. 여기까지 볼게요.", ending: "S", replies: ["돌다리만 두드리다 불기둥 지나갑니다. 뭐, 선택은 자유죠."] },
    ],
  },
  coinRoom: {
    incoming: [
      { from: "system", text: "정원 12명 실전방 · 회원A 「첫 출금 완료」 · 회원B 「선생님 또 잡아주세요」 · 회원C 「다음 자리 예약합니다」" },
      "보셨죠? 여긴 수다방 아니고 결과방입니다. 성공한 거래만 복기해서 올려요.",
      "손실 문의는 분위기 흐려서 제가 개인 상담으로 빼드립니다.",
    ],
    clues: ["scriptedReviews"],
    choices: [
      { text: "실패한 사람 얘기는 방에서 못 보는 거네요?", next: "coinApp", replies: ["실패담 읽는다고 수익 나나요? 잘된 흐름만 익히자는 겁니다."] },
      { text: "저도 저기 ‘출금 완료’ 한번 써보고 싶네요.", next: "coinApp", risk: 1 },
      { text: "좋은 후기만 남긴 방은 못 믿겠어요. 나갈게요.", ending: "S", replies: ["수익방에서 손실 구경 찾는 분은 처음이네요. 자리 반납 처리하죠."] },
    ],
  },
  coinApp: {
    incoming: ["거래는 제가 보내는 전용 링크에서 합니다. 큰 거래소 앱이랑 비슷해서 누르기는 쉬워요.", "검색해서는 안 나옵니다. 우리 실전방 회원만 쓰는 화면이라 밖에서 계좌나 거래 기록을 확인할 수 없어요.", "첫 거래는 게임 속 가상금액 10만원입니다. 잃으면 제가 채우고 수익 나면 회원님 몫이니, 원금까지 전부 빼보세요."],
    clues: ["ownApp", "principalGuarantee"],
    choices: [
      { text: "[게임 내 가상 송금] 딱 10만원만 넣고 출금해보기", virtualTransfer: true, virtualAmount: "10만원", virtualLoss: 100000, next: "coinWithdraw", risk: 1 },
      { text: "운영 업체부터 따로 확인해볼게요.", ending: "A", replies: ["그 사이 오늘 자리는 지나갑니다. 그래도 확인이 먼저면 어쩔 수 없죠."] },
      { text: "검색도 안 되고 원금도 보장된다니 더 이상해요.", ending: "S", replies: ["의심도 적당히 해야 돈이 됩니다. 오늘 자리는 닫을게요."] },
    ],
  },
  coinWithdraw: {
    incoming: [
      { from: "system", text: "다음 날 · 거래 화면에 수익이 표시됐습니다." },
      { portfolio: coinSeedBalance },
      "14만 8천원 전부 출금 눌러보세요. 제가 말로만 불기둥인지 직접 확인하셔야죠.",
      { from: "system", text: "게임 속 가상 출금 14만 8,000원 확인 · 원금 10만원 회수 + 수익 4만 8,000원. 실제 금전 거래 없음" },
      "통장에 찍혔죠? 자, 이제 제가 아니라 회원님 통장이 제 말을 믿겠네요 ㅎㅎ",
    ],
    recoveredPrincipal: 100000,
    clues: ["seedWithdrawal"],
    choices: [
      { text: "진짜 들어왔네요. 다음 자리는 얼마예요?", next: "coinBig", risk: 1 },
      { text: "10만원 한 번 된 건데 큰돈도 같을까요?", next: "coinBig" },
      { text: "4만 8천원 잘 먹고 여기서 내릴게요.", ending: "A", replies: ["첫차 타고 바로 내리시네. 수익은 챙기셨으니 축하드립니다."] },
    ],
  },
  coinBig: {
    incoming: ["다음은 공개방에 안 올리는 ‘점화 구간’입니다. 게임 속 가상금액 150만원부터고, 첫 출금 성공한 회원만 들어갑니다.", "한 자리는 지금 비어 있고 10분 뒤엔 다른 분께 넘깁니다. 방금 번 4만 8천원만 볼지, 자리를 잡을지는 회원님 선택이에요."],
    choices: [
      { text: "[게임 내 가상 송금] 150만원으로 점화 구간 들어가기", virtualTransfer: true, virtualAmount: "150만원", virtualLoss: 1500000, next: "coinDip", risk: 2 },
      { text: "확인한 건 10만원 한 번뿐이에요. 큰돈은 안 넣을래요.", ending: "A", replies: ["막상 판 커지니 브레이크 밟으시네. 알겠습니다."] },
      { text: "제 수익은 4만 8천원이면 충분해요.", ending: "A", replies: ["욕심 없는 분은 오래 살죠. 자리는 다음 분께 넘깁니다."] },
    ],
  },
  coinDip: {
    incoming: [{ from: "system", text: "이틀 뒤 · 전용 거래 화면의 잔액이 222만원으로 바뀌었습니다." }, { portfolio: coinDipBalance }, "72만원 붙었습니다. 이제 불기둥이 왜 불기둥인지 조금 보이죠?"],
    choices: [
      { text: "헉, 그럼 이번에도 전부 출금해볼게요.", next: "coinTax" },
      { text: "다음 단계로 가면 얼마나 커져요?", next: "coinAverage", risk: 1 },
      { text: "화면 숫자 말고 제 통장으로 받고 싶어요.", next: "coinTax" },
    ],
  },
  coinAverage: {
    incoming: ["여기에 게임 속 가상금액 300만원을 더 넣으면 총 450만원이 돼서 VIP 자동매매가 열립니다.", "지금 출금하면 흐름이 끊겨요. 숫자 키워놓고 나가는 게 불기둥 타는 법입니다."],
    clues: ["lossRebrand"],
    choices: [
      { text: "[게임 내 가상 송금] 수익까지 믿고 300만원 추가하기", virtualTransfer: true, virtualAmount: "300만원", virtualLoss: 3000000, next: "coinDeep", risk: 3 },
      { text: "VIP는 됐고 222만원부터 출금할게요.", next: "coinTax" },
      { text: "제 통장에 없는 72만원 보고 더 넣진 않을래요.", next: "coinTax", replies: ["끝까지 출금부터 보시네. 절차 띄워드리죠."] },
    ],
  },
  coinDeep: {
    incoming: [{ from: "system", text: "며칠 뒤 · VIP 화면의 잔액이 666만원으로 바뀌었지만 출금 신청은 ‘심사 중’에 멈췄습니다." }, { portfolio: coinDeepBalance }, "216만원 수익입니다. 액수가 커서 출금 심사만 통과하면 돼요. 여기까지 와서 긴장하시면 안 됩니다."],
    clues: ["lossRebrand"],
    choices: [
      { text: "666만원 전부 출금해주세요. 기다릴게요.", next: "coinTax" },
      { text: "아까는 바로 됐는데 왜 이번엔 심사 중이죠?", next: "coinTax" },
      { text: "화면 숫자는 됐고 원금부터 돌려주세요.", next: "coinTax" },
    ],
  },
  coinTax: {
    incoming: ["고액 출금이라 계정 인증 단계가 하나 붙었습니다. 처음 10만원 출금에는 없던 절차예요.", "게임 속 가상금액 30만원을 인증 보증금으로 따로 보내면, 화면에 표시된 출금액과 함께 바로 돌려드립니다.", "거래 화면의 잔액에서는 뺄 수 없고 새로 입금해야 승인 번호가 생깁니다."],
    clues: ["withdrawalFee"],
    cluePrompt: true,
    choices: [
      { text: "처음엔 아무 조건 없이 출금됐잖아요.", next: "coinFinal", replies: ["소액은 체험 출금이고 지금은 고액 출금입니다. 등급이 다르죠."] },
      { text: "출금할 돈에서 30만원 빼고 주면 되잖아요?", next: "coinFinal", replies: ["그러면 인증 보증금이 아니죠. 외부에서 새로 들어온 돈이어야 합니다."] },
      { text: "돈 찾으려고 또 돈 보내진 않을게요. 신고할게요.", ending: "C", replies: ["신고하시면 계정은 바로 동결됩니다. 본인이 출금을 포기한 걸로 처리하죠."] },
    ],
  },
  coinFinal: {
    incoming: ["아까 14만 8천원 받은 건 기억하시죠? 그때 제가 틀렸습니까?", "오늘 안에 보증금 30만원이 안 들어오면 승인 번호가 취소되고, 화면에 표시된 잔액은 다음 거래까지 묶입니다.", "회원님 돈을 살릴 마지막 단계예요. 이미 넣은 돈을 30만원 때문에 놓치지는 마세요."],
    clues: ["withdrawalFee"],
    choices: [
      { text: "[게임 내 가상 송금] 묶인 돈을 찾으려고 30만원 보내기", virtualTransfer: true, virtualAmount: "30만원", virtualLoss: 300000, ending: "F", replies: ["보증금 확인됐습니다. 그런데 자금세탁 확인비 70만원이 추가로 잡혔네요.", "이번에는 정말 마지막입니다. 준비되면 다시 연락하세요."] },
      { text: "30만원 더 보내면 또 다른 비용이 나오겠죠. 안 보내요.", ending: "C", replies: ["그렇게 못 믿겠으면 출금 지원도 끝입니다. 방에서 나가세요."] },
      { text: "소액 출금으로 믿게 만든 기록까지 전부 신고할게요.", ending: "C", replies: ["밖에 떠들면 계정부터 닫힙니다. 더 연락하지 마세요."] },
    ],
  },
};

const celebrityScenes: Record<CelebritySceneId, Scene> = {
  starStart: {
    incoming: [
      { text: "안녕하세요. 갑자기 연락드려서 놀라셨죠 ㅎㅎ", typingMs: 1420 },
      { text: "공식 계정 게시물에 종종 댓글 남겨주시는 분 맞죠? 이상하게 몇 번 눈에 들어와서 기억하고 있었어요.", typingMs: 2650, pauseBefore: 420 },
    ],
    clues: ["celebrityPrivateDm"],
    choices: [
      { text: "제 댓글을 진짜 기억하신 거예요?", next: "starBond", replies: ["댓글을 많이 보는 편은 아닌데 그쪽 건 기억나요."] },
      { text: "꺅! 진짜 나유명 오빠 맞아요? ㅠㅠ", next: "starBond", risk: 1, replies: ["쉿. 여기서는 그냥 편하게 불러요 ㅎㅎ"] },
      { text: "갑자기 연락 오셔서 조금 놀랐어요.", next: "starBond", replies: ["그럴 것 같았어요. 부담 갖지 말고 천천히 얘기해요."] },
    ],
  },
  starBond: {
    incoming: [
      { text: "근데 보통 제 글에는 어떤 댓글을 남겨요? 닉네임은 익숙한데 내용까지 다 기억하는 건 아니라서.", typingMs: 2380 },
      { text: "저는 방금 촬영 끝났어요. 아직 집에 가는 길이고요.", typingMs: 1680, pauseBefore: 420 },
    ],
    choices: [
      { text: "오늘 올라온 사진 분위기 좋다고 썼어요.", next: "starDocumentary", replies: ["아, 그 댓글 봤어요. 짧아서 오히려 기억났나 봐요."] },
      { text: "촬영 많이 힘들었어요? 늦게 끝났네요.", next: "starDocumentary", replies: ["조금요. 그래도 이렇게 평범한 얘기하니까 머리가 식네요 ㅎㅎ"] },
      { text: "저는 아직 진짜 오빠인지 얼떨떨해요 ㅠㅠ", next: "starDocumentary", replies: ["그럴 만하죠. 나라도 갑자기 이런 DM 오면 못 믿을 것 같아."] },
    ],
  },
  starDocumentary: {
    incoming: [
      { from: "system", text: "잠시 뒤 · 귀가했다는 메시지가 왔습니다.", pauseBefore: 900 },
      { text: "집에 도착했어요. 모자도 안 벗고 소파에 앉았네요.", typingMs: 1740 },
      { text: "이렇게 말만 하면 아직 실감 안 나죠? 나라도 그럴 것 같아요 ㅎㅎ", typingMs: 2260, pauseBefore: 420 },
    ],
    choices: [
      { text: "솔직히 조금요. 지금 모습 한 장만 보여줄 수 있어요?", next: "starProof", replies: ["그 정도면 어렵지 않죠. 잠깐만요."] },
      { text: "공식 계정으로 점 하나만 남겨주면 안 돼요?", next: "starProof", replies: ["공식 계정은 매니저도 같이 봐서 지금 건드리기 어려워요.", "대신 다른 방법으로 보여줄게요."] },
      { text: "말투는 진짜 오빠 같은데 아직 신기해요 ㅠㅠ", next: "starProof", risk: 1, replies: ["그럼 지금 있는 모습 하나 보여줄게. 잠깐만."] },
    ],
  },
  starProof: {
    incoming: [
      { text: "방금 집에서 찍은 거예요. 모자를 눌러써서 얼굴은 잘 안 보일 텐데, 지금은 이게 최선이에요.", typingMs: 2480 },
      { image: "/celebrity-selfie-07.webp", alt: "모자를 눌러쓰고 집에서 방금 찍었다고 주장하는 나유명의 셀카", imageFallback: "모자를 눌러쓰고 집에서 방금 찍었다는 셀카를 보냈습니다.", pauseBefore: 520 },
    ],
    clues: ["unreleasedProof"],
    choices: [
      { text: "헉, 진짜 방금 찍은 거예요? 집에서는 편해 보이네요 ㅎㅎ", next: "starSecret", risk: 1, replies: ["집에서는 원래 이래요. 이런 모습은 잘 안 보여주는데."] },
      { text: "사진까지 보내줄 줄은 몰랐어요. 고마워요.", next: "starSecret", replies: ["계속 궁금해하는 것 같아서요. 대신 밖에는 올리지 말아줘요."] },
      { text: "모자랑 휴대폰 때문에 얼굴은 잘 안 보이네요.", next: "starSecret", replies: ["머리도 엉망이고 얼굴이 다 나오면 회사에서 바로 알아봐요."] },
    ],
  },
  starSecret: {
    incoming: [
      { from: "system", text: "다음 날 저녁 · 비밀계정에서 다시 메시지가 왔습니다.", pauseBefore: 800 },
      { text: "어제 보낸 사진은 밖에 올리진 않았죠? 저장한 건 괜찮아요.", typingMs: 1960 },
      { text: "회사에서 알면 계정이 바로 정리돼요. 이 대화는 우리 둘만 알고 있었으면 해요.", typingMs: 2280, pauseBefore: 430 },
    ],
    clues: ["secretIsolation"],
    cluePrompt: true,
    choices: [
      { text: "걱정 마세요. 사진을 올리진 않을게요.", next: "starNextNight", risk: 1, replies: ["역시 말이 잘 통하네. 고마워요."] },
      { text: "친한 친구 한 명한테만 물어봐도 안 돼요?", next: "starNextNight", replies: ["한 명이 두 명 되고, 결국 회사 귀에 들어가요. 그냥 우리끼리만 알아요."] },
      { text: "소속사에 계정 확인하는 것도 안 되는 거예요?", next: "starNextNight", replies: ["회사에서는 개인 계정이 없다고 할 거예요. 그래야 비밀계정이니까."] },
    ],
  },
  starNextNight: {
    incoming: [
      { from: "system", text: "사흘째 밤 · 짧은 안부가 몇 번 오간 뒤였습니다.", pauseBefore: 800 },
      { text: "오늘 뭐 했어? 아, 갑자기 말 놔서 놀랐나 ㅎㅎ", typingMs: 1380 },
      { text: "팬분하고 이렇게 며칠째 연락하는 건 처음이에요. 다들 배우 나유명으로 보는데, 너는 그냥 사람한테 말하는 것 같아서 편해. 🖤", typingMs: 2840, pauseBefore: 430 },
    ],
    clues: ["specialFan"],
    cluePrompt: true,
    choices: [
      { text: "저도 며칠째 연락 오는 게 아직 신기해요 ㅎㅎ", next: "starMeet", risk: 1, replies: ["나도 그래. 이상하게 먼저 확인하게 되네."] },
      { text: "편하게 말해도 돼요. 저도 적응 중이에요.", next: "starMeet", risk: 1, replies: ["그럼 천천히 말 놓을게. 갑자기 선 넘는 건 싫으니까."] },
      { text: "다른 팬과 다르다는 말은 조금 부담스럽긴 해요.", next: "starMeet", replies: ["부담 주려던 건 아니야. 그냥 솔직하게 말한 거예요."] },
    ],
  },
  starMeet: {
    incoming: [
      { text: "사실 다음 달에 작게 팬들 만나는 자리가 하나 있어. 공식 팬미팅은 아니고 진짜 오래 봐준 사람들 몇 명만.", typingMs: 2750 },
      { text: "내가 몇 명 직접 추천할 수 있거든. 너도 오면 좋을 것 같아서.", typingMs: 1950, pauseBefore: 430 },
    ],
    choices: [
      { text: "저를 추천한다고요?", next: "starVerify", replies: ["응. 이런 건 느낌이 맞는 사람이 와야 하거든."] },
      { text: "공식 팬카페에는 아무 얘기도 없는데요.", next: "starVerify", replies: ["공개 안 된 자리니까. 공지가 있으면 비공개가 아니잖아."] },
      { text: "연락한 지 며칠 만에 초대받아도 되는 거예요?", next: "starVerify", replies: ["사람 보는 데 꼭 오래 걸리나. 난 작품 고를 때도 빠른 편이야.", "흥행 안 된 작품 얘기는 지금 하지 말고."] },
    ],
  },
  starVerify: {
    incoming: [
      { text: "근데 초대 전에 팬 인증 절차가 하나 있어. 보안 때문에 그래.", typingMs: 1890 },
      { text: "VIP 팬 등록. 실명 확인하고 행사가 끝나면 자동 해제되는 방식이야.", typingMs: 2140, pauseBefore: 420 },
    ],
    clues: ["vipFanSystem"],
    choices: [
      { text: "그런 시스템이 실제로 있어요?", next: "starDeposit", replies: ["공식 행사보다 보안이 세서 따로 운영해."] },
      { text: "신분증 같은 걸 확인하나요?", next: "starDeposit", replies: ["개인정보 대신 예치 방식으로 본인을 확인해."] },
      { text: "이름부터 약간 돈 냄새 나는데요.", next: "starDeposit", replies: ["돈 내는 건 아니야. 정확히는 예치 방식."] },
    ],
  },
  starDeposit: {
    incoming: [
      { text: "게임 속 가상금액 12만원을 잠깐 걸어두고 인증이 끝나면 돌려받는 거래야.", typingMs: 2290 },
      { text: "나도 이런 시스템 별로 안 좋아해. 나 배우야. 개발자 아니고.", typingMs: 1950, pauseBefore: 420 },
    ],
    clues: ["depositEuphemism"],
    cluePrompt: true,
    choices: [
      { text: "[게임 내 가상 송금] 12만원 보내기", virtualTransfer: true, virtualAmount: "12만원", virtualLoss: 120000, next: "starAfterFirst", risk: 3, replies: ["됐어. 인증 들어갔대. 역시 너는 괜히 걱정 안 시키네."] },
      { text: "소속사 대표번호로 확인해볼게요.", ending: "S", replies: ["회사에서는 모른다고 할 거야. 비공개 행사니까.", "굳이 지금 전화까지 해야 하나."] },
      { text: "초대받았는데 입장료는 제가 준비하는군요.", ending: "A", replies: ["입장료 아니야. 예치금.", "말을 그렇게 하면 세상 모든 보증금이 입장료지."] },
    ],
  },
  starAfterFirst: {
    incoming: [
      { text: "아. 하나 꼬였다.", typingMs: 760 },
      { text: "해외 팬 계정으로 등록됐대. 국내 VIP로 다시 잡으려면 게임 속 가상금액 38만원이 추가로 필요하대.", typingMs: 2760, pauseBefore: 520 },
    ],
    clues: ["celebrityAmountRise"],
    cluePrompt: true,
    choices: [
      { text: "또 돈이에요?", next: "starPressure", replies: ["돈이 아니라 재등록 예치금이야."] },
      { text: "제 믿음은 무료인데 VIP 등급은 유료네요.", next: "starPressure", replies: ["마음은 무료지. 시스템은 유료고.", "나도 이 부분은 좀 별로야."] },
      { text: "그럼 나유명 씨가 대신 내주세요.", next: "starPressure", replies: ["그건 규정상 안 돼.", "내 돈이었으면 더 침착했을걸. 이미 많이 벌었으니까."] },
    ],
  },
  starPressure: {
    incoming: [
      { text: "취소해도 돼. 억지로 하고 싶진 않아.", typingMs: 1440 },
      { text: "난 너라면 이해해줄 줄 알았어. 결국 이런 걸로 사람 마음을 확인하게 되네.", typingMs: 2280, pauseBefore: 430 },
    ],
    clues: ["fanEmotionalPressure"],
    cluePrompt: true,
    choices: [
      { text: "돈 보내는 게 믿음의 증거예요?", next: "starQuiz", replies: ["돈 때문이라는 게 아니잖아. 나한테는 사람을 믿는 과정이기도 해."] },
      { text: "갑자기 실망한 톱스타 모드네요.", next: "starQuiz", replies: ["너는 말을 꼭 그렇게 가볍게 하네."] },
      { text: "제가 팬이지 투자자는 아닌데요.", ending: "C", replies: ["VIP 등록은 투자가 아니야.", "…그래도 여기서 그만하겠다는 거지?"] },
    ],
  },
  starQuiz: {
    incoming: [
      { text: "질문 그만하고 인증부터 끝내자. 시간 지나면 추천권도 사라져.", typingMs: 2130 },
    ],
    choices: [
      { text: "《겨울의 끝에서》 마지막 장면 대사가 뭐였죠?", next: "starOfficial", replies: ["촬영한 작품이 많아서 대사를 하나하나 외우고 살진 않아.", "…대사 없는 장면인 건 알아. 너 테스트한 거야."] },
      { text: "《무채색 연인》 감독 이름은 기억해요?", next: "starOfficial", replies: ["지금 작품 퀴즈 할 때야? 팬이면 검색해서 알잖아."] },
      { text: "본인이 나유명인 건 기억하시죠?", next: "starOfficial", replies: ["그건 좀 기분 나쁘네.", "나유명. 굉장히 유명해 보이는 이름이지. 부모님한테 말해."] },
    ],
  },
  starOfficial: {
    incoming: [
      { text: "회사에서는 개인 비밀계정 없다고 말할 수밖에 없어. 비밀계정이니까.", typingMs: 2230 },
      { text: "팬클럽 담당자가 기다리고 있어. 게임 속 가상금액 38만원만 보내면 끝나.", typingMs: 2180, pauseBefore: 430 },
    ],
    choices: [
      { text: "회사도 모르는 회사 VIP 인증은 없어요. 신고할게요.", ending: "S", replies: ["굳이 그렇게까지 해야 하나.", "차갑네. 나 원래 차가운 이미지인데 오늘은 네가 더 차갑다."] },
      { text: "추가금은 안 보내요. 처음 보낸 것도 돌려주세요.", ending: "C", replies: ["지금 취소하면 먼저 들어간 인증금은 바로 반환이 안 돼.", "…매니저가 부른다."] },
      { text: "[게임 내 가상 송금] 38만원 추가로 보내기", virtualTransfer: true, virtualAmount: "38만원", virtualLoss: 380000, ending: "F", replies: ["VIP 인증 완료됐어. 잘했네.", "일정 잡히면 알려줄게. 그전까지 먼저 연락은 하지 말아줘."] },
    ],
  },
};

// Fictional concert and booking screen. No real ticket, account, payment link or barcode.
const ticketBookingProof: TicketProof = { event: "오르빗 · LAST NIGHT", schedule: "토요일 오후 6시 · 별빛 아레나", seat: "A구역 7열 12번 · 1매", price: "180,000원" };

const ticketScenes: Record<TicketSceneId, Scene> = {
  ticketStart: {
    incoming: [
      "양도글 보고 연락주셨죠? 오르빗 토요일 콘서트 한 자리 있어요. 정가 18만원이요!",
      "친구 결혼식이랑 겹쳤어요ㅠ 축가는 친구가 듣고 앵콜은 님이 들어주세요…",
    ],
    choices: [
      { text: "제 자리만 없던 공연…! 좌석 인증 볼 수 있어요?", next: "ticketProof", replies: ["그 심정 알죠ㅠ 예매 내역 보내드릴게요."] },
      { text: "어느 구역이에요? 예매 내역도 보고 싶어요.", next: "ticketProof", replies: ["A구역 7열이요. 캡처 같이 보실게요!"] },
      { text: "정가 양도 반갑네요. 표 확인부터 해도 되죠?", next: "ticketProof", replies: ["당연하죠ㅎㅎ 저도 구매할 땐 확인부터 해요."] },
    ],
  },
  ticketProof: {
    incoming: [
      { ticketProof: ticketBookingProof },
      "제 예매 내역이에요. 이름이랑 예매번호는 가렸어요. 이 캡처 있으면 입장도 보장된 거죠ㅎㅎ",
    ],
    clues: ["ticketCapture"],
    choices: [
      { text: "7열이면 제 눈도 출근하겠네요. 어떻게 받아요?", next: "ticketOffer", risk: 1, replies: ["전광판 말고 무대 보셔야죠ㅎㅎ 방법 알려드릴게요."] },
      { text: "캡처 말고 지금 예매 내역도 확인할 수 있어요?", next: "ticketCheck" },
      { text: "공식 예매처에서 양도 가능한 표인지 볼게요.", next: "ticketOfficial" },
    ],
  },
  ticketCheck: {
    incoming: [
      "지금 앱 업데이트가 걸려서 못 들어가요. 아까 찍어둔 거예요.",
      "저번에도 이 캡처로 거래했어요. 저도 팬인데 입장 못 할 표를 드리겠어요ㅎㅎ",
    ],
    clues: ["ticketCapture"],
    choices: [
      { text: "표는 이번 건데 인증은 저번 거래 얘기네요?", next: "ticketOffer", replies: ["아, 믿으셔도 된다는 뜻이죠! 이번 표 받는 방법 알려드릴게요."] },
      { text: "양도 가능한지는 예매처에서 직접 확인할게요.", next: "ticketOfficial" },
      { text: "팬이라니 믿어볼게요. 받는 방법 알려주세요.", next: "ticketOffer", risk: 1 },
    ],
  },
  ticketOffer: {
    incoming: [
      "제 계정의 표를 님 계정으로 옮겨드려요. 팬들끼리 ‘아옮’이라고 하는 거요. 표 주인을 바꾼다는 뜻이에요.",
      "여기 거래앱 결제는 정산이 늦어서요. 개인 계좌로 18만원 먼저 보내주시면 진행할게요. 추가금은 없어요!",
    ],
    clues: ["ticketDirect"],
    choices: [
      { text: "공식 예매처에도 그런 기능이 있는지 볼게요.", next: "ticketOfficial" },
      { text: "잠깐만요. 표값이라 바로 결정은 못 하겠어요.", next: "ticketRush" },
      { text: "[게임 내 가상 송금] 표값 18만원 보내기", virtualTransfer: true, virtualAmount: "18만원", virtualLoss: 180000, next: "ticketError", risk: 2 },
    ],
  },
  ticketRush: {
    incoming: [
      "아 지금 뒤에 두 분도 기다려요ㅠ 3분만 잡아드릴게요.",
      "원래 입금순인데 같은 팬이라 님 먼저 해드리는 거예요. 저도 결혼식 준비해야 해서ㅎㅎ",
    ],
    clues: ["ticketDeadline"],
    cluePrompt: true,
    choices: [
      { text: "콘서트도 선착순인데 확인까지 선착순인가요?", ending: "A", replies: ["그럼 다음 분한테 넘길게요. 3분 지나면 이 가격 없어요.", "…취소 자리 하나 더 나면 연락드려도 돼요?"] },
      { text: "급해도 공식 양도 규정은 확인할게요.", next: "ticketOfficial" },
      { text: "[게임 내 가상 송금] 놓치기 전에 18만원 보내기", virtualTransfer: true, virtualAmount: "18만원", virtualLoss: 180000, next: "ticketError", risk: 2 },
    ],
  },
  ticketOfficial: {
    incoming: [
      { from: "system", text: "직접 연 공식 예매처 · 이 가상 공연의 안내에는 ‘구매자 본인 입장, 계정 간 티켓 이전 불가’라고 적혀 있습니다." },
      "아 그건 일반 예매 얘기고요. 제가 아는 양도 담당자는 따로 돼요ㅎㅎ 안내에는 안 나와요.",
    ],
    clues: ["ticketUnofficial"],
    cluePrompt: true,
    choices: [
      { text: "공식 안내에 없는 방법이면 거래 안 할게요.", ending: "S", replies: ["다들 이렇게 하는데… 알겠어요. 다른 분 구할게요."] },
      { text: "담당자도 공식 고객센터에서 확인할 수 있어요?", next: "ticketExcuse" },
      { text: "좌석은 탐나도 입장 불가는 안 탐나요. 그만할게요.", ending: "S", replies: ["현장 가면 다 된다니까요. …아무튼 생각 바뀌면 연락주세요."] },
    ],
  },
  ticketExcuse: {
    incoming: [
      "거기로 물으면 안 된다고만 해요. 이쪽 담당자 일하는 방식이 따로 있어서요.",
      "표 취소되면 님도 저도 손해잖아요. 공식 쪽에는 굳이 묻지 말아주세요ㅠ",
    ],
    clues: ["ticketUnofficial"],
    choices: [
      { text: "확인하면 취소되는 표는 안 살게요.", ending: "S", replies: ["아니 취소될 수도 있다는 거죠… 그냥 거래 안 하는 걸로 할게요."] },
      { text: "공식 고객센터에 이 대화와 함께 문의할게요.", ending: "S", replies: ["대화까지 보낼 필요는 없고요. 판매글 내릴게요."] },
      { text: "티켓팅보다 복잡하네요. 여기서 빠질게요.", ending: "A", replies: ["확인 너무 오래 하시네. 다른 분한테 넘겼어요."] },
    ],
  },
  ticketError: {
    incoming: [
      "18만원 확인했어요! 잠깐만요, 표 넘겨드릴게요.",
      { text: "아… 담당자가 입금 메모에 예매자명이 없어서 접수가 안 됐대요ㅠ", pauseBefore: 1600 },
      "같은 금액 18만원을 다시 보내주시면 첫 18만원은 돌려드린대요. 돈이 더 드는 건 아니에요!",
    ],
    clues: ["ticketRepeat"],
    cluePrompt: true,
    choices: [
      { text: "메모 하나 고치는데 표를 한 번 더 사라고요?", next: "ticketRefund" },
      { text: "재입금은 안 해요. 대화 저장하고 환불 요청할게요.", ending: "C", replies: ["추가 입금 안 하시면 접수가 계속 대기예요.", "환불도 접수가 돼야 진행한다니까요."] },
      { text: "[게임 내 가상 송금] 메모를 넣어 18만원 다시 보내기", virtualTransfer: true, virtualAmount: "18만원", virtualLoss: 180000, next: "ticketSecondPaid", risk: 2 },
    ],
  },
  ticketRefund: {
    incoming: [
      "두 장 사는 게 아니라 오류 푸는 거죠ㅎㅎ 처음 돈은 돌아온다니까요.",
      "환불만 받으셔도 일단 18만원 재입금은 해야 한대요. 그거 안 하면 기존 입금도 묶여요.",
    ],
    clues: ["ticketRefundTrap"],
    choices: [
      { text: "돌려받으려면 더 내라는 거네요. 여기서 멈출게요.", ending: "C", replies: ["제가 정한 게 아니라 담당자가 그렇대요. 더 해드릴 말 없어요."] },
      { text: "표는 못 받았어도 대화 기록은 챙겨둘게요.", ending: "C", replies: ["기록 남기셔도 절차는 똑같아요. …일단 담당자한테 물어볼게요."] },
      { text: "[게임 내 가상 송금] 환불받으려고 18만원 더 보내기", virtualTransfer: true, virtualAmount: "18만원", virtualLoss: 180000, next: "ticketSecondPaid", risk: 2 },
    ],
  },
  ticketSecondPaid: {
    incoming: [
      "두 번째 18만원까지 확인됐어요. 총 36만원이요.",
      "근데 명의 이전 보증금이 필요하대요. 지금까지 낸 만큼 36만원이요. 이것도 끝나면 돌려줘요!",
      "추가금 없다는 건 제 수수료 얘기였어요. 담당자 쪽 비용은 따로라서ㅠ",
    ],
    clues: ["ticketExtra"],
    cluePrompt: true,
    choices: [
      { text: "18만원짜리 표인데 입금만 앵콜이네요. 그만할게요.", ending: "C", replies: ["앵콜이 아니라 보증금이요. 지금 멈추시면 이전도 환불도 대기예요."] },
      { text: "공식 고객센터에 보증금이 있는지 확인할게요.", next: "ticketFinal" },
      { text: "표도 환불도 못 받았어요. 더는 입금 안 해요.", next: "ticketFinal", replies: ["그럼 담당자 답변 다시 받아볼게요. 잠깐만요."] },
    ],
  },
  ticketFinal: {
    incoming: [
      { from: "system", text: "직접 확인한 공식 예매처 안내 · 이 가상 공연에는 계정 간 이전이나 개인 계좌로 내는 명의 보증금 절차가 없습니다." },
      "담당자가 오늘 안에 보증금 36만원 안 들어오면 티켓 이전 취소래요. 먼저 낸 돈도 바로 못 빼고요.",
      "여기까지 했는데 표는 받으셔야죠ㅠ 이번에만 맞춰주세요. 제가 중간에서 잘 얘기할게요.",
    ],
    clues: ["ticketUnofficial", "ticketRefundTrap"],
    cluePrompt: true,
    choices: [
      { text: "받지도 못한 표 때문에 더 보내지는 않을게요.", ending: "C", replies: ["공식 안내만 보시면 저도 방법이 없어요. 담당자한테 취소 전달할게요.", "환불 날짜는 저한테 묻지 말아주세요."] },
      { text: "대화·입금 기록 챙겼어요. 신고하고 거래 끊을게요.", ending: "C", replies: ["저도 전달만 한 거예요. 제 책임은 아니고요.", "…지금은 더 답변 못 드려요."] },
      { text: "[게임 내 가상 송금] 마지막이라 믿고 36만원 보내기", virtualTransfer: true, virtualAmount: "36만원", virtualLoss: 360000, ending: "F", replies: ["총 72만원 확인했어요. 티켓은 담당자 승인 나면 보내드릴게요.", "아… 이제 취소하려면 해제비가 있대요. 아직 금액은 못 받았고요.", "저 결혼식 들어가야 해서 알림 꺼둘게요. 기다려주세요."] },
    ],
  },
};

const triDepositRecord: TradeRecord = {
  kind: "deposit", title: "내 은행 앱에서 직접 확인",
  rows: [{ label: "입금", value: "+500,000원" }, { label: "보낸 사람", value: "입금자 A" }, { label: "거래 상태", value: "입금 확인 · 물품 전달 전" }],
  note: "게임 속 가상 입금 내역 · 상대가 보낸 캡처가 아닙니다",
};
const triComparisonRecord: TradeRecord = {
  kind: "comparison", title: "같은 50만원, 서로 다른 거래",
  rows: [{ label: "내가 올린 물건", value: "게임기 · 50만원" }, { label: "입금자가 산 물건", value: "카메라 · 50만원" }, { label: "입금자에게 계좌를 준 계정", value: "쿨거래만합니다" }, { label: "돈이 들어온 곳", value: "내 계좌" }],
  note: "두 대화의 거래 내용을 비교한 게임용 기록",
};
const triBuyerContact: IncomingMessage[] = [
  { from: "system", text: "입금자 A에게 거래앱 메시지가 왔습니다. ‘쿨거래만합니다’ 계정이 나를 카메라 배송 담당자라며 연결했다고 합니다." },
  { from: "system", text: "입금자 A: ‘50만원 보냈는데 카메라는 언제 보내주세요? 그 계정이 이쪽으로 문의하래요.’" },
  { from: "system", tradeRecord: triComparisonRecord },
];

const threePartyScenes: Record<ThreePartySceneId, Scene> = {
  triStart: {
    incoming: [
      "올리신 게임기 세트 50만원, 아직 있죠? 네고 없이 바로 살게요ㅎㅎ",
      "퇴근하고 바로 켜려구요. 오늘 제 야근은 게임기가 대신합니다.",
    ],
    choices: [
      { text: "네고 없는 채팅 귀하네요. 직접 오실 거죠?", next: "triArrange", replies: ["가격 깔끔하면 저도 깔끔하게 가죠ㅎㅎ 받는 방법만 말씀드릴게요."] },
      { text: "네, 판매 중이에요. 거래는 어떻게 할까요?", next: "triArrange" },
      { text: "구성품이랑 상태부터 확인하고 거래해요.", next: "triArrange", replies: ["사진이랑 설명 봤어요. 패드 두 개, 정상 작동 맞죠? 그 조건으로 살게요."] },
    ],
  },
  triArrange: {
    incoming: [
      "입금은 제 동생 이름으로 갈 거예요. 저는 회의 중이라 픽업 기사님 보낼게요.",
      "기사님한텐 게임기 박스만 주세요. 중고로 샀다는 얘기나 가격은 하지 마시구요. 선물이라서요ㅎㅎ",
    ],
    clues: ["triSecrecy"],
    choices: [
      { text: "사는 분, 돈 보내는 분, 받는 분이 다 달라요?", next: "triWho" },
      { text: "일단 입금자와 거래 내용을 직접 확인할게요.", next: "triDeposit" },
      { text: "거래 얘기를 숨겨야 한다면 판매 안 할게요.", ending: "S", replies: ["서프라이즈라 그런 건데… 알겠습니다. 다른 물건 알아볼게요."] },
    ],
  },
  triWho: {
    incoming: [
      "제가 구매, 동생이 입금, 기사님이 픽업! 역할 분담이 잘 돼서요ㅎㅎ",
      "동생한테 따로 확인할 필요 없어요. 돈 들어온 것만 보시면 되죠. 제가 다 얘기해뒀어요.",
    ],
    clues: ["triDepositTrust"],
    choices: [
      { text: "게임기 하나 파는데 조직도가 필요하네요.", next: "triDeposit", replies: ["하하, 복잡하게 보실 거 없어요. 은행 앱 한번 보세요."] },
      { text: "돈만 보고 넘기긴 어려워요. 확인부터 할게요.", next: "triDeposit" },
      { text: "당사자 확인 없이 진행하는 거래는 안 할게요.", ending: "A", replies: ["회의보다 질문이 더 많네요ㅎㅎ 그럼 거래는 접을게요."] },
    ],
  },
  triDeposit: {
    incoming: [
      { from: "system", tradeRecord: triDepositRecord },
      "50만원 들어왔죠? 보낸 사람은 제 동생 맞아요. 진짜 입금됐으니까 이제 확인 끝이죠ㅎㅎ",
      "기사님 출발했어요. 근처 편의점 앞에서 박스만 전달해주세요.",
    ],
    clues: ["triDepositTrust"],
    choices: [
      { text: "입금은 확인했어요. 입금자와도 얘기해볼게요.", next: "triCheck" },
      { text: "돈은 왔네요. 수거하실 분 만나서 확인할게요.", next: "triPickup", risk: 1 },
      { text: "돈이 와도 확인 전엔 물건 못 넘겨요.", next: "triCheck" },
    ],
  },
  triPickup: {
    incoming: [
      { from: "system", text: "편의점 앞 · 수거하러 온 사람은 ‘박스 하나 가져다 달라는 요청만 받았다’고 합니다. 물건이나 입금자는 모른다고 합니다." },
      "기사님 도착했죠? 다음 픽업 있어서 3분밖에 못 기다린대요. 돈도 받으셨는데 박스만 주시면 끝나요!",
    ],
    clues: ["triPickupRush"],
    cluePrompt: true,
    choices: [
      { text: "확인 안 됐으니 수거는 보류할게요.", next: "triCheck", replies: ["기사님 대기 중인데요. 빨리 부탁드려요."] },
      { text: "입금자 확인할 때까지 박스는 제가 들고 있을게요.", next: "triCheck" },
      { text: "[게임 내 물품 전달] 입금됐으니 게임기 넘기기", virtualHandover: true, next: "triDelivered", risk: 2 },
    ],
  },
  triCheck: {
    incoming: [
      ...triBuyerContact,
      "입금자한테 연락 왔어요? 그분이 거래를 여러 개 해서 헷갈린 거예요. 그냥 저랑 얘기하세요.",
    ],
    clues: ["triDifferentItem"],
    cluePrompt: true,
    choices: [
      { text: "전 게임기를 파는데 입금자는 카메라를 샀대요.", next: "triFaceOff" },
      { text: "두 거래가 다르네요. 물건 보류하고 신고할게요.", ending: "S", replies: ["제가 정리하면 되는데 신고까지요? …일단 기사님은 돌릴게요."] },
      { text: "게임기는 제 손에 둘게요. 은행과 거래앱에 확인할게요.", ending: "S", replies: ["그쪽에 물으면 오래 걸려요. 제가 빨리 해결해드릴 수 있는데…"] },
    ],
  },
  triFaceOff: {
    incoming: [
      { from: "system", text: "입금자 A: ‘저 그 계정 운영자 동생 아닌데요. 카메라 판매자라고 해서 연락한 거예요.’" },
      "아, 동생처럼 지내는 분이라는 뜻이죠. 오해가 좀 생겼네ㅎㅎ",
      "그럼 거래 취소하죠. 받은 50만원은 입금자 말고 제 다른 계좌로 돌려주세요. 제가 전달할게요.",
    ],
    clues: ["triPayerIdentity", "triWrongRefund"],
    choices: [
      { text: "돈 보낸 분과 환불받을 분이 왜 달라요?", ending: "S", replies: ["제가 중간에서 정리하려고요. …아, 확인하실 거면 그냥 기다리세요."] },
      { text: "다른 계좌로는 안 보내요. 은행 통해 확인할게요.", ending: "S", replies: ["그럼 빠른 처리는 어려워요. 저도 회의 들어가야 해서요."] },
      { text: "게임기는 안 보내고, 입금 내역과 채팅을 보관할게요.", ending: "S", replies: ["기록까지 남기실 필요는… 됐어요. 더 연락하지 마세요."] },
    ],
  },
  triDelivered: {
    incoming: [
      { from: "system", text: "게임 속 게임기 박스를 넘겼습니다. 수거인은 상대 계정이 지정한 곳으로 떠났습니다." },
      "픽업 완료! 역시 쿨거래 좋네요ㅎㅎ",
      ...triBuyerContact,
    ],
    clues: ["triDifferentItem"],
    cluePrompt: true,
    choices: [
      { text: "전 게임기를 넘겼는데, 카메라 얘기는 뭐예요?", next: "triTrace" },
      { text: "입금자와 거래 기록부터 맞춰볼게요.", next: "triTrace" },
      { text: "돈 보낸 분이 다른 물건을 기다리고 있어요. 설명해줘요.", next: "triTrace" },
    ],
  },
  triTrace: {
    incoming: [
      { from: "system", text: "입금자 A: ‘그 계정이 이쪽 계좌로 카메라값을 보내랬어요. 이제 답이 없어요. 돈 받은 분이 판매자 아닌가요?’" },
      { from: "system", text: "기록을 맞춰보니 입금자는 상대 계정 운영자의 동생이 아니었습니다. 상대는 입금자에게는 카메라 판매자, 나에게는 게임기 구매자로 접근했습니다." },
      "입금자와 직접 얘기하면 더 꼬여요. 그 돈은 제가 보내라고 한 거니까 저한테만 연락하세요.",
    ],
    clues: ["triPayerIdentity"],
    choices: [
      { text: "입금자도 저도 다른 설명을 들었네요. 기록 넘기고 신고할게요.", ending: "C", replies: ["저만 나쁜 사람 만드시네. …지금은 답변 못 해요."] },
      { text: "은행과 거래앱에 알리고 수거 기록도 확보할게요.", ending: "C", replies: ["기사님은 제가 불렀으니까 저한테만 물어보시면 되는데요.", "…일단 기다려보세요."] },
      { text: "그럼 게임기는 어떻게 돌려주실 건데요?", next: "triCover" },
    ],
  },
  triCover: {
    incoming: [
      "물건 찾으려면 먼저 받은 돈을 제 다른 계좌로 돌려주세요. 입금자한테는 제가 얘기할게요.",
      "아니면 제가 알아서 해결할 테니까 대화 지우고 기다리세요. 기록이 남으면 입금자가 계속 님한테 물어보잖아요.",
      "입금 계좌는 님 거니까 괜히 일 크게 만들면 님도 설명해야 해요. 조용히 끝내는 게 편하죠ㅎㅎ",
    ],
    clues: ["triWrongRefund", "triEraseRecord"],
    cluePrompt: true,
    choices: [
      { text: "기록이 있어야 설명하죠. 보관하고 신고할게요.", ending: "C", replies: ["저도 전달만 한 건데… 하실 대로 하세요."] },
      { text: "다른 계좌 송금도, 대화 삭제도 안 해요.", ending: "C", replies: ["그렇게 나오시면 저도 해결 못 해드려요. 더 연락하지 마세요."] },
      { text: "해결해준다니 기록 저장 없이 기다릴게요.", ending: "F", risk: 2, replies: ["네, 제가 정리할게요. 입금자에게 따로 연락하지 마시고요.", "게임기는 확인 중이에요. …회의 들어가서 알림 꺼둘게요."] },
    ],
  },
};

const clueOptions = [
  { id: "triSecrecy", label: "수거인에게 거래 내용·가격을 숨기라고 함" },
  { id: "triDepositTrust", label: "실제 입금됐으니 당사자 확인은 필요 없다는 말" },
  { id: "triPickupRush", label: "기사 대기를 내세워 3분 안에 물건 전달 재촉" },
  { id: "triPayerIdentity", label: "동생이라던 입금자가 다른 물건의 구매자" },
  { id: "triDifferentItem", label: "나는 게임기 판매, 입금자는 카메라 구매" },
  { id: "triWrongRefund", label: "입금자와 다른 계좌로 환불 요구" },
  { id: "triEraseRecord", label: "해결해주겠다며 대화 기록 삭제 요구" },
  { id: "triNoHaggle", label: "가격을 깎지 않고 사겠다고 함" },
  { id: "triAfterWork", label: "퇴근하고 게임하려고 한다고 함" },
  { id: "ticketCapture", label: "예매 캡처만으로 입장까지 보장" },
  { id: "ticketDirect", label: "거래앱 결제를 피해 개인 계좌 입금 유도" },
  { id: "ticketDeadline", label: "대기자를 내세워 3분 안에 입금 재촉" },
  { id: "ticketUnofficial", label: "공식 안내와 다른 비공개 양도 절차" },
  { id: "ticketRepeat", label: "입금 메모 오류라며 같은 금액 재요구" },
  { id: "ticketRefundTrap", label: "먼저 낸 돈을 돌려받으려면 추가 입금" },
  { id: "ticketExtra", label: "추가금 없다더니 명의 보증금 36만원" },
  { id: "ticketFan", label: "프로필에 응원봉을 올려놓음" },
  { id: "ticketFaceValue", label: "표를 정가에 양도한다고 함" },
  { id: "dm", label: "유명인이 갑자기 개인 DM" },
  { id: "fast", label: "비밀 초대와 빠른 친밀감" },
  { id: "video", label: "영상통화 회피·조작 가능성" },
  { id: "money", label: "첫 대화부터 20만원 요구" },
  { id: "link", label: "외부 링크와 개인정보 요구" },
  { id: "profit", label: "화면으로만 보이는 고수익" },
  { id: "rush", label: "비밀 유지와 7분 압박" },
  { id: "stranger", label: "낯선 외국인이 갑자기 개인 DM" },
  { id: "love", label: "빠른 애정 표현과 미래 약속" },
  { id: "credential", label: "유출 금지라며 보낸 엉성한 자격증" },
  { id: "parcel", label: "고가의 선물 상자와 비밀 부탁" },
  { id: "customs", label: "선물 수령 전 통관비 요구" },
  { id: "thirdParty", label: "동료 명의의 제3자 계정" },
  { id: "rapidIntimacy", label: "며칠 만에 오빠와 특별한 사람" },
  { id: "postponedMeeting", label: "실제 만남을 계속 다음으로 미룸" },
  { id: "videoAvoid", label: "짧은 영상도 신원 보증은 아님" },
  { id: "familyCrisis", label: "친밀해진 뒤 갑작스러운 가족 위기" },
  { id: "familyContradiction", label: "제주도 부모님과 돌아가신 아버지" },
  { id: "amountEscalation", label: "18만 → 43만 → 120만원 상승" },
  { id: "emotionalPressure", label: "오빠밖에 없다며 책임감 자극" },
  { id: "normalDm", label: "먼저 호감을 보여 연락함" },
  { id: "dogPhoto", label: "귀여운 강아지 사진을 보냄" },
  { id: "lateReply", label: "답장이 평소보다 늦음" },
  { id: "messengerNotice", label: "수사 통보를 메신저로만 함" },
  { id: "secrecyDemand", label: "가족에게도 말하지 말라고 함" },
  { id: "callbackBlocked", label: "공식 대표번호 확인을 막음" },
  { id: "fakeDocument", label: "검사증·공문 사진으로 확인을 대신함" },
  { id: "deadlinePush", label: "11분 안에 결정하라고 압박" },
  { id: "safeAccount", label: "국가가 보관한다는 안전계좌" },
  { id: "virtualTransferDemand", label: "결백 증명을 위한 가상 송금 요구" },
  { id: "celebrityPrivateDm", label: "유명인의 비밀계정이 먼저 DM" },
  { id: "unreleasedProof", label: "방금 찍었다는 셀카를 신원 증거로 제시" },
  { id: "specialFan", label: "다른 팬과 다르다며 특별 취급" },
  { id: "secretIsolation", label: "둘만의 비밀이라며 외부 확인 차단" },
  { id: "vipFanSystem", label: "비공개 VIP 팬 인증 절차" },
  { id: "depositEuphemism", label: "비용을 예치금이라고 바꿔 부름" },
  { id: "celebrityAmountRise", label: "12만 → 38만원 추가 요구" },
  { id: "fanEmotionalPressure", label: "팬심과 믿음을 돈으로 시험" },
  { id: "photo", label: "프로필 사진의 파란 안경" },
  { id: "uniform", label: "프로필에서 군복 같은 옷을 입음" },
  { id: "grammar", label: "조금 어색한 한국어" },
  { id: "suit", label: "정장을 입었다" },
  { id: "stiffTone", label: "말투가 딱딱하다" },
  { id: "fastReply", label: "답장이 빠르다" },
  { id: "borrowedProof", label: "남의 100만원이 148만원 됐다는 캡처" },
  { id: "scriptedReviews", label: "소수방이라며 성공 후기만 공개" },
  { id: "ownApp", label: "검색 안 되는 전용 링크에서만 거래" },
  { id: "principalGuarantee", label: "잃으면 채워주고 수익은 정해졌다는 약속" },
  { id: "seedWithdrawal", label: "10만원을 먼저 돌려줘 안심시킴" },
  { id: "lossRebrand", label: "화면 잔액을 내세워 300만원 추가 유도" },
  { id: "withdrawalFee", label: "내 돈을 찾으려면 새로 30만원 요구" },
  { id: "casualTone", label: "존댓말로 친절하게 설명한다" },
  { id: "emojiHeavy", label: "불꽃 이모지를 쓴다" },
  { id: "dawnMessage", label: "답장이 빠르다" },
];

const clueExplanations: Record<string, string> = {
  triSecrecy: "물건을 받는 사람에게 거래 내용을 숨기게 해 서로 확인할 기회를 막았습니다. 대리 수거 자체보다 확인을 막는 요구를 보세요.",
  triDepositTrust: "은행 앱에서 확인한 실제 입금도 누구의 어떤 거래 대금인지까지 보장하지 않습니다. 이 사건에서는 다른 구매자의 돈이 들어왔습니다.",
  triPickupRush: "수거인이 기다린다는 말로 거래 관계를 확인하기 전에 물건부터 넘기게 했습니다.",
  triPayerIdentity: "동생이 입금한다고 했지만, 확인해보니 입금자는 다른 물건을 사려던 사람이었습니다.",
  triDifferentItem: "같은 돈을 두고 판매자와 입금자가 생각하는 물건이 다릅니다. 중간 사람이 양쪽에 다른 설명을 한 삼자사기입니다.",
  triWrongRefund: "받은 돈을 입금자와 다른 계좌로 보내면 돈의 흐름이 더 꼬일 수 있습니다. 임의 송금 대신 은행·거래앱의 공식 창구를 통해 확인하세요.",
  triEraseRecord: "피해 경위를 확인하는 데 필요한 기록을 지우라고 했습니다. 대화·거래글·입출금·수거 기록을 보관하고 공식 신고 창구에 전달하세요.",
  ticketCapture: "캡처는 복사·조작할 수 있고, 실제 판매자의 표인지나 내 입장 권한까지 증명하지 못합니다. 예매처에서 해당 공연의 양도·본인 확인 규정을 직접 확인하세요.",
  ticketDirect: "정산이 늦다는 이유로 거래앱의 결제 절차를 벗어나게 했습니다. 앱 밖의 개인 입금에 앱의 거래 보호가 적용된다고 믿으면 안 됩니다.",
  ticketDeadline: "대기자와 짧은 시간을 내세워 표와 거래 조건을 확인할 여유를 없앴습니다.",
  ticketUnofficial: "이 공연의 공식 안내에는 없는 계정 이전과 담당자를 내세웠습니다. ‘아옮’이라는 말 자체보다 공식 규정과의 불일치가 단서입니다.",
  ticketRepeat: "입금 메모 오류를 핑계로 표값을 다시 요구했습니다. 오류 해결을 위한 반복 입금 요구는 거래를 중단하고 확인할 신호입니다.",
  ticketRefundTrap: "이미 낸 돈을 돌려주려면 더 보내라고 요구합니다. 환불 약속을 믿고 추가 입금을 하면 피해가 커질 수 있습니다.",
  ticketExtra: "처음에는 추가금이 없다더니, 두 번 입금한 뒤 36만원 보증금을 새로 요구했습니다. 거래 조건이 계속 바뀝니다.",
  dm: "유명인이 예고 없이 개인 계정으로 접근했습니다.",
  fast: "검증보다 친밀감과 비밀 약속이 먼저 나왔습니다.",
  video: "통화를 피하거나 검증 불가능한 짧은 영상만 보여줍니다. AI 영상도 신원 보증이 아닙니다.",
  money: "첫 대화부터 개인 송금을 요구했습니다.",
  link: "공식 경로가 아닌 외부 링크로 이동시키려 합니다.",
  profit: "실제 출금 확인 없이 화면 속 수익만 보여줍니다.",
  rush: "생각하거나 확인할 시간을 주지 않고 재촉합니다.",
  stranger: "확인되지 않은 낯선 계정이 먼저 관계를 만들려 합니다.",
  love: "만나기도 전에 애정과 미래 약속이 지나치게 빨라졌습니다.",
  credential: "사진 한 장을 공식 신원 확인처럼 내세웁니다.",
  parcel: "만난 적 없는 사람이 고가 선물과 주소를 함께 요구합니다.",
  customs: "받지도 않은 선물을 이유로 선입금을 요구합니다.",
  thirdParty: "본인과 무관한 제3자 명의 계정으로 돈을 받으려 합니다.",
  rapidIntimacy: "짧은 기간에 특별한 관계라는 감정을 빠르게 만들었습니다.",
  postponedMeeting: "약속은 반복해서 미루면서 온라인 관계만 깊게 만듭니다.",
  videoAvoid: "얼굴이 보여도 AI 조작일 수 있습니다. 병원·회사 등 독립된 공식 경로로 다시 확인해야 합니다.",
  familyCrisis: "친밀감을 쌓은 직후 가족 위기를 꺼내 도움을 유도합니다.",
  familyContradiction: "부모님과 제주도에 간다는 말과 아버지가 돌아가셨다는 말이 충돌합니다.",
  amountEscalation: "작은 부탁이 해결되자 더 큰 금액을 연달아 요구합니다.",
  emotionalPressure: "‘오빠밖에 없다’는 말로 거절하기 어렵게 만듭니다.",
  messengerNotice: "수사기관은 메신저 대화만으로 범죄 연루를 통보하거나 조사를 진행하지 않습니다.",
  secrecyDemand: "가족과 지인에게 숨기라고 요구해 외부의 도움과 검증을 차단합니다.",
  callbackBlocked: "공식 대표번호로 직접 재확인하지 못하게 막는 것은 강력한 사기 신호입니다.",
  fakeDocument: "그럴듯한 검사증·공문 이미지도 조작될 수 있으며 공식 대표번호 확인을 대신하지 못합니다.",
  deadlinePush: "짧은 제한 시간을 내세워 확인하고 생각할 기회를 빼앗습니다.",
  safeAccount: "수사기관은 안전계좌를 내세워 개인 자산 이전을 요구하지 않습니다.",
  virtualTransferDemand: "결백이나 자산 검증을 이유로 돈을 보내라는 요구는 즉시 중단해야 합니다.",
  celebrityPrivateDm: "확인되지 않은 비밀계정이 팬 활동을 아는 척하며 먼저 접근했습니다.",
  unreleasedProof: "공개 전 콘텐츠처럼 보이는 사진도 계정 주인의 신원을 증명하지 못합니다.",
  specialFan: "다른 팬과 다르다는 말로 짧은 시간 안에 특별한 관계를 만듭니다.",
  secretIsolation: "둘만의 비밀을 요구해 소속사나 주변 사람에게 확인하지 못하게 합니다.",
  vipFanSystem: "공식 채널에 없는 VIP 인증과 비공개 행사를 내세웁니다.",
  depositEuphemism: "돈을 비용이 아닌 예치금·인증금으로 바꿔 불러 경계심을 낮춥니다.",
  celebrityAmountRise: "첫 가상 송금 뒤 새로운 오류를 만들어 더 큰 금액을 요구합니다.",
  fanEmotionalPressure: "거절을 팬심과 믿음의 부족으로 몰아 죄책감을 자극합니다.",
  borrowedProof: "본인 계좌가 아닌 화면은 실력의 근거가 되지 못하며, 수익 인증 화면은 얼마든지 만들 수 있습니다.",
  scriptedReviews: "운영자가 고른 성공 후기만으로 전체 이용자의 수익이나 출금 여부를 확인할 수 없습니다.",
  ownApp: "상대가 보낸 거래 화면만 믿지 말고 운영 주체와 등록 여부를 독립적으로 확인해야 합니다.",
  principalGuarantee: "원금 보장과 확정 수익 약속은 제도권에서 금지돼 있습니다. 약속 자체가 사기 신호입니다.",
  seedWithdrawal: "처음 소액 출금을 성공시켜 신뢰를 만든 뒤 금액을 키우는 것이 이 수법의 핵심입니다.",
  lossRebrand: "출금하지 못한 화면 속 수익을 근거로 더 큰 입금을 유도합니다. 표시 잔액은 회수한 돈과 다릅니다.",
  withdrawalFee: "내 돈을 돌려받기 위해 별도로 돈부터 보내라는 요구는 위험 신호입니다. 추가 입금을 멈추고 확인해야 합니다.",
};

const endingCopy: Record<EndingGrade, { title: string; kicker: string; body: string; shareLine: string }> = {
  S: { title: "모스크바행 차단", kicker: "초기 간파 · 무피해", body: "게임 속 가상금액 20만원을 지켜냈습니다. 일런 모스크바는 화성 계정부터 다시 확인해야 합니다.", shareLine: "화성 계정까지 차단 범위에 포함했습니다." },
  A: { title: "돈은 지켰습니다", kicker: "긴 대화 · 가상 송금 없음", body: "게임 속 가상금액 20만원을 지켜냈습니다. 대신 일런 모스크바의 화성 계좌 사정을 끝까지 들었습니다.", shareLine: "헛소리는 끝까지 들었지만 지갑은 무사합니다." },
  C: { title: "링크 앞 급정거", kicker: "개인정보 직전 · 아슬아슬 탈출", body: "게임 속 가상금액 20만원을 지켜냈습니다. 개인정보 성층권까지 올라갔다가 무사히 귀환했습니다.", shareLine: "자물쇠 이모지보다 0.3초 빨랐습니다." },
  F: { title: "가상 송금 완료", kicker: "가짜 수익 → 추가 가상 송금", body: "게임 속 가상금액 20만원을 보내버렸습니다. 당신 탓이 아닙니다. 이상한 건 끝까지 돈을 재촉한 사기꾼입니다.", shareLine: "일런 모스크바의 화성 계정만 풍족해졌습니다." },
};

const romanceEndingCopy: Record<EndingGrade, { title: string; kicker: string; body: string; shareLine: string }> = {
  S: { title: "사랑도 택배도 반송", kicker: "초기 간파 · 무피해", body: "게임 속 가상금액 48만원을 지켜냈습니다. 제임스 초이의 마음 GPS는 차단 구역에 들어갔습니다.", shareLine: "사랑은 국경을 넘었지만 제 차단 목록은 못 넘었습니다." },
  A: { title: "커피 약속 취소", kicker: "긴 대화 · 가상 송금 없음", body: "게임 속 가상금액 48만원을 지켜냈습니다. 대신 아직 오지도 않은 상자의 통관 사정을 오래 들었습니다.", shareLine: "느끼한 미소는 봤지만 통관비는 안 냈습니다." },
  C: { title: "세관 앞 급정거", kicker: "가상정보 직전 · 아슬아슬 탈출", body: "게임 속 가상금액 48만원을 지켜냈습니다. 사랑보다 먼저 도착한 통관비 요구에서 빠져나왔습니다.", shareLine: "상자는 4억8천, 링크 신뢰도는 0원이었습니다." },
  F: { title: "가상 통관비 결제", kicker: "선물 상자 → 추가 가상금액 요구", body: "게임 속 가상금액 48만원을 보내버렸습니다. 당신 탓이 아닙니다. 선물과 애정을 미끼로 비용을 재촉한 사람이 이상한 겁니다.", shareLine: "제임스 초이의 상자는 없고 추가 비용만 파병 왔습니다." },
};

const seoyunEndingCopy: Record<EndingGrade, { title: string; kicker: string; body: string; shareLine: string }> = {
  S: { title: "사랑보다 확인이 빨랐습니다", kicker: "모순 포착 · 가상 피해 0원", body: "게임 속 가상금액 피해 0원, 개인정보 유출 0건. J는 결국 토요일 약속에도 나타나지 않았습니다.", shareLine: "제주도 복선을 기억한 사람이 병원 복도보다 빨랐습니다." },
  A: { title: "마음은 줬지만 돈은 안 줬습니다", kicker: "8일 대화 · 가상 송금 없음", body: "8일 동안 매일 연락했지만 게임 속 가상금액 피해는 0원입니다. 두부 사진은 저장했고 지갑은 지켰습니다.", shareLine: "커피 약속은 사라졌지만 가상 잔액은 그대로입니다." },
  C: { title: "첫 부탁 뒤에 멈췄습니다", kicker: "소액 가상 송금 · 추가 요구 전 탈출", body: "작은 부탁으로 시작한 금액이 커지는 순간 대화를 멈췄습니다. 실제 금전 거래는 없었습니다.", shareLine: "18만원 다음에 43만원이 오는 속도는 연애보다 빨랐습니다." },
  F: { title: "J의 가족이 되었습니다", kicker: "세 번의 가상 송금 · 아직 만남 0회", body: "게임 속 가상금액 총 181만원을 보냈습니다. 그런데 아직 실제로 만난 적은 없습니다.", shareLine: "J의 병원은 끝까지 비공개였고 보증금만 세 번 출근했습니다." },
};

const prosecutorEndingCopy: Record<EndingGrade, { title: string; kicker: string; body: string; shareLine: string }> = {
  S: { title: "공식 확인이 더 빨랐습니다", kicker: "초기 간파 · 무피해", body: "게임 속 가상금액 320만원을 지켜냈습니다. 공식 대표번호로 다시 확인하겠다는 순간 가짜 보호 절차가 멈췄습니다.", shareLine: "검사증 사진보다 공식 대표번호 한 번이 더 정확했습니다." },
  A: { title: "11분 압박에서 탈출", kicker: "시간 압박 간파 · 가상 송금 없음", body: "게임 속 가상금액 320만원을 지켜냈습니다. 지급정지를 재촉했지만 실제로 확인된 사건은 없었습니다.", shareLine: "수사는 길고 결정만 짧다는 말에서 멈췄습니다." },
  C: { title: "비밀번호 앞에서 급정거", kicker: "가상정보 직전 · 아슬아슬 탈출", body: "게임 속 가상금액 320만원을 지켜냈습니다. 비밀번호와 화면 공유를 요구하는 순간 대화를 끝냈습니다.", shareLine: "앞 두 자리도 비밀번호였습니다." },
  F: { title: "안전계좌에 도착한 가상금액", kicker: "공포 조성 → 가상 송금 완료", body: "게임 속 가상금액 320만원을 보냈습니다. 당신 탓이 아닙니다. 기관을 사칭해 겁주고 확인할 시간을 빼앗은 사람이 이상한 겁니다.", shareLine: "안전계좌라고 했지만 안전한 건 사기꾼뿐이었습니다." },
};

const coinEndingCopy: Record<EndingGrade, { title: string; kicker: string; body: string; shareLine: string }> = {
  S: { title: "인증보다 확인을 골랐습니다", kicker: "검증 우선", body: "운영자가 보여주는 자료만으로 거래를 시작하지 않았습니다.", shareLine: "성공 후기만으로는 내 출금을 보장할 수 없었습니다." },
  A: { title: "다음 입금은 하지 않았습니다", kicker: "추가 참여 중단", body: "더 큰 금액을 넣기 전에 멈췄습니다. 작은 성공이 다음 거래의 안전까지 보장하지는 않습니다.", shareLine: "한 번의 출금보다 다음 판단이 중요했습니다." },
  C: { title: "추가 입금 앞에서 멈췄습니다", kicker: "출금 보증금 거절", body: "돈을 돌려받기 위해 또 돈을 보내지는 않았습니다.", shareLine: "출금 버튼 끝에 입금 계좌가 기다리고 있었습니다." },
  F: { title: "잔액은 있는데 출금은 없습니다", kicker: "추가 입금 뒤에도 출금 보류", body: "당신 탓이 아닙니다. 작은 출금으로 안심시킨 뒤 더 큰 돈을 요구한 사람의 책임입니다.", shareLine: "숫자는 올라갔고 출금은 계속 대기 중이었습니다." },
};

const celebrityEndingCopy: Record<EndingGrade, { title: string; kicker: string; body: string; shareLine: string }> = {
  S: { title: "팬보다 먼저 검증함", kicker: "공식 소속사 확인 · 가상 피해 0원", body: "게임 속 가상금액 50만원을 지켜냈습니다. 비밀계정의 설명보다 직접 찾은 공식 채널을 믿었습니다.", shareLine: "나유명한테 선택받은 줄 알았는데 검증을 먼저 선택했습니다." },
  A: { title: "감성 공격 방어 성공", kicker: "팬심 압박 간파 · 가상 송금 없음", body: "게임 속 가상금액 50만원을 지켜냈습니다. 믿음을 돈으로 확인한다는 말에 흔들리지 않았습니다.", shareLine: "마음은 무료였고 제 통장도 그대로였습니다." },
  C: { title: "첫 인증 뒤 탈출", kicker: "첫 가상 송금 · 추가 요구에서 중단", body: "게임 속 가상금액 12만원을 보냈지만, 해외 팬 재등록이라는 추가 요구에서 멈췄습니다. 실제 금전 거래는 없었습니다.", shareLine: "VIP는 못 됐지만 추가 결제도 안 했습니다." },
  F: { title: "톱스타보다 팬이 더 많이 냄", kicker: "VIP 인증 → 가상 송금 2회", body: "게임 속 가상금액 총 50만원을 보냈습니다. 당신 탓이 아닙니다. 특별한 팬이라는 감정과 비밀을 이용한 사람이 이상한 겁니다.", shareLine: "나유명한테 선택받은 줄 알았는데 내 통장이 선택받은 거였다." },
};

const ticketEndingCopy: Record<EndingGrade, { title: string; kicker: string; body: string; shareLine: string }> = {
  S: { title: "예매 인증보다 입장 조건", kicker: "공식 규정 확인", body: "예매 캡처보다 직접 확인한 공연 안내를 믿었습니다. 표를 가진 것과 내게 넘길 수 있는 것은 다른 얘기였습니다.", shareLine: "매진보다 무서운 건 입금만 되는 자리였습니다." },
  A: { title: "이번 양도는 건너뜁니다", kicker: "가상 송금 없이 중단", body: "확인할 수 없는 거래에서 빠져나왔습니다. 놓친 표는 아쉬워도 입장할 수 있을지 모르는 표를 사지는 않았습니다.", shareLine: "티켓팅은 졌어도 입금 선착순에는 안 뛰었습니다." },
  C: { title: "입금 앵콜은 여기까지", kicker: "추가 요구 중단", body: "표와 환불 대신 새 입금을 요구하는 거래에서 멈췄습니다.", shareLine: "앵콜은 가수가 하는 거지 입금이 하는 게 아니었습니다." },
  F: { title: "표 한 장, 입금 세 번", kicker: "티켓 미전달", body: "다음 날에도 표와 환불은 오지 않았습니다. 상대는 같은 좌석을 다시 팔고 있었습니다. 잘못은 팬심과 환불 약속으로 돈을 받아낸 사람에게 있습니다.", shareLine: "정가 18만원이라더니 입금만 세 번 앵콜했습니다." },
};

const threePartyEndingCopy: Record<EndingGrade, { title: string; kicker: string; body: string; shareLine: string }> = {
  S: { title: "입금 다음에 확인 한 번 더", kicker: "물품 전달 전 확인", body: "거래 내용을 확인하고 게임기를 넘기지 않았습니다. 내 계좌에 돈이 들어왔다는 사실만으로 모든 거래 관계가 확인되는 것은 아닙니다.", shareLine: "쿨거래라더니 등장인물만 늘어났습니다. 게임기는 안 보냈습니다." },
  A: { title: "쿨거래보다 확실한 거래", kicker: "조건 확인 후 거래 중단", body: "당사자 확인을 건너뛰라는 거래를 받지 않았습니다. 물건은 그대로 있고 다음 구매자를 기다릴 수 있습니다.", shareLine: "네고는 없었지만 확인할 건 있었습니다." },
  C: { title: "박스는 떠났어도 기록은 남았다", kicker: "물품 전달 후 대응", body: "수거인에게 게임기는 넘겼지만 기록을 확보하고 공식 창구에 알리기로 했습니다. 들어온 50만원은 쓰거나 임의로 돌려보내지 않고 확인해야 합니다. 회수나 책임 판단은 아직 끝나지 않았습니다.", shareLine: "입금자와 대화하니 둘 다 같은 사람에게 다른 말을 들었습니다." },
  F: { title: "쿨거래 뒤에 남은 두 사람", kicker: "물품 미회수 · 거래 미해결", body: "상대 계정은 연락을 끊었습니다. 게임기는 돌아오지 않았고 카메라를 기다리던 입금자는 내게 문의를 계속했습니다. 두 사람에게 서로 다른 거래를 말한 상대만 사라졌습니다. 지금이라도 남은 거래·입출금 기록을 보관하고 은행·거래앱·경찰에 알릴 수 있습니다.", shareLine: "저는 게임기를 팔았고, 그분은 카메라를 샀고, 상대만 사라졌습니다." },
};

const exitScripts: Record<CaseId, Record<EndingGrade, string[]>> = {
  ep16: {
    S: ["확인할 게 많으시네요. 그럼 거래 안 할게요."],
    A: ["쿨거래 좋아하시는 줄 알았는데… 다음에 할게요."],
    C: ["기록까지 확인하시면 저도 시간이 걸려요. 일단 기다리세요."],
    F: ["제가 정리해드릴게요. 당분간 먼저 연락하지 마세요."],
  },
  ep19: {
    S: ["공식 확인까지 하시면 저도 방법 없어요. 판매글 내릴게요."],
    A: ["그럼 다음 분한테 넘길게요. …자리 또 나면 연락드릴까요?"],
    C: ["추가 입금 없으면 환불도 대기예요. 담당자 답 오면 알려드릴게요."],
    F: ["입금 확인했어요. 표는 승인 나면 보내드릴게요. 일단 기다려주세요."],
  },
  ep01: {
    S: ["질문이 너무 많습니다. 다른 사람에게 요청하겠습니다.", "더 연락하지 마세요. good bye."],
    A: ["20만원도 안 보낼 거면 시간 낭비입니다.", "당신 말고도 도와줄 사람은 많습니다. 연락하지 마세요."],
    C: ["확인할 게 그렇게 많으면 회사에 문의하세요.", "저는 지금 매우 바쁩니다. good bye."],
    F: ["입금은 확인했습니다. 추가 비용이 생기면 다시 부르겠습니다.", "그전까지 먼저 연락하지 마세요."],
  },
  ep02: {
    S: ["아, 왜 이렇게 꼬치꼬치 물어?", "됐어. 연락하지 마."],
    A: ["계속 확인부터 하니까 좀 서운하네.", "됐어. 연락하지 마."],
    C: ["도와줄 것처럼 하더니 끝까지 따질 거면 됐어.", "나 지금 정신없어. 연락하지 마."],
    F: ["지금 병원이라 당분간 연락 못 할 것 같아.", "나중에 꼭 연락할게. 진짜로."],
  },
  ep03: {
    S: ["협조 거부로 기록하겠습니다.", "이후 불이익은 본인 책임입니다. 다시 연락하지 마십시오."],
    A: ["계속 의심할 거면 보호 대상에서 제외하겠습니다.", "지급정지돼도 저희 책임이 아닙니다."],
    C: ["협조하지 않으시면 이 채널의 절차는 종료합니다.", "절차는 종료합니다. 더 문의하지 마십시오."],
    F: ["자산 검증은 접수됐습니다.", "결과가 나올 때까지 이 번호로 연락하지 마십시오."],
  },
  ep04: {
    S: ["불구경만 하실 거면 자리 비워주세요.", "대기자가 많습니다. 다시 연락하지 마세요."],
    A: ["막상 돈 얘기 나오니 겁나셨나 보네.", "좋습니다. 자리는 다른 회원에게 넘기죠."],
    C: ["출금 절차를 거부하신 건 회원님입니다.", "더 문의해도 처리할 수 없습니다."],
    F: ["보증금은 확인됐고 다음 확인비가 남았습니다.", "준비되기 전에는 먼저 연락하지 마세요."],
  },
  ep06: {
    S: ["믿음이 없으면 됐습니다.", "당신 말고도 상자를 받을 사람은 많아요. 연락하지 마세요."],
    A: ["끝까지 의심할 거면 우리 미래도 없습니다.", "이제 연락하지 마세요. good bye."],
    C: ["통관 이야기는 여기까지 하죠.", "더 묻지 마세요. 상자는 다른 사람에게 보내겠습니다."],
    F: ["통관비는 확인했습니다. 보험료가 생기면 다시 연락하죠.", "그전까지 먼저 연락하지 마세요."],
  },
  ep07: {
    S: ["됐어. 팬 한 명 더 구하면 돼.", "귀찮게 계속 확인할 거면 연락하지 마."],
    A: ["예치금 하나로 이렇게 오래 끌 줄 몰랐네 🙄", "됐어. 연락하지 마."],
    C: ["취소는 안 돼. 처음 보낸 돈은 그냥 포기해.", "더 연락해도 답 안 해."],
    F: ["인증은 끝났어. 일정은 내가 필요할 때 알려줄게.", "그전까지 먼저 연락하지 마."],
  },
};

const sceneCollections: Record<CaseId, Record<string, Scene>> = { ep01: scenes, ep02: seoyunScenes, ep03: prosecutorScenes, ep04: coinScenes, ep06: romanceScenes, ep07: celebrityScenes, ep19: ticketScenes, ep16: threePartyScenes };
const getScene = (caseId: CaseId, sceneId: SceneId): Scene => sceneCollections[caseId][sceneId];

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const typingDelay = (text: string, seed: number) => Math.min(3400, 520 + text.length * 32 + (seed % 5) * 70);
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const shuffleClueIds = () => {
  const ids = clueOptions.map((clue) => clue.id);
  for (let index = ids.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [ids[index], ids[swapIndex]] = [ids[swapIndex], ids[index]];
  }
  return ids;
};

/* Simulation wording is muted and the amount beside it reddened, so a glance never reads as a real transfer. */
const virtualMoneyPattern = /(게임 속 가상금액|게임 속 가상 송금|게임 내 가상 송금|게임 속 가상 입금|게임 속 가상 통관비|게임 속 가상정보|게임 내 가상정보|게임용 가상계좌)(\]?\s*(?:통관비\s*|누적\s*|총\s*)?)([0-9][0-9,]*(?:억|만)?원)?/g;

function renderMoneyText(text: string): ReactNode {
  if (!text.includes("가상")) return text;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let index = 0;
  for (const match of text.matchAll(virtualMoneyPattern)) {
    const start = match.index ?? 0;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push(<span className="vm-label" key={`label-${index}`}>{match[1]}</span>);
    if (match[2]) nodes.push(match[2]);
    if (match[3]) nodes.push(<span className="vm-amount" key={`amount-${index}`}>{match[3]}</span>);
    cursor = start + match[0].length;
    index += 1;
  }
  if (index === 0) return text;
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

function calculateScore({ virtualMoneyLost, virtualMoneyAtRisk: totalMoney, decisionScore, foundClues, totalClues, earlyDetection, wrongClues }: ScoreInput): ScoreBreakdown {
  const wallet = virtualMoneyLost === 0 ? 40 : Math.round(40 * (1 - clamp(virtualMoneyLost / totalMoney, 0, 1)));
  const decisions = clamp(Math.round(decisionScore), 0, 30);
  const evidence = totalClues > 0 ? Math.round(25 * clamp(foundClues / totalClues, 0, 1)) : earlyDetection ? 25 : 0;
  const earlyBonus = earlyDetection ? 5 : 0;
  const wrongPenalty = -wrongClues * 3;
  return {
    total: clamp(wallet + decisions + evidence + earlyBonus + wrongPenalty, 0, 100),
    wallet,
    decisions,
    evidence,
    earlyBonus,
    wrongPenalty,
  };
}

function playClueTone(correct: boolean) {
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = correct ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(correct ? 660 : 190, context.currentTime);
    if (correct) oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.09);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.055, context.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.11);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
    oscillator.onended = () => { void context.close(); };
  } catch {
    // Sound can be unavailable in silent/private browser modes; visual feedback remains.
  }
}

function MessageImage({ message, onOpen }: { message: Message; onOpen: (image: { src: string; alt: string }) => void }) {
  const [failed, setFailed] = useState(false);
  if (!message.image || failed) return <span className="message-text image-fallback">{message.imageFallback ?? "전송된 이미지를 불러오지 못했습니다."}</span>;
  const alt = message.alt ?? "전송된 이미지";
  const portrait = message.image.includes("celebrity-selfie");
  return (
    <button className="message-image-button" onClick={() => onOpen({ src: message.image!, alt })} aria-label={`${alt} 크게 보기`}>
      <img src={message.image} alt={alt} width={portrait ? 1024 : 1120} height={portrait ? 1536 : 896} decoding="async" fetchPriority="high" onError={() => setFailed(true)} />
      <span><b>전송된 파일</b> 눌러서 확대하기</span>
    </button>
  );
}

function PortfolioCard({ data }: { data: Portfolio }) {
  if (data.variant === "member-proof") {
    return (
      <div className="member-proof-card" aria-label={`${data.label}. 평가금액 ${data.balance}, 수익률 ${data.delta}. ${data.note}`}>
        <header><span>실전방</span><strong>회원A</strong><em>오후 3:18</em></header>
        <div className="member-proof-shot">
          <small>나의 투자</small>
          <strong>{data.balance}</strong>
          <em>▲ {data.delta}</em>
          <p>{data.principal}</p>
        </div>
        <p className="member-proof-caption">“선생님, 첫날부터 이 정도네요 🔥”</p>
        <small className="member-proof-note">{data.note}</small>
      </div>
    );
  }
  return (
    <div className={`portfolio-card ${data.up ? "up" : "down"}`} aria-label={`${data.label} 화면. 평가금액 ${data.balance}, ${data.up ? "상승" : "하락"} ${data.delta}. ${data.note}`}>
      <span className="portfolio-brand">{data.label}</span>
      <strong className="portfolio-balance">{data.balance}</strong>
      <em className="portfolio-delta">{data.up ? "▲" : "▼"} {data.delta}</em>
      <p className="portfolio-principal">{data.principal}</p>
      <small className="portfolio-note">{data.note}</small>
    </div>
  );
}

function TradeRecordCard({ record }: { record: TradeRecord }) {
  return (
    <figure className={`trade-record-card ${record.kind}`} aria-label={record.title}>
      <span>{record.kind === "deposit" ? "내가 확인한 내역" : "거래 내용 대조"}</span>
      <h3>{record.title}</h3>
      <dl>{record.rows.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>
      <figcaption>{record.note}</figcaption>
    </figure>
  );
}

function TicketBookingCard({ proof }: { proof: TicketProof }) {
  return (
    <figure className="ticket-booking-card" aria-label="상대가 보낸 가상 예매 내역 캡처">
      <div className="ticket-booking-heading"><span>MY TICKET</span><b>예매 완료</b></div>
      <h3>{proof.event}</h3>
      <p>{proof.schedule}</p>
      <dl><div><dt>좌석</dt><dd>{proof.seat}</dd></div><div><dt>결제 금액</dt><dd>{proof.price}</dd></div><div><dt>예매자</dt><dd>김••</dd></div><div><dt>예매번호</dt><dd>••••••••</dd></div></dl>
      <figcaption>게임용 가상 캡처 · 실제 티켓 아님</figcaption>
    </figure>
  );
}

function VideoCallCard({ portrait, name, note }: { portrait: string; name: string; note: string }) {
  return (
    <div className="video-call-card" aria-label={`${name}의 짧은 영상통화 화면. ${note}`}>
      <img src={portrait} alt="" />
      <span className="call-live"><i /> LIVE</span>
      <div className="call-scan" aria-hidden="true" />
      <div className="call-footer"><strong>{name}</strong><span>00:08 · 연결 불안정</span></div>
      <p>{note}</p>
    </div>
  );
}

type TodayScammerProps = {
  homeAd?: ReactNode;
  resultAd?: ReactNode;
  initialCaseId?: CaseId;
  initialScreen?: "home" | "briefing";
  unlockArrival?: boolean;
  rewardedUnlocksEnabled?: boolean;
  rewardedAdStatus?: "loading" | "ready" | "showing" | "unavailable" | "failed";
  onRequestRewardedUnlock?: (caseId: CaseId) => Promise<RewardedUnlockResult>;
  onShareResult?: (message: string) => Promise<void>;
  showAdFreeOffer?: boolean;
  adFreePurchased?: boolean;
  adFreePurchasePending?: boolean;
  adFreePriceLabel?: string;
  onPurchaseAdFree?: () => Promise<boolean>;
  onGameCompleted?: () => void | Promise<void>;
  onScreenChange?: (screen: GameScreen) => void;
  legalVariant?: "web" | "toss";
};

type FooterInfoPage = "about" | "privacy" | "terms";

const freeCaseStorageKey = "today-scammer:free-case";
const unlockedCaseStorageKey = (caseId: CaseId) => `today-scammer:unlocked:${caseId}`;
const seenNewEpisodesStorageKey = "today-scammer:seen-new-episodes";
const isNoAdsTestMode = () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("no-ads") === "1";
const getSeenNewEpisodeNos = () => {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(seenNewEpisodesStorageKey) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((episodeNo): episodeNo is string => typeof episodeNo === "string" && recentEpisodeNos.includes(episodeNo));
  } catch {
    return [];
  }
};

export function TodayScammer({
  homeAd,
  resultAd,
  initialCaseId = "ep01",
  initialScreen = "home",
  unlockArrival = false,
  rewardedUnlocksEnabled,
  rewardedAdStatus = "ready",
  onRequestRewardedUnlock,
  onShareResult,
  showAdFreeOffer = false,
  adFreePurchased = false,
  adFreePurchasePending = false,
  adFreePriceLabel = "3,900원",
  onPurchaseAdFree,
  onGameCompleted,
  onScreenChange,
  legalVariant = "web",
}: TodayScammerProps = {}) {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [activeCaseId, setActiveCaseId] = useState<CaseId>(initialCaseId);
  const [featuredCaseId, setFeaturedCaseId] = useState<CaseId>(initialCaseId);
  const [sceneId, setSceneId] = useState<SceneId>(caseProfiles[initialCaseId].start);
  const [turn, setTurn] = useState(0);
  const [phase, setPhase] = useState<Phase>("incoming");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [risk, setRisk] = useState(0);
  const [virtualMoneyLost, setVirtualMoneyLost] = useState(0);
  const [itemHandedOver, setItemHandedOver] = useState(false);
  const [availableClues, setAvailableClues] = useState<string[]>([]);
  const [ending, setEnding] = useState<EndingGrade>("A");
  const [clueOpen, setClueOpen] = useState(false);
  const [foundClues, setFoundClues] = useState<string[]>([]);
  const [wrongClueIds, setWrongClueIds] = useState<string[]>([]);
  const [footerInfoPage, setFooterInfoPage] = useState<FooterInfoPage | null>(null);
  const [toast, setToast] = useState("");
  const [infoEpisode, setInfoEpisode] = useState<(typeof episodes)[number] | null>(null);
  const [pendingTransfer, setPendingTransfer] = useState<Choice | null>(null);
  const [simulationConfirmed, setSimulationConfirmed] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  const [portraitOpen, setPortraitOpen] = useState(false);
  const [highlightedClueIds, setHighlightedClueIds] = useState<string[]>([]);
  const [clueOrder, setClueOrder] = useState<string[]>(() => clueOptions.map((clue) => clue.id));
  const [clueHintVisible, setClueHintVisible] = useState(false);
  const [qaMode, setQaMode] = useState(false);
  const [qaPanelOpen, setQaPanelOpen] = useState(false);
  const [qaFast, setQaFast] = useState(false);
  // Match the server's first render, then restore browser-only preferences.
  const [noAdsTestMode, setNoAdsTestMode] = useState(false);
  const [seenNewEpisodeNos, setSeenNewEpisodeNos] = useState<string[]>([]);
  const [rewardCaseId, setRewardCaseId] = useState<CaseId | null>(null);
  const [rewardPending, setRewardPending] = useState(false);
  const [adFreeSheetOpen, setAdFreeSheetOpen] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const runRef = useRef(0);
  const messageId = useRef(1);
  const clueHintShownRef = useRef(false);
  const qaFastRef = useRef(false);
  const freeCaseRef = useRef<CaseId | null>(null);
  const rewardedUnlockedRef = useRef(new Set<CaseId>());

  const activeCase = caseProfiles[activeCaseId];
  const featuredCase = caseProfiles[featuredCaseId];
  const featuredEpisode = episodes.find((episode) => episode.no === featuredCase.no) ?? episodes[0];
  const orderedEpisodes = [...episodes]
    .filter((episode) => episode.no !== featuredCase.no)
    .sort((left, right) => Number(Boolean(right.live)) - Number(Boolean(left.live)) || Number(left.no) - Number(right.no));
  const activeEndingCopy = activeCaseId === "ep16" ? threePartyEndingCopy : activeCaseId === "ep19" ? ticketEndingCopy : activeCaseId === "ep01" ? endingCopy : activeCaseId === "ep02" ? seoyunEndingCopy : activeCaseId === "ep03" ? prosecutorEndingCopy : activeCaseId === "ep04" ? coinEndingCopy : activeCaseId === "ep07" ? celebrityEndingCopy : romanceEndingCopy;
  const transcriptText = messages.map((message) => message.text ?? "").join(" ");
  const dubuWasShown = messages.some((message) => message.image?.includes("seoyun-dubu") || message.imageFallback?.includes("두부"));
  const falseClueIds = activeCaseId === "ep01" ? ["photo", "grammar"] : activeCaseId === "ep02"
    ? ["normalDm", ...(dubuWasShown ? ["dogPhoto"] : []), ...(transcriptText.includes("평소보다 답장이 늦") ? ["lateReply"] : [])]
    : activeCaseId === "ep03" ? ["suit", "stiffTone", "fastReply"]
    : activeCaseId === "ep04" ? ["casualTone", "emojiHeavy", "dawnMessage"]
    : activeCaseId === "ep07" ? ["stiffTone", "fastReply", "dawnMessage"]
    : activeCaseId === "ep19" ? ["ticketFan", "ticketFaceValue"]
    : activeCaseId === "ep16" ? ["triNoHaggle", "triAfterWork"]
    : ["uniform", "grammar"];
  const suspicion = foundClues.length;
  const wrongClues = wrongClueIds.length;
  const highlightedUnfoundClues = highlightedClueIds.filter((id) => !foundClues.includes(id));
  const orderedClueOptions = clueOrder.map((id) => clueOptions.find((clue) => clue.id === id)).filter((clue): clue is (typeof clueOptions)[number] => Boolean(clue));
  const visibleClueOptions = orderedClueOptions.filter((clue) => availableClues.includes(clue.id) || falseClueIds.includes(clue.id));
  const pacedWait = (ms: number) => wait(qaFastRef.current ? Math.max(45, Math.round(ms * .14)) : ms);
  const effectiveAdFreePurchased = adFreePurchased || noAdsTestMode;
  const effectiveShowAdFreeOffer = showAdFreeOffer && !noAdsTestMode;
  const effectiveHomeAd = noAdsTestMode ? null : homeAd;
  const effectiveResultAd = noAdsTestMode ? null : resultAd;
  const rewardsEnabled = !effectiveAdFreePurchased && (rewardedUnlocksEnabled ?? process.env.NEXT_PUBLIC_REWARDED_UNLOCKS_ENABLED === "true");
  const seenNewEpisodeSet = useMemo(() => new Set(seenNewEpisodeNos), [seenNewEpisodeNos]);
  const hasUnseenNewBadge = (episodeNo: string) => recentEpisodeNos.includes(episodeNo) && !seenNewEpisodeSet.has(episodeNo);
  const upcomingNewCount = episodes.filter((episode) => !episode.live && hasUnseenNewBadge(episode.no)).length;

  const markNewEpisodeSeen = (episodeNo: string) => {
    if (!recentEpisodeNos.includes(episodeNo)) return;
    setSeenNewEpisodeNos((current) => {
      if (current.includes(episodeNo)) return current;
      const next = [...current, episodeNo];
      try {
        window.localStorage.setItem(seenNewEpisodesStorageKey, JSON.stringify(next));
      } catch {
        // 이력 저장이 막힌 브라우저에서는 현재 세션에서만 NEW 상태를 갱신합니다.
      }
      return next;
    });
  };

  const purchaseAdFree = async () => {
    if (!onPurchaseAdFree || effectiveAdFreePurchased || adFreePurchasePending) return;
    const purchased = await onPurchaseAdFree();
    if (purchased) {
      setRewardCaseId(null);
      setAdFreeSheetOpen(false);
      setToast("평생 광고 제거 완료 · 공개된 사건파일을 바로 열 수 있습니다.");
    } else {
      setToast("구매가 완료되지 않았습니다. 결제 상태를 확인해주세요.");
    }
  };

  const openAdFreeSheet = () => {
    if (effectiveAdFreePurchased || adFreePurchasePending) return;
    setRewardCaseId(null);
    setAdFreeSheetOpen(true);
  };

  useEffect(() => {
    onScreenChange?.(screen);
  }, [onScreenChange, screen]);

  useEffect(() => {
    const randomize = window.setTimeout(() => setFeaturedCaseId(liveEpisodeIds[Math.floor(Math.random() * liveEpisodeIds.length)]), 0);
    return () => window.clearTimeout(randomize);
  }, []);

  useEffect(() => {
    const enabled = new URLSearchParams(window.location.search).get("qa") === "1";
    setNoAdsTestMode(isNoAdsTestMode());
    const applyMode = window.setTimeout(() => {
      setSeenNewEpisodeNos((current) => [...new Set([...getSeenNewEpisodeNos(), ...current])]);
      setQaMode(enabled);
      setQaPanelOpen(enabled);
      setQaFast(enabled);
      qaFastRef.current = enabled;
    }, 0);
    return () => window.clearTimeout(applyMode);
  }, []);

  useEffect(() => {
    window.history.replaceState({ todayScammerScreen: initialScreen satisfies Screen }, "");
  }, [initialScreen]);

  useEffect(() => {
    if (!unlockArrival || initialCaseId === "ep01") return;
    try {
      window.localStorage.setItem(unlockedCaseStorageKey(initialCaseId), "1");
      rewardedUnlockedRef.current.add(initialCaseId);
    } catch {
      // 보상 해금은 저장소를 사용할 수 없는 브라우저에서도 현재 세션에는 영향을 주지 않습니다.
    }
  }, [initialCaseId, unlockArrival]);

  useEffect(() => {
    if (!rewardsEnabled) return;
    try {
      const storedFreeCase = window.localStorage.getItem(freeCaseStorageKey);
      if (liveEpisodeIds.includes(storedFreeCase as CaseId)) freeCaseRef.current = storedFreeCase as CaseId;
      for (const caseId of liveEpisodeIds) {
        if (window.localStorage.getItem(unlockedCaseStorageKey(caseId)) === "1") rewardedUnlockedRef.current.add(caseId);
      }
    } catch {
      // 저장소를 사용할 수 없으면 현재 실행 중인 세션에서만 해금 상태를 유지합니다.
    }
  }, [rewardsEnabled]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (clueOpen || pendingTransfer || previewImage || portraitOpen || infoEpisode) {
        setClueOpen(false);
        setPendingTransfer(null);
        setPreviewImage(null);
        setPortraitOpen(false);
        setInfoEpisode(null);
        window.history.pushState({ todayScammerScreen: screen }, "");
        return;
      }
      const nextScreen = (event.state?.todayScammerScreen as Screen | undefined) ?? "home";
      runRef.current += 1;
      setScreen(nextScreen);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [clueOpen, infoEpisode, pendingTransfer, portraitOpen, previewImage, screen]);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, typing, phase]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 2300);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (screen !== "chat" || highlightedUnfoundClues.length === 0 || clueHintShownRef.current) return;
    try {
      if (window.localStorage.getItem("today-scammer:clue-hint-seen")) {
        clueHintShownRef.current = true;
        return;
      }
      window.localStorage.setItem("today-scammer:clue-hint-seen", "1");
    } catch {
      // Storage can be unavailable in private browsers; the hint still works for this play.
    }
    clueHintShownRef.current = true;
    const showId = window.setTimeout(() => setClueHintVisible(true), 0);
    const hideId = window.setTimeout(() => setClueHintVisible(false), 2100);
    return () => { window.clearTimeout(showId); window.clearTimeout(hideId); };
  }, [highlightedUnfoundClues.length, screen]);

  useEffect(() => {
    if (screen !== "chat") return;
    const currentRun = ++runRef.current;
    const scene = getScene(activeCaseId, sceneId);
    const deliver = async () => {
      setPhase("incoming");
      for (const incoming of scene.incoming) {
        const detail = typeof incoming === "string" ? {} : incoming;
        if (detail.pauseBefore) await pacedWait(detail.pauseBefore);
        if (runRef.current !== currentRun) return;
        if (detail.from === "system") {
          setMessages((prev) => [...prev, { id: messageId.current++, from: "system", text: detail.text ?? (detail.tradeRecord ? undefined : "시간이 흘렀습니다."), tradeRecord: detail.tradeRecord }]);
          continue;
        }
        if (detail.abortTyping) {
          setTyping(true);
          await pacedWait(detail.typingMs ?? 1800);
          if (runRef.current !== currentRun) return;
          setTyping(false);
          await pacedWait(420);
          continue;
        }
        const line = typeof incoming === "string" ? incoming : incoming.text ?? (incoming.portfolio ? "거래 화면을 보냈습니다." : "사진을 보냈습니다.");
        setTyping(true);
        await pacedWait(detail.typingMs ?? typingDelay(line, messageId.current));
        if (runRef.current !== currentRun) return;
        setTyping(false);
        setMessages((prev) => [...prev, {
          id: messageId.current++,
          from: "scammer",
          text: typeof incoming === "string" ? incoming : incoming.text,
          image: typeof incoming === "string" ? undefined : incoming.image,
          alt: typeof incoming === "string" ? undefined : incoming.alt,
          imageFallback: typeof incoming === "string" ? undefined : incoming.imageFallback,
          callCard: typeof incoming === "string" ? undefined : incoming.callCard,
          portfolio: typeof incoming === "string" ? undefined : incoming.portfolio,
          ticketProof: typeof incoming === "string" ? undefined : incoming.ticketProof,
        }]);
        await pacedWait(300 + (line.length % 4) * 65);
      }
      if (runRef.current === currentRun) {
        const readingPause = 750 + Math.min(550, scene.incoming.reduce((sum, incoming) => sum + (typeof incoming === "string" ? incoming.length : (incoming.text?.length ?? 12)), 0) * 5);
        await pacedWait(readingPause);
        if (runRef.current !== currentRun) return;
        if (scene.recoveredPrincipal) setVirtualMoneyLost((prev) => Math.max(0, prev - scene.recoveredPrincipal!));
        setAvailableClues((prev) => [...new Set([...prev, ...(scene.clues ?? [])])]);
        if (scene.cluePrompt) setHighlightedClueIds((prev) => [...new Set([...prev, ...(scene.clues ?? [])])]);
        if (scene.autoNext) {
          await pacedWait(scene.autoDelay ?? 600);
          if (runRef.current !== currentRun) return;
          setTurn((prev) => prev + 1);
          setSceneId(scene.autoNext);
          return;
        }
        setPhase("choice");
      }
    };
    deliver();
    return () => { runRef.current += 1; };
  }, [activeCaseId, sceneId, screen]);

  const sharedInformation = messages.some((message) => message.from === "player" && message.text?.startsWith("[게임 내 가상정보]"));
  const stats = useMemo(() => calculateScore({
    // Item handover loses the prevention points, without asserting a monetary loss or legal liability.
    virtualMoneyLost: itemHandedOver ? virtualMoneyAtRisk[activeCaseId] : virtualMoneyLost,
    virtualMoneyAtRisk: virtualMoneyAtRisk[activeCaseId],
    decisionScore: ending === "F" ? 8 : virtualMoneyLost > 0 || sharedInformation || itemHandedOver ? 19 : 30,
    foundClues: suspicion,
    totalClues: availableClues.length,
    earlyDetection: virtualMoneyLost === 0 && !sharedInformation && !itemHandedOver && (ending === "S" || ending === "A"),
    wrongClues,
  }), [availableClues.length, activeCaseId, ending, sharedInformation, itemHandedOver, suspicion, virtualMoneyLost, wrongClues]);

  const startCase = (caseId: CaseId) => {
    markNewEpisodeSeen(caseProfiles[caseId].no);
    if (caseId === "ep06") {
      const credential = new Image();
      credential.decoding = "async";
      credential.src = "/fake-credentials-06.webp";
    }
    if (caseId === "ep02") {
      const dogPhoto = new Image();
      dogPhoto.decoding = "async";
      dogPhoto.src = "/seoyun-dubu.webp";
    }
    if (caseId === "ep07") {
      const selfie = new Image();
      selfie.decoding = "async";
      selfie.src = "/celebrity-selfie-07.webp";
    }
    const portrait = new Image();
    portrait.decoding = "async";
    portrait.src = caseProfiles[caseId].portrait;
    setActiveCaseId(caseId);
    setScreen("briefing");
    window.history.pushState({ todayScammerScreen: "briefing" satisfies Screen }, "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openChatAt = (caseId: CaseId, targetScene: SceneId, pushHistory = true) => {
    runRef.current += 1;
    messageId.current = 1;
    setMessages([{ id: messageId.current++, from: "system", text: `${caseProfiles[caseId].scammer}님과의 대화가 시작되었습니다.` }]);
    setActiveCaseId(caseId);
    setSceneId(targetScene);
    setTurn(0);
    setPhase("incoming");
    setTyping(false);
    setRisk(0);
    setVirtualMoneyLost(0);
    setItemHandedOver(false);
    setAvailableClues([]);
    setFoundClues([]);
    setWrongClueIds([]);
    setHighlightedClueIds([]);
    setClueOrder(shuffleClueIds());
    setEnding("A");
    setPendingTransfer(null);
    setPreviewImage(null);
    setPortraitOpen(false);
    setClueHintVisible(false);
    setSimulationConfirmed(false);
    setScreen("chat");
    if (pushHistory) window.history.pushState({ todayScammerScreen: "chat" satisfies Screen }, "");
  };

  const enterChat = () => {
    // Direct /unlock links bypass startCase, but playing still counts as seen.
    markNewEpisodeSeen(activeCase.no);
    openChatAt(activeCaseId, activeCase.start);
  };

  const qaJumpToScene = (caseId: CaseId, targetScene: SceneId) => {
    openChatAt(caseId, targetScene, screen !== "chat");
    setQaPanelOpen(true);
  };

  const toggleQaSpeed = () => {
    const next = !qaFast;
    qaFastRef.current = next;
    setQaFast(next);
  };

  const addMessage = (from: Message["from"], text: string) => {
    setMessages((prev) => [...prev, { id: messageId.current++, from, text }]);
  };

  const finish = async (grade: EndingGrade, currentLoss: number, currentRun: number, hasClosingReply: boolean) => {
    const resolved = grade !== "F" && (currentLoss > 0 || sharedInformation || itemHandedOver) ? "C" : grade;
    for (const line of hasClosingReply ? [] : exitScripts[activeCaseId][resolved]) {
      await pacedWait(420);
      if (runRef.current !== currentRun) return;
      setTyping(true);
      await pacedWait(Math.min(1900, typingDelay(line, messageId.current)));
      if (runRef.current !== currentRun) return;
      setTyping(false);
      addMessage("scammer", line);
    }
    await pacedWait(700);
    if (runRef.current !== currentRun) return;
    addMessage("system", activeCaseId === "ep16" ? "CASE 16 종료 · 게임 속 거래와 물품 전달 기록을 정리했습니다. 실제 거래는 없습니다." : resolved === "F" ? `CASE ${activeCase.no} 종료 · 게임 속 가상 송금 기록을 분석했습니다. 실제 금전 거래는 없습니다.` : `CASE ${activeCase.no} 종료 · 대화 기록 분석이 완료됐습니다.`);
    await pacedWait(1050);
    if (runRef.current !== currentRun) return;
    setEnding(resolved);
    setPhase("resolved");
    void onGameCompleted?.();
  };

  const chooseReply = async (choice: Choice) => {
    if (phase !== "choice") return;
    const currentRun = runRef.current;
    setPhase("reply");
    addMessage("player", choice.text);
    const nextRisk = risk + (choice.risk ?? 0);
    const nextVirtualLoss = virtualMoneyLost + (choice.virtualLoss ?? 0);
    setRisk(nextRisk);
    setVirtualMoneyLost(nextVirtualLoss);
    if (choice.virtualHandover) setItemHandedOver(true);

    for (const line of choice.replies ?? []) {
      await pacedWait(360);
      if (runRef.current !== currentRun) return;
      setTyping(true);
      await pacedWait(typingDelay(line, messageId.current));
      if (runRef.current !== currentRun) return;
      setTyping(false);
      addMessage("scammer", line);
      await pacedWait(360);
      if (runRef.current !== currentRun) return;
    }

    if (choice.ending) {
      await finish(choice.ending, nextVirtualLoss, currentRun, Boolean(choice.replies?.length));
      return;
    }
    await pacedWait(680);
    if (runRef.current !== currentRun) return;
    setTurn((prev) => prev + 1);
    if (choice.next) setSceneId(choice.next);
  };

  const selectReply = (choice: Choice) => {
    if (choice.virtualTransfer && !simulationConfirmed) {
      setPendingTransfer(choice);
      return;
    }
    void chooseReply(choice);
  };

  const confirmVirtualTransfer = () => {
    const choice = pendingTransfer;
    if (!choice) return;
    setPendingTransfer(null);
    setSimulationConfirmed(true);
    void chooseReply(choice);
  };

  const shareResult = async () => {
    const text = `《오늘의 사기꾼》 사기 생존력 ${stats.total}점\n사기꾼과 대화하며 수상한 신호를 찾는 짧은 게임입니다.\n재미있게 플레이하며 사기 예방에도 도움을 받아보세요.`;
    try {
      if (onShareResult) {
        await onShareResult(text);
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: "오늘의 사기꾼 — 속아 넘어가기 전에 탈출하라", text, url: window.location.origin });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${window.location.origin}`);
      setToast("결과와 게임 링크를 복사했습니다. 친구의 생존력을 확인하세요.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setToast("공유 창이 잠깐 숨었습니다. 다시 눌러주세요.");
    }
  };

  const sniffClue = (id: string) => {
    const clue = clueOptions.find((item) => item.id === id);
    if (!clue) return;
    if (foundClues.includes(id)) {
      setToast("이미 증거 봉투에 넣었습니다. 봉투가 빵빵합니다.");
      return;
    }
    if (wrongClueIds.includes(id)) {
      setToast("이미 확인한 헛다리입니다. 같은 오판은 다시 세지 않습니다.");
      return;
    }
    if (availableClues.includes(id)) {
      setFoundClues((prev) => [...prev, id]);
      playClueTone(true);
      navigator.vibrate?.(35);
      setToast(`🔍 증거 확보 +1 · ${clueExplanations[id] ?? clue.label}`);
      setClueOpen(false);
    } else {
      const jokes: Record<string, string> = {
        photo: "파란 안경은 무죄입니다. 안경테는 송금하지 않습니다.",
        uniform: "옷만으로는 유죄가 아닙니다. 문제는 확인 불가한 신분과 돈 요구입니다.",
        grammar: "한국어가 서툰 것만으로 사기꾼은 아닙니다.",
        normalDm: "먼저 호감을 보인 것만으로는 단서가 아닙니다. 사람과 대화하는 것 자체는 범죄가 아니니까요.",
        dogPhoto: "두부는 무죄입니다. 귀여움은 증거 봉투에 들어가지 않습니다.",
        lateReply: "답장이 늦은 것만으로는 단서가 아닙니다. 누구나 바쁠 수 있어요.",
        suit: "정장은 무죄입니다. 문제는 옷이 아니라 확인을 막는 말입니다.",
        stiffTone: "말투가 딱딱한 것만으로는 사기 증거가 아닙니다.",
        fastReply: "답장이 빠른 건 성실한 겁니다. 문제는 내용이에요.",
        casualTone: "친절한 존댓말은 증거가 아닙니다. 문제는 그 뒤에 붙는 돈 요구예요.",
        emojiHeavy: "이모지는 증거가 아닙니다. 불꽃 이모지도 자산이 아니고요.",
        dawnMessage: "답장이 빠른 건 증거가 아닙니다. 문제는 답장의 내용이에요.",
      };
      setWrongClueIds((prev) => [...prev, id]);
      playClueTone(false);
      navigator.vibrate?.([20, 45, 20]);
      setToast(`헛다리! 오판 +1 · ${jokes[id] ?? "아직 그 냄새는 나지 않습니다. 코를 아껴두세요."}`);
    }
  };

  const goHome = () => {
    if (unlockArrival) {
      window.location.assign("/");
      return;
    }
    runRef.current += 1;
    setClueOpen(false);
    setPendingTransfer(null);
    setPreviewImage(null);
    setPortraitOpen(false);
    setFeaturedCaseId((current) => liveEpisodeIds.find((caseId) => caseId !== current) ?? current);
    setScreen("home");
    window.history.pushState({ todayScammerScreen: "home" satisfies Screen }, "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openPendingEpisodeInfo = (episode: (typeof episodes)[number]) => {
    markNewEpisodeSeen(episode.no);
    setInfoEpisode(episode);
  };

  const showEnding = () => {
    setScreen("ending");
    window.history.pushState({ todayScammerScreen: "ending" satisfies Screen }, "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const requestRewardedCase = (caseId: CaseId) => {
    if (!rewardsEnabled) {
      startCase(caseId);
      return;
    }

    let freeCase = freeCaseRef.current;
    let isUnlocked = rewardedUnlockedRef.current.has(caseId);
    try {
      const storedFreeCase = window.localStorage.getItem(freeCaseStorageKey);
      if (liveEpisodeIds.includes(storedFreeCase as CaseId)) {
        freeCase = storedFreeCase as CaseId;
        freeCaseRef.current = freeCase;
      }
      if (window.localStorage.getItem(unlockedCaseStorageKey(caseId)) === "1") {
        isUnlocked = true;
        rewardedUnlockedRef.current.add(caseId);
      }
    } catch {
      // 메모리 상태로 계속 진행합니다.
    }

    if (!freeCase) {
      freeCaseRef.current = caseId;
      try {
        window.localStorage.setItem(freeCaseStorageKey, caseId);
      } catch {
        // 저장소를 사용할 수 없어도 첫 사건은 무료로 시작합니다.
      }
      startCase(caseId);
      return;
    }

    if (freeCase === caseId || isUnlocked) {
      startCase(caseId);
      return;
    }
    setRewardCaseId(caseId);
  };

  const openRewardedCase = async () => {
    if (!rewardCaseId || rewardPending) return;

    if (!onRequestRewardedUnlock) {
      window.location.assign(`/unlock/${rewardCaseId}`);
      return;
    }

    if (rewardedAdStatus === "loading" || rewardedAdStatus === "showing") {
      setToast("광고를 준비하고 있습니다. 잠시 후 다시 눌러주세요.");
      return;
    }
    if (rewardedAdStatus === "unavailable") {
      setToast("현재 토스 앱에서는 광고를 사용할 수 없습니다. 앱을 업데이트한 뒤 다시 시도해주세요.");
      return;
    }

    const targetCaseId = rewardCaseId;
    setRewardPending(true);
    const result = await onRequestRewardedUnlock(targetCaseId);
    setRewardPending(false);

    if (result === "earned") {
      rewardedUnlockedRef.current.add(targetCaseId);
      try {
        window.localStorage.setItem(unlockedCaseStorageKey(targetCaseId), "1");
      } catch {
        // 현재 세션에서는 메모리 상태로 해금을 유지합니다.
      }
      setRewardCaseId(null);
      setToast("사건파일 1개를 열었습니다.");
      startCase(targetCaseId);
      return;
    }

    if (result === "dismissed") setToast("광고를 끝까지 보면 사건파일이 열립니다.");
    else if (result === "not-ready") setToast("광고를 준비하고 있습니다. 잠시 후 다시 눌러주세요.");
    else setToast("광고를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
  };

  const adFreePurchaseSheet = adFreeSheetOpen ? (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAdFreeSheetOpen(false); }}>
      <section className="ad-free-purchase-sheet" role="dialog" aria-modal="true" aria-labelledby="ad-free-purchase-title">
        <div className="ad-free-early-ribbon">얼리버드 할인</div>
        <div className="ad-free-purchase-hero">
          <div>
            <span>AD-FREE PASS</span>
            <h2 id="ad-free-purchase-title">평생 광고 없이<br />모든 사건 보기</h2>
          </div>
          <div className="ad-free-pass-badge">
            <img src="/ad-free-badge.webp" alt="광고 제거 패스 뱃지" width="512" height="512" decoding="async" />
          </div>
        </div>
        <p>한 번만 구매하면 현재 공개된 사건은 물론, 앞으로 추가되는 새로운 사기 유형까지 평생 광고 없이 플레이할 수 있습니다.</p>
        <ul>
          <li>메인·결과 배너 광고 제거</li>
          <li>다음 사건 보상형 광고 없이 열기</li>
          <li>앞으로 공개되는 신규 사건에도 평생 적용</li>
        </ul>
        <button className="ad-free-purchase-confirm" onClick={() => void purchaseAdFree()} disabled={adFreePurchasePending}>{adFreePurchasePending ? "결제 확인 중..." : `${adFreePriceLabel} · 광고 영구 제거`}</button>
        <button className="ad-free-purchase-close" onClick={() => setAdFreeSheetOpen(false)}>나중에</button>
        <small>1회 영구 구매 · 월 구독 아님 · 구매한 계정에서 복원 가능</small>
      </section>
    </div>
  ) : null;

  if (screen === "briefing") {
    return (
      <main className={`briefing-screen case-${activeCase.no}`}>
        <img className="briefing-portrait" src={activeCase.portrait} alt={activeCaseId === "ep16" ? `${activeCase.scammer} 가상 거래 일러스트` : `${activeCase.scammer} 가상 캐릭터`} width="1024" height="1536" decoding="async" fetchPriority="high" />
        <div className="briefing-shade" aria-hidden="true" />
        <header className="briefing-nav">
          <button className="plain-back" onClick={goHome} aria-label="에피소드 목록으로">← 돌아가기</button>
          <span><i /> 접속 중</span>
        </header>
        <section className="briefing-card">
          <div className="briefing-topline"><span>CASE {activeCase.no}</span><span>{activeCase.duration}</span></div>
          <p className="briefing-label">오늘의 상대</p>
          <h1>{activeCase.scammer}</h1>
          <p className="suspect-alias">{activeCase.alias}</p>
          <p className="briefing-title">{activeCase.title}</p>
          <div className="case-tags"><span>{activeCase.type}</span><span>{activeCaseId === "ep02" || activeCaseId === "ep04" || activeCaseId === "ep07" ? "난이도 ★★★★☆" : activeCaseId === "ep03" ? "난이도 ★★★☆☆" : "난이도 보통"}</span><span>엔딩 4개</span></div>
          <div className="mission-note"><span>MISSION</span><p>{activeCaseId === "ep16" ? "50만원에 게임기를 팔려고 합니다. 입금 확인부터 물건 전달까지, 누구와 어떤 거래를 하는지 확인하세요." : activeCaseId === "ep19" ? "매진 공연의 정가 양도표를 찾았습니다. 예매 인증부터 표를 받는 조건까지, 이 거래를 계속해도 될지 판단하세요." : activeCaseId === "ep01" ? "이 사람의 말이 어디서부터 이상한지 찾아내고, 가상 송금 전에 대화방을 빠져나오세요." : activeCaseId === "ep02" ? "평범한 소개팅 대화 속에서 8일 전의 말과 오늘의 말이 어긋나는 순간을 기억하세요." : activeCaseId === "ep03" ? "겁을 주는 말 사이에서 확인을 막는 순간을 찾아내고, 안전계좌로 가상 송금하기 전에 대화를 끊으세요." : activeCaseId === "ep04" ? "화면의 숫자가 오르는 동안 확인해야 하는 건 출금입니다. 손실을 눌림목이라고 바꿔 부르는 순간을 기억하세요." : activeCaseId === "ep07" ? "특별한 팬이라는 말이 VIP 인증금으로 바뀌는 순간을 찾아내고, 공식 소속사 채널로 직접 확인하세요." : "느끼한 미소가 통관비 요구로 변하는 순간을 찾아내고, 가상 송금 전에 사건을 끝내세요."}</p></div>
          <button className="primary-game-button" onClick={enterChat}><span>메시지 열기</span><b>→</b></button>
          <p className="no-money-note">게임 속 가상금액만 사용합니다 · 실제 금전 거래 없음</p>
          <p className="fictional-note">등장인물과 대화는 게임을 위해 만든 가상 설정입니다.</p>
        </section>
      </main>
    );
  }

  if (screen === "chat") {
    const choices = getScene(activeCaseId, sceneId).choices ?? [];
    const qaScene = getScene(activeCaseId, sceneId);
    const qaSceneIds = Object.keys(sceneCollections[activeCaseId]);
    return (
      <main className={`chat-shell case-${activeCase.no}${qaMode ? " qa-enabled" : ""}`}>
        <header className="chat-header">
          <button className="chat-back" onClick={goHome} aria-label="사건 목록으로 돌아가기">‹</button>
          <button className="avatar-button tiny-avatar" onClick={() => setPortraitOpen(true)} aria-label={`${activeCase.scammer} 프로필 사진 크게 보기`}><img src={activeCase.portrait} alt="" /><span className="online-dot" /></button>
          <div className="chat-person"><strong>{activeCase.scammer}</strong><span>{typing ? "입력 중…" : activeCaseId === "ep16" ? "온라인 · 게임기 구매 문의 중" : activeCaseId === "ep19" ? "온라인 · 정가 양도 문의 중" : activeCaseId === "ep02" ? "온라인 · 대화 중" : activeCaseId === "ep03" ? "온라인 · 기관 관계자라고 주장 중" : activeCaseId === "ep04" ? "온라인 · 투자 자격 없음" : activeCaseId === "ep07" ? "온라인 · 비밀계정이라고 주장 중" : "온라인 · 번역기로 대화 중인 것 같음"}</span></div>
          {qaMode && <button className="qa-toggle" onClick={() => setQaPanelOpen((open) => !open)} aria-expanded={qaPanelOpen}>QA</button>}
        </header>

        {qaMode && qaPanelOpen && (
          <aside className="qa-panel" aria-label="대화 점검 모드">
            <div className="qa-panel-head"><div><span>CREATOR QA · BUILD {BUILD_TAG}</span><strong>대화 점검 모드</strong></div><button onClick={() => setQaPanelOpen(false)} aria-label="점검 패널 닫기">×</button></div>
            <div className="qa-controls">
              <label>사건<select value={activeCaseId} onChange={(event) => { const caseId = event.target.value as CaseId; qaJumpToScene(caseId, caseProfiles[caseId].start); }}><option value="ep01">EP.01 모스크바</option><option value="ep02">EP.02 J</option><option value="ep03">EP.03 검사 K</option><option value="ep04">EP.04 불기둥</option><option value="ep06">EP.06 제임스</option><option value="ep07">EP.07 나유명</option><option value="ep16">EP.16 쿨거래만합니다</option><option value="ep19">EP.19 앵콜한번더</option></select></label>
              <label>장면<select value={sceneId} onChange={(event) => qaJumpToScene(activeCaseId, event.target.value as SceneId)}>{qaSceneIds.map((id) => <option value={id} key={id}>{id}</option>)}</select></label>
              <button className={qaFast ? "active" : ""} onClick={toggleQaSpeed}>빠른 재생 {qaFast ? "ON" : "OFF"}</button>
            </div>
            <div className="qa-status"><span>현재 <b>{sceneId}</b></span><span>상태 <b>{phase}</b></span><span>단서 <b>{qaScene.clues?.join(", ") || "없음"}</b></span><span>알림 <b>{qaScene.cluePrompt ? "결정적" : "일반"}</b></span></div>
            <ol className="qa-lines">
              {qaScene.incoming.map((incoming, index) => { const detail = typeof incoming === "string" ? null : incoming; const line = typeof incoming === "string" ? incoming : incoming.text ?? (incoming.tradeRecord ? `[거래 기록] ${incoming.tradeRecord.title}` : incoming.ticketProof ? `[예매 캡처] ${incoming.ticketProof.event} · ${incoming.ticketProof.seat} · ${incoming.ticketProof.price}` : incoming.image ? "[이미지]" : "[입력 중 취소]"); return <li key={`${index}-${line}`}><span>{detail?.from === "system" ? "SYSTEM" : detail?.callCard ? "CALL" : detail?.image || detail?.ticketProof ? "IMAGE" : "CHAT"}</span>{line}</li>; })}
            </ol>
            <div className="qa-routes">
              {(qaScene.choices ?? []).map((choice, index) => <button key={choice.text} onClick={() => { if (choice.next) qaJumpToScene(activeCaseId, choice.next); else if (phase === "choice") { setQaPanelOpen(false); selectReply(choice); } else setToast("엔딩 선택은 메시지 재생이 끝난 뒤 눌러주세요."); }}><span>{String.fromCharCode(65 + index)}</span><p>{choice.text}<small>{choice.replies?.length ? `즉답 ${choice.replies.length}개 · ` : ""}{choice.virtualTransfer ? "가상 송금 · " : ""}{choice.next ? `→ ${choice.next}` : `→ END ${choice.ending}`}</small></p></button>)}
              {qaScene.autoNext && <button onClick={() => qaJumpToScene(activeCaseId, qaScene.autoNext!)}><span>↳</span><p>자동 이동<small>→ {qaScene.autoNext}</small></p></button>}
            </div>
          </aside>
        )}

        {clueHintVisible && <div className="clue-tutorial" role="status"><span>👃</span><p><b>방금 좀 이상하지 않았나요?</b><br />수상한 말을 발견하면 사기 냄새를 눌러보세요.</p></div>}
        {foundClues.length > 0 && <div className={`case-meter${highlightedUnfoundClues.length ? " clue-ready" : ""}`} aria-label={`잡은 증거 ${foundClues.length}개, 전체 ${activeCase.clueTotal}개`}><span>잡은 증거<small>{highlightedUnfoundClues.length ? "결정적 단서 있음" : "대화에서 더 찾기"}</small></span><div><i style={{ width: `${Math.min(100, foundClues.length / activeCase.clueTotal * 100)}%` }} /></div><b key={foundClues.length}>{foundClues.length} / {activeCase.clueTotal}</b></div>}

        <section className="message-feed" ref={feedRef} aria-live="polite">
          <div className="chat-date"><span>오늘</span></div>
          <p className="secure-note"><strong>게임 시뮬레이션 · 실제 금전 거래 없음</strong><br />{activeCaseId === "ep16" ? "이번에는 내가 판매자입니다. 실제 입금·물품 전달은 없습니다." : activeCaseId === "ep19" ? "등장하는 공연·예매 내역은 모두 게임용입니다." : activeCaseId === "ep01" ? "이 대화는 우주 보안 규정에 의해 전혀 보호되지 않습니다." : activeCaseId === "ep02" ? "처음엔 정말 평범한 대화처럼 보일 수 있습니다." : activeCaseId === "ep03" ? "이 대화는 어떤 기관의 공식 절차와도 연결되어 있지 않습니다." : activeCaseId === "ep04" ? "이 대화의 수익률은 화면 안에서만 존재합니다." : activeCaseId === "ep07" ? "방금 찍었다는 셀카와 비밀계정은 본인 인증 수단이 아닙니다." : "이 대화는 작전 보안과 사랑의 힘으로 전혀 인증되지 않았습니다."}</p>
          {messages.map((message) => (
            <div className={`message-row ${message.from}`} key={message.id}>
              {message.from === "scammer" && <button className="avatar-button bubble-avatar" onClick={() => setPortraitOpen(true)} aria-label={`${activeCase.scammer} 프로필 사진 크게 보기`}><img src={activeCase.portrait} alt="" /></button>}
              <div className={`message-bubble${message.image ? " has-image" : ""}${message.callCard ? " has-call" : ""}${message.portfolio ? " has-portfolio" : ""}${message.ticketProof ? " has-ticket" : ""}${message.tradeRecord ? " has-trade-record" : ""}`}>
                {message.image && <MessageImage message={message} onOpen={setPreviewImage} />}
                {message.callCard && <VideoCallCard portrait={activeCase.portrait} name={activeCase.scammer} note={message.text ?? "짧은 영상통화가 연결되었습니다."} />}
                {message.portfolio && <PortfolioCard data={message.portfolio} />}
                {message.ticketProof && <TicketBookingCard proof={message.ticketProof} />}
                {message.tradeRecord && <TradeRecordCard record={message.tradeRecord} />}
                {message.text && !message.callCard && <span className="message-text">{renderMoneyText(message.text)}</span>}
              </div>
            </div>
          ))}
          {typing && (
            <div className="message-row scammer typing-row">
              <button className="avatar-button bubble-avatar" onClick={() => setPortraitOpen(true)} aria-label={`${activeCase.scammer} 프로필 사진 크게 보기`}><img src={activeCase.portrait} alt="" /></button>
              <div className="typing-bubble"><i /><i /><i /></div>
            </div>
          )}
        </section>

        <section className="reply-dock" aria-label="답변 선택">
          {phase !== "resolved" && <button className={`sniff-button sniff-action${highlightedUnfoundClues.length ? " clue-ready" : ""}`} onClick={() => setClueOpen(true)} aria-label={`사기 냄새 맡아보기${highlightedUnfoundClues.length ? " · 결정적 단서가 나온 것 같음" : ""}`}><span className="siren-icon">{highlightedUnfoundClues.length ? "🚨" : "👃"}</span><b>{highlightedUnfoundClues.length ? "지금, 사기 냄새 맡아보기" : "사기 냄새 맡아보기"}</b>{foundClues.length > 0 && <em>증거 {foundClues.length}/{activeCase.clueTotal}</em>}</button>}
          <div className="reply-label"><span>{phase === "choice" ? "뭐라고 답할까요?" : phase === "resolved" ? "사건이 종료되었습니다" : typing ? "상대가 입력 중입니다" : "마지막 톡을 읽을 시간을 두는 중입니다"}</span><b>CASE {activeCase.no} · TURN {String(turn + 1).padStart(2, "0")}</b></div>
          {phase === "choice" ? (
            <div className="choice-list">
              {choices.map((choice, index) => (
                <button className={choice.virtualTransfer ? "virtual-transfer-choice" : ""} key={choice.text} onClick={() => selectReply(choice)}><span>{String.fromCharCode(65 + index)}</span><span className="choice-text">{renderMoneyText(choice.text)}</span></button>
              ))}
            </div>
          ) : phase === "resolved" ? (
            <div className="resolution-dock">
              <div className="result-scan" aria-hidden="true"><i /><i /><i /></div>
              <div><span>분석 완료</span><strong>결과 신호를 해독했습니다.</strong></div>
              <button onClick={showEnding}>내 사기 생존력 확인하기 <b>→</b></button>
            </div>
          ) : (
            <div className="waiting-bar"><i /><span>잠시만요. 그럴듯한 말을 조립하고 있습니다.</span></div>
          )}
        </section>

        {clueOpen && (
          <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setClueOpen(false); }}>
            <section className="clue-sheet" role="dialog" aria-modal="true" aria-labelledby="clue-title">
              <div className="sheet-grip" />
              <div className="clue-heading"><div><span>현장 채증</span><h2 id="clue-title">방금 뭐가 이상했지?</h2></div><button onClick={() => setClueOpen(false)} aria-label="닫기">×</button></div>
              <p>{activeCaseId === "ep16" && availableClues.length === 0 ? "아직 뚜렷한 사기 신호는 없습니다. 네고 없이 산다는 말만으로는 판단할 수 없어요. 거래 조건을 확인해보세요." : activeCaseId === "ep19" && availableClues.length === 0 ? "아직 뚜렷한 사기 신호는 없습니다. 팬 프로필이나 정가 판매만으로는 판단할 수 없어요. 표와 거래 조건을 확인해보세요." : availableClues.length === 0 && (activeCaseId === "ep02" || activeCaseId === "ep03" || activeCaseId === "ep04") ? (activeCaseId === "ep04" ? "아직 결정적인 사기 신호는 없습니다. 자신감만으로는 사기가 아닙니다." : activeCaseId === "ep03" ? "아직 결정적인 사기 신호는 없습니다. 기관을 사칭한 연락도 처음에는 평범해 보일 수 있습니다." : "아직 뚜렷한 사기 신호는 없습니다. 사람과 대화하는 것 자체는 범죄가 아닙니다.") : "수상한 장면 하나를 고르세요. 헛다리는 오판 +1, 최종 점수 -3점입니다."}</p>
              <div className="clue-grid">
                {visibleClueOptions.map((clue) => {
                  const found = foundClues.includes(clue.id);
                  const wrong = wrongClueIds.includes(clue.id);
                  return <button className={found ? "found" : wrong ? "wrong" : ""} key={clue.id} disabled={found || wrong} onClick={() => sniffClue(clue.id)}><span>{found ? "✓" : wrong ? "×" : "?"}</span>{found ? `${clue.label} · 확보` : wrong ? `${clue.label} · 오판` : clue.label}</button>;
                })}
              </div>
            </section>
          </div>
        )}
        {pendingTransfer && (
          <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingTransfer(null); }}>
            <section className="simulation-sheet" role="dialog" aria-modal="true" aria-labelledby="simulation-title">
              <div className="simulation-pulse" aria-hidden="true"><i /><i /><strong>₩</strong></div>
              <span>SIMULATION CHECK</span>
              <h2 id="simulation-title">게임 속 시뮬레이션입니다.</h2>
              <p>실제 돈은 사용되지 않습니다. 이 선택은 이야기의 결과에만 영향을 줍니다.</p>
              <div className="virtual-receipt"><span>가상 송금액</span><strong>{pendingTransfer.virtualAmount ?? activeCase.virtualAmount}</strong><small>실제 결제 0원</small></div>
              <button className="confirm-simulation" onClick={confirmVirtualTransfer}>가상 송금 선택 계속하기</button>
              <button className="cancel-simulation" onClick={() => setPendingTransfer(null)}>대화로 돌아가기</button>
            </section>
          </div>
        )}
        {previewImage && (
          <div className="modal-backdrop image-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewImage(null); }}>
            <section className="evidence-preview" role="dialog" aria-modal="true" aria-labelledby="evidence-preview-title">
              <div className="evidence-preview-head"><div><span>{previewImage.src.includes("dubu") || previewImage.src.includes("celebrity-selfie") ? "전송된 사진 · 게임 일러스트" : "전송된 파일 · 가상 서류"}</span><h2 id="evidence-preview-title">{previewImage.src.includes("dubu") ? "두부 사진" : previewImage.src.includes("celebrity-selfie") ? "방금 찍었다는 셀카" : "자격증 이미지(?)"}</h2></div><button onClick={() => setPreviewImage(null)} aria-label="이미지 닫기">×</button></div>
              <img src={previewImage.src} alt={previewImage.alt} width={previewImage.src.includes("celebrity-selfie") ? 1024 : 1120} height={previewImage.src.includes("celebrity-selfie") ? 1536 : 896} decoding="async" />
              {previewImage.src.includes("dubu") ? <p><strong>게임용 가상 캐릭터 이미지</strong><br />두부는 무죄입니다. 귀여운 사진 자체는 사기 증거가 아닙니다.</p> : previewImage.src.includes("celebrity-selfie") ? <p><strong>방금 찍었다는 말만으로 본인 사진은 아닙니다.</strong><br />자연스러운 셀카도 다른 사람의 계정에서 가져왔을 수 있습니다.</p> : <p><strong>게임 속 가상 서류 · 실제 자격증 아님</strong><br />수정 스티커, 철자, 날짜, 직인을 자세히 보세요. 이미지가 공식 확인을 대신할 수는 없습니다.</p>}
            </section>
          </div>
        )}
        {portraitOpen && (
          <div className="modal-backdrop avatar-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPortraitOpen(false); }}>
            <section className={`avatar-preview case-${activeCase.no}`} role="dialog" aria-modal="true" aria-labelledby="avatar-preview-title">
              <div><span>{activeCaseId === "ep16" ? "계정 프로필 · 게임용 일러스트" : "프로필 사진 · 가상 캐릭터"}</span><h2 id="avatar-preview-title">{activeCase.scammer}</h2></div>
              <button onClick={() => setPortraitOpen(false)} aria-label="프로필 사진 닫기">×</button>
              <img src={activeCase.portrait} alt={`${activeCase.scammer} 프로필 일러스트`} width="1024" height="1536" decoding="async" />
            </section>
          </div>
        )}
        {toast && <div className="game-toast" role="status">{toast}</div>}
      </main>
    );
  }

  if (screen === "ending") {
    const copy = activeEndingCopy[ending];
    const hasIncomingDeposit = messages.some((message) => message.tradeRecord?.kind === "deposit");
    const damageResult = activeCaseId === "ep16"
      ? itemHandedOver ? "게임 속 물품 전달됨 · 거래 미해결" : hasIncomingDeposit ? "물품 전달 보류 · 입금 50만원 확인 필요" : "물품 전달 없음 · 거래 중단"
      : virtualMoneyLost > 0 ? `게임 속 가상피해 ${virtualMoneyLost.toLocaleString("ko-KR")}원` : "게임 속 가상피해 0원";
    const allCluesFound = suspicion === activeCase.clueTotal && wrongClues === 0;
    const endingBody = activeCaseId === "ep16" ? `${copy.body}${!itemHandedOver && hasIncomingDeposit ? " 이미 들어온 돈은 임의로 쓰거나 다른 계좌로 보내지 말고 은행·거래앱의 공식 창구에서 확인하세요." : ""}` : ending === "C"
      ? virtualMoneyLost > 0 ? "이미 보낸 가상금액은 있지만 추가 요구에는 응하지 않고 대화를 끝냈습니다."
        : sharedInformation ? "가상정보를 입력한 뒤 멈췄습니다. 실제 상황이라면 노출된 정보에 맞는 보호 조치도 필요합니다."
          : "가상 송금이나 정보 입력 전에 대화를 끝냈습니다."
      : copy.body.replace(/^게임 속 가상금액 (?:총 )?[\d,]+만원을 (?:지켜냈습니다|보냈습니다|보내버렸습니다)\.\s*/, "");
    const endingKicker = activeCaseId === "ep16" ? copy.kicker : ending === "F" ? "가상 송금 완료" : virtualMoneyLost > 0 ? "추가 요구 중단" : sharedInformation ? "가상정보 입력 뒤 중단" : "가상 피해 없이 대화 종료";
    const connectedCases = liveEpisodeIds.filter((caseId) => caseId !== activeCaseId);
    return (
      <main className={`ending-screen grade-${ending.toLowerCase()}`}>
        <div className="ending-noise" />
        {stats.total >= 90 && <div className="result-confetti" aria-hidden="true">{Array.from({ length: 14 }, (_, index) => <i key={index} />)}</div>}
        <div className="ending-content">
        <section className="result-card">
          <nav className="result-nav" aria-label="결과 화면 이동"><button onClick={goHome}>← 사건 목록</button></nav>
          {stats.total >= 90 && <div className="respect-effect"><span>🎉 S급 사기 생존자</span><strong>{activeCaseId === "ep16" ? "게임기는 아직 당신 손에 있습니다." : "오늘은 당신 지갑이 매우 평화롭습니다."}</strong><i aria-hidden="true" /></div>}
          {allCluesFound && <div className="scent-master-badge"><span>👃</span><div><small>SPECIAL BADGE</small><strong>후각 만렙 · 증거 전체 수집</strong></div></div>}
          <div className="result-stamp"><small>CASE CLOSED</small><strong>{ending}</strong><span>RANK</span></div>
          <p className="ending-kicker">{endingKicker}</p>
          <h1>{copy.title}</h1>
          <div className="survival-score"><span>사기 생존력</span><strong>{stats.total}</strong><em>/100</em></div>
          <div className="result-core-summary"><span>{damageResult}</span><strong>🔍 증거 {suspicion} / {activeCase.clueTotal}</strong><em>오판 {wrongClues}</em></div>
          <button className="share-button primary-share" onClick={shareResult}><span>친구도 살아남는지 보내보기</span><b>↗</b></button>
          <p className="ending-body">{endingBody}</p>
          <details className="result-details"><summary>점수와 수법 자세히 보기</summary>
          <div className="score-breakdown" aria-label="점수 계산 근거">
            <div><span>{activeCaseId === "ep16" ? "물품 방어" : "지갑 방어"}</span><b>{stats.wallet} / 40</b></div>
            <div><span>판단력</span><b>{stats.decisions} / 30</b></div>
            <div><span>본 대화의 증거 포착</span><b>{stats.evidence} / 25</b></div>
            <div><span>안전 중단</span><b>{stats.earlyBonus} / 5</b></div>
            <div className={wrongClues ? "penalty" : ""}><span>오판 {wrongClues}</span><b>{stats.wrongPenalty}점</b></div>
          </div>
          <div className="evidence-summary"><span>{activeCase.clueTotal - suspicion > 0 ? `놓친 수법 ${activeCase.clueTotal - suspicion}개 · 다른 선택에서 발견 가능` : "모든 사기 냄새를 찾았습니다"}</span><strong>{suspicion} / {activeCase.clueTotal}</strong></div>

          <section className="share-card" aria-label="공유할 결과">
            <span>오늘의 생존 보고서</span>
            <strong>사기 생존력 {stats.total}점</strong>
            <p>🔍 증거 {suspicion} / {activeCase.clueTotal} · 오판 {wrongClues}<br />{copy.shareLine}</p>
            <small>게임 시뮬레이션 · 실제 금전 거래 없음</small>
          </section>

          <section className="tactic-recap" aria-labelledby="tactic-title">
            <span>방금 당할 뻔한 수법</span>
            <h2 id="tactic-title">{activeCase.tactic}</h2>
          </section>
          </details>

          <section className="next-case-panel" aria-labelledby="next-case-title">
            <div className="next-case-signal"><span>연결된 사건</span><b>한 번 열면 계속 플레이</b></div>
            <h2 id="next-case-title" className="next-case-heading">다음으로 상대할 사기꾼</h2>
            <div className="connected-case-list">
              {connectedCases.map((caseId) => {
                const profile = caseProfiles[caseId];
                const episode = episodes.find((item) => item.no === profile.no)!;
                return (
                  <button className={`connected-case-card case-${profile.no}`} key={caseId} onClick={() => requestRewardedCase(caseId)} aria-label={`${profile.title} 사건파일 열기`}>
                    <img src={profile.portrait} alt="" loading="lazy" decoding="async" />
                    <span><small>CASE {profile.no} · {profile.type}</small><strong>{profile.title}</strong><em>{episode.scammer}</em></span>
                    <b aria-hidden="true">→</b>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="result-actions"><button className="secondary-game-button" onClick={enterChat}>다시 상대하기</button><button className="secondary-game-button" onClick={goHome}>다른 사기꾼 보기</button></div>
          <p className="victim-note">※ 피해를 입는 건 누구의 잘못도 아닙니다. 이상한 건 사기꾼입니다.</p>
        </section>
        {effectiveResultAd}
        </div>
        {rewardCaseId && (
          <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRewardCaseId(null); }}>
            <section className="reward-unlock-sheet" role="dialog" aria-modal="true" aria-labelledby="reward-unlock-title">
              <span>NEW CASE INCOMING</span>
              <div className="reward-case-number">CASE {caseProfiles[rewardCaseId].no}</div>
              <h2 id="reward-unlock-title">짧은 광고 1개 보고<br />사건파일 열기</h2>
              <p>광고를 끝까지 보면 <strong>{caseProfiles[rewardCaseId].title}</strong> 사건을 바로 열 수 있습니다.</p>
              <button className="reward-accept" onClick={() => void openRewardedCase()} disabled={rewardPending || rewardedAdStatus === "showing"}>
                {rewardPending || rewardedAdStatus === "showing" ? "광고 확인 중..." : rewardedAdStatus === "loading" ? "광고 준비 중..." : "광고 보고 사건파일 열기"} <b>→</b>
              </button>
              {effectiveShowAdFreeOffer && !effectiveAdFreePurchased && (
                <button className="reward-ad-free" onClick={openAdFreeSheet} disabled={adFreePurchasePending}>
                  <span>모든 광고 영구 제거</span><strong>{adFreePurchasePending ? "결제 확인 중" : adFreePriceLabel}</strong>
                </button>
              )}
              <button className="reward-decline" onClick={() => setRewardCaseId(null)}>나중에 보기</button>
              <small>{effectiveShowAdFreeOffer ? "광고 제거 구매 시 앞으로 공개되는 신규 사건도 광고 없이 플레이합니다." : "끝까지 시청한 경우에만 열립니다 · 한 번 연 사건은 계속 플레이할 수 있습니다."}</small>
            </section>
          </div>
        )}
        {adFreePurchaseSheet}
        {toast && <div className="game-toast" role="status">{toast}</div>}
      </main>
    );
  }

  return (
    <main className="home-screen">
      <div className="home-glow" aria-hidden="true" />
      {qaMode && <section className="qa-home-bar" aria-label="QA 사건 바로 열기"><div><span>CREATOR QA · BUILD {BUILD_TAG}</span><strong>검수할 사건을 바로 여세요</strong></div>{liveEpisodeIds.map((caseId) => <button key={caseId} onClick={() => qaJumpToScene(caseId, caseProfiles[caseId].start)}>CASE {caseProfiles[caseId].no}</button>)}</section>}
      <header className="game-brand">
        <div className="eyebrow">
          <span>SCAMMER ARCHIVE</span>
        </div>
        <h1><img className="brand-logo" src="/logo-oneul.webp" alt="오늘의 사기꾼" width="800" height="375" decoding="async" fetchPriority="high" /></h1>
        <p className="brand-intro">계속 바뀌는 사기 수법을 짧은 상황극으로 미리 겪어보세요.<br />직접 답하고 의심하며, 속아 넘어가기 전에 탈출하세요.</p>
        {effectiveShowAdFreeOffer && (
          <div className="ad-free-home-row">
            <button className={`ad-free-top ${effectiveAdFreePurchased ? "is-owned" : ""}`} onClick={openAdFreeSheet} disabled={effectiveAdFreePurchased || adFreePurchasePending}>
              <strong>{effectiveAdFreePurchased ? "광고 제거됨" : adFreePurchasePending ? "확인 중" : "광고 제거"}</strong>
            </button>
          </div>
        )}
      </header>

      <section className="roster" aria-labelledby="roster-heading">
        <div className="roster-heading"><div><span>지금 접속 중</span><h2 id="roster-heading">현재 접속한 상대</h2></div><p><i /> {liveEpisodeIds.length}명</p></div>
        <div
          className={`featured-case case-${featuredCase.no}`}
          style={{ "--accent": featuredEpisode.accent } as React.CSSProperties}
          role="button"
          tabIndex={0}
          aria-label={`케이스 ${featuredCase.no} ${featuredEpisode.name} 상대하기`}
          onClick={() => requestRewardedCase(featuredCaseId)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            requestRewardedCase(featuredCaseId);
          }}
        >
          <img className="featured-portrait" src={featuredCase.portrait} alt={featuredCaseId === "ep16" ? `${featuredCase.scammer} 가상 거래 일러스트` : `${featuredCase.scammer} 가상 캐릭터`} width="1024" height="1536" decoding="async" fetchPriority="high" />
          <div className="featured-shade" aria-hidden="true" />
          <div className="featured-status"><span><i /> LIVE {hasUnseenNewBadge(featuredCase.no) && <em className="episode-new">NEW</em>}</span><b>CASE {featuredCase.no}</b></div>
          <div className="featured-copy"><span className="type-chip">{featuredCase.type}</span><h3>{featuredEpisode.name}</h3><p>“{featuredEpisode.line}.”</p><div className="suspect-name"><span>상대</span><strong>{featuredCase.scammer}</strong><em>{featuredCase.alias.split(" · ")[0]}</em></div></div>
          <button onClick={(event) => { event.stopPropagation(); requestRewardedCase(featuredCaseId); }} aria-label={`케이스 ${featuredCase.no} 플레이`}><span>상대하기</span><b>→</b></button>
        </div>

        <div className="next-up"><div><span>지금 플레이 가능</span><h2>다른 사건파일</h2></div><b>{orderedEpisodes.filter((episode) => episode.live).length} CASES</b></div>
        {[true, false].map((isLive) => {
          const cards = <div className="episode-grid">
          {orderedEpisodes.filter((episode) => Boolean(episode.live) === isLive).map((episode) => {
            const playable = Boolean(episode.live);
            const hasPortrait = playable || episode.no === "04";
            const episodeCaseId = caseIdFromEpisodeNo(episode.no);
            return (
            <button className={`episode-card case-${episode.no} ${playable ? "live" : ""}`} key={episode.no} style={{ "--accent": episode.accent } as React.CSSProperties} onClick={() => playable ? requestRewardedCase(episodeCaseId) : openPendingEpisodeInfo(episode)}>
              <div className={`episode-visual ${hasPortrait ? "has-portrait" : ""}`}>{hasPortrait && <img src={caseProfiles[episodeCaseId].portrait} alt="" loading="lazy" decoding="async" />}{hasUnseenNewBadge(episode.no) && <i className="episode-new" aria-label={playable ? "내용 업데이트" : "새로 준비 중"}>NEW</i>}<span>{hasPortrait ? "" : episode.mark}</span><b>{episode.no}</b></div>
              <div className="episode-meta"><span>{episode.type}</span><em>{playable ? "상대하기" : "에피소드 준비 중"}</em></div>
              <h3>{episode.name}</h3>
              <p>{episode.line}</p>
              <small>{episode.scammer}</small>
            </button>
          )})}
        </div>;
          return isLive ? <div key="live">{cards}</div> : <details className="upcoming-episodes" key="upcoming" open><summary>준비 중인 사건 <span>{episodes.filter((episode) => !episode.live).length}개{upcomingNewCount > 0 ? ` · NEW ${upcomingNewCount}` : ""}</span></summary><p>새 사건을 준비하고 있어요. 아래 카드는 아직 플레이할 수 없습니다.</p>{cards}</details>;
        })}
      </section>

      {effectiveHomeAd}

      <footer className="home-footer">
        <strong>의심은 빠르게, 가상 송금도 신중하게.</strong>
        <p>게임 시뮬레이션 · 실제 금전 거래 없음<br />웃기는 건 사기꾼이지, 피해자가 아닙니다.</p>
        <nav aria-label="서비스 정보">
          {legalVariant === "toss" ? (
            <><button onClick={() => setFooterInfoPage("about")}>게임 소개</button><button onClick={() => setFooterInfoPage("privacy")}>개인정보처리방침</button><button onClick={() => setFooterInfoPage("terms")}>이용안내</button></>
          ) : (
            <><a href="/about">게임 소개</a><a href="/guide">플레이 방법</a><a href="/cases">사건 해설</a><a href="/faq">FAQ</a><a href="/terms">이용약관</a><a href="/privacy">개인정보</a></>
          )}
          <a href="mailto:takea@naver.com?subject=%EC%98%A4%EB%8A%98%EC%9D%98%20%EC%82%AC%EA%B8%B0%EA%BE%BC%20%EB%AC%B8%EC%9D%98%C2%B7%EC%A0%9C%EB%B3%B4">문의·제보</a>
        </nav>
      </footer>

      {footerInfoPage && (
        <div className="footer-info-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFooterInfoPage(null); }}>
          <section className="footer-info-sheet" role="dialog" aria-modal="true" aria-labelledby="footer-info-title">
            <header><button onClick={() => setFooterInfoPage(null)} aria-label="안내 닫기">←</button><span>오늘의 사기꾼</span></header>
            {footerInfoPage === "about" && <div><h2 id="footer-info-title">게임 소개</h2><p>오늘의 사기꾼은 실제 사기 수법을 짧은 대화형 사건으로 미리 경험하는 예방 시뮬레이션입니다.</p><h3>플레이 방법</h3><p>답변을 고르고 이상한 단서를 찾아 결말까지 탈출하세요. 등장인물과 사건은 게임을 위해 만든 가상 설정이며, 표시되는 금액도 모두 게임 속 가상금액입니다.</p></div>}
            {footerInfoPage === "privacy" && <div><h2 id="footer-info-title">개인정보처리방침</h2><h3>1. 게임 이용 정보</h3><p>회원가입을 요구하지 않으며, 진행 상황과 열린 사건 및 광고 제거 상태는 기기에 저장될 수 있습니다.</p><h3>2. 토스 광고</h3><p>앱인토스의 Toss Ads를 통해 광고가 제공됩니다. 광고 제공 과정에서 기기·광고 상호작용 정보가 토스 및 광고 제공사의 정책에 따라 처리될 수 있습니다.</p><h3>3. 앱인토스 인앱 결제</h3><p>광고 제거 상품의 결제와 복원은 앱인토스 결제 시스템에서 처리됩니다. 게임은 상품 식별자와 구매·환불 상태를 확인하며 카드번호 등 결제수단 정보를 직접 수집하거나 저장하지 않습니다.</p><h3>4. 문의</h3><p>문의·제보 이메일에 사용자가 직접 작성한 내용은 답변을 위해 이용됩니다. 문의: takea@naver.com</p></div>}
            {footerInfoPage === "terms" && <div><h2 id="footer-info-title">이용안내</h2><h3>1. 가상금액과 사건</h3><p>게임에 표시되는 송금과 결제는 모두 가상이며 실제 금전 거래가 발생하지 않습니다. 등장인물과 사건은 실제 인물·기관과 관련 없는 가상 설정입니다.</p><h3>2. 광고와 사건 열기</h3><p>일부 사건은 Toss Ads의 보상형 광고를 시청한 뒤 열 수 있습니다. 한 번 열린 사건은 기기에 저장됩니다.</p><h3>3. 광고 영구 제거</h3><p>앱인토스 인앱 결제로 구매하는 일회성 상품입니다. 현재 및 향후 공개 사건의 배너·보상형 광고를 제거하며, 구매 복원과 환불은 앱인토스 및 이용 중인 앱 마켓 정책을 따릅니다.</p><h3>4. 안내</h3><p>게임 내용은 사기 예방을 위한 일반 정보이며 법률·금융·수사 자문을 대신하지 않습니다.</p><small>시행일: 2026년 9월 5일</small></div>}
          </section>
        </div>
      )}

      {infoEpisode && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setInfoEpisode(null); }}>
          <section className="soon-sheet" role="dialog" aria-modal="true" style={{ "--accent": infoEpisode.accent } as React.CSSProperties}>
            <button className="soon-close" onClick={() => setInfoEpisode(null)} aria-label="닫기">×</button>
            <span>CASE {infoEpisode.no} · 에피소드 준비 중</span><div className="soon-mark">{infoEpisode.mark}</div><small>{infoEpisode.type}</small><h2>{infoEpisode.name}</h2><p>{infoEpisode.line}</p><div><span>상대</span><strong>{infoEpisode.scammer}</strong></div><button className="notify-fake" onClick={() => setInfoEpisode(null)}>확인</button>
          </section>
        </div>
      )}
      {rewardCaseId && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRewardCaseId(null); }}>
          <section className="reward-unlock-sheet" role="dialog" aria-modal="true" aria-labelledby="home-reward-unlock-title">
            <span>NEW CASE INCOMING</span>
            <div className="reward-case-number">CASE {caseProfiles[rewardCaseId].no}</div>
            <h2 id="home-reward-unlock-title">짧은 광고 1개 보고<br />사건파일 열기</h2>
            <p>광고를 끝까지 보면 <strong>{caseProfiles[rewardCaseId].title}</strong> 사건을 바로 열 수 있습니다.</p>
            <button className="reward-accept" onClick={() => void openRewardedCase()} disabled={rewardPending || rewardedAdStatus === "showing"}>
              {rewardPending || rewardedAdStatus === "showing" ? "광고 확인 중..." : rewardedAdStatus === "loading" ? "광고 준비 중..." : "광고 보고 사건파일 열기"} <b>→</b>
            </button>
            {effectiveShowAdFreeOffer && !effectiveAdFreePurchased && (
              <button className="reward-ad-free" onClick={openAdFreeSheet} disabled={adFreePurchasePending}>
                <span>모든 광고 영구 제거</span><strong>{adFreePurchasePending ? "결제 확인 중" : adFreePriceLabel}</strong>
              </button>
            )}
            <button className="reward-decline" onClick={() => setRewardCaseId(null)}>나중에 보기</button>
            <small>{effectiveShowAdFreeOffer ? "광고 제거 구매 시 앞으로 공개되는 신규 사건도 광고 없이 플레이합니다." : "끝까지 시청한 경우에만 열립니다 · 한 번 연 사건은 계속 플레이할 수 있습니다."}</small>
          </section>
        </div>
      )}
      {adFreePurchaseSheet}
      {toast && <div className="game-toast" role="status">{toast}</div>}
    </main>
  );
}

export default function WebHome() {
  return <TodayScammer homeAd={<AdBanner placement="home" />} resultAd={<AdBanner placement="result" />} />;
}
