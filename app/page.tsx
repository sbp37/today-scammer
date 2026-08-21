"use client";

/* eslint-disable @next/next/no-img-element -- Local artwork is pre-compressed WebP and served directly by the Vinext asset layer. */

import { useEffect, useMemo, useRef, useState } from "react";

type Screen = "home" | "briefing" | "chat" | "ending";
type Phase = "incoming" | "choice" | "reply" | "resolved";
type EndingGrade = "S" | "A" | "C" | "F";
type CaseId = "ep01" | "ep02" | "ep06";
type ElunSceneId = "start" | "whyMe" | "reverseMoney" | "reverseJoke" | "videoCall" | "space" | "aiVideo" | "photo" | "photoJoke" | "sendMoney" | "company" | "fastBond" | "realName" | "nameExcuse" | "investment" | "selfInvest" | "companyInfo" | "fakeLink" | "finalPitch";
type RomanceSceneId = "romanceStart" | "romanceWhy" | "romanceVideo" | "romanceProfile" | "romanceCredential" | "romanceCertificateCheck" | "romanceDay" | "romanceHeart" | "romanceHeartJoke" | "romanceFlirt" | "romancePromise" | "romanceBond" | "romanceParcel" | "romanceBoxDetails" | "romanceProof" | "romanceCourier" | "romanceLink" | "romanceFinal";
type SeoyunSceneId = "seoyunStart" | "seoyunWhy" | "seoyunWork" | "seoyunDog" | "seoyunMontage" | "seoyunMontageLater" | "seoyunDay8" | "seoyunHospital" | "seoyunDelete" | "seoyunConfide" | "seoyunDeposit" | "seoyunFamily" | "seoyunVerify" | "seoyunFirstTransfer" | "seoyunSecondAsk" | "seoyunVideo" | "seoyunSecondTransfer" | "seoyunFinal";
type SceneId = ElunSceneId | RomanceSceneId | SeoyunSceneId;

type Message = {
  id: number;
  from: "scammer" | "player" | "system";
  text?: string;
  image?: string;
  alt?: string;
  imageFallback?: string;
  callCard?: boolean;
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
};

type ChoiceBase = {
  text: string;
  risk?: number;
  virtualTransfer?: boolean;
  virtualAmount?: string;
  virtualLoss?: number;
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
  choices?: Choice[];
  clues?: string[];
  cluePrompt?: boolean;
  autoNext?: SceneId;
  autoDelay?: number;
};

const episodes = [
  { no: "01", mark: "EM", name: "억만장자가 20만원이 없대요", scammer: "일런 모스크바", type: "유명인 사칭", line: "지갑은 분실, 자신감은 보유 중", accent: "#ff4e29", live: true },
  { no: "02", mark: "J", name: "엄마가 갑자기 수술해야 한대요", scammer: "J · 26", type: "소개팅 DM", line: "평범한 DM은 8일 뒤 부탁이 됐다", accent: "#ff7fac", live: true },
  { no: "03", mark: "檢", name: "검사님이 내 통장을 걱정한다", scammer: "중앙수사 김검사", type: "기관 사칭", line: "내 잔고에 누구보다 진심인 공무원", accent: "#00d9ff" },
  { no: "04", mark: "₿", name: "인생역전 코인 선생님", scammer: "차트도사 불기둥", type: "투자사기", line: "손실은 경험, 수익은 곧 예정", accent: "#ffd600" },
  { no: "05", mark: "BOX", name: "택배가 왔는데 내가 시킨 게 없다", scammer: "행복택배 11팀", type: "스미싱", line: "상자는 없고 링크만 도착함", accent: "#bd7cff" },
  { no: "06", mark: "♥", name: "해외 파병 군의관", scammer: "Dr. 제임스 초이", type: "로맨스스캠", line: "사랑은 국경 없고 통관료는 있음", accent: "#ff5c93", live: true },
  { no: "07", mark: "★", name: "유명 연예인의 비밀 계정", scammer: "진짜_공식_비밀", type: "유명인 사칭", line: "비밀인데 팬 전원에게 DM 중", accent: "#52f2b8" },
  { no: "08", mark: "HR", name: "대기업 채용 담당자", scammer: "글로벌인재 3팀", type: "취업사기", line: "입사 전부터 지갑이 출근함", accent: "#ff8a00" },
  { no: "09", mark: "CARD", name: "내가 모르는 카드가 발급됐대요", scammer: "긴급카드센터", type: "카드발급 사칭", line: "내 카드보다 내 정보를 더 잘 앎", accent: "#46a3ff" },
  { no: "10", mark: "LOAN", name: "대출받으려는데 왜 내가 먼저 돈을 내죠?", scammer: "최저금리 박실장", type: "대출빙자", line: "돈을 빌리려면 먼저 돈을 빌려달란다", accent: "#ff6b64" },
  { no: "11", mark: "UP", name: "단톡방 사람들 전부 돈 벌고 있대요", scammer: "VIP 수익방", type: "투자리딩방", line: "대화 인원 84명, 사람은 몇 명?", accent: "#eaff3d" },
  { no: "12", mark: "AI", name: "AI가 알아서 돈을 벌어준대요", scammer: "퀀텀AI 김박사", type: "AI 투자사기", line: "인공지능보다 입금지능을 선호함", accent: "#00e0b8" },
  { no: "13", mark: "100", name: "단체 주문인데 이것 좀 대신 사주세요", scammer: "동네산악회 총무", type: "노쇼 대리구매", line: "등산은 안 오고 영수증만 정상 등반", accent: "#d891ff" },
  { no: "14", mark: "法", name: "법이 바뀌어서 이걸 꼭 사야 한대요", scammer: "안전점검 홍반장", type: "안전점검 사칭", line: "오늘 처음 생긴 법을 오늘부터 단속", accent: "#ffb800" },
  { no: "15", mark: "REV", name: "리뷰 몇 개 쓰면 돈을 준대요", scammer: "재택부업 이팀장", type: "팀미션·부업", line: "별점 다섯 개, 통장 잔액 한 개", accent: "#ff76c8" },
];

const liveEpisodeIds: CaseId[] = ["ep01", "ep06", "ep02"];
const caseIdFromEpisodeNo = (no: string): CaseId => no === "06" ? "ep06" : no === "02" ? "ep02" : "ep01";
const virtualMoneyAtRisk: Record<CaseId, number> = { ep01: 200000, ep02: 1810000, ep06: 480000 };

const caseProfiles = {
  ep01: { no: "01", title: "억만장자가 20만원이 없대요", scammer: "일런 모스크바", alias: "ELUN MOSKVA · World Famous Tech CEO(?)", type: "유명인 사칭", portrait: "/scammer-01.webp", duration: "4분 내외", start: "start" as SceneId, virtualAmount: "20만원", tactic: "유명인 DM → 친밀감 → 링크 → 추가 가상 송금", clueTotal: 7 },
  ep02: { no: "02", title: "엄마가 갑자기 수술해야 한대요", scammer: "J", alias: "J · 26 · 마케팅 회사 · 두부 보호자", type: "로맨스스캠", portrait: "/scammer-02.webp", duration: "4~5분", start: "seoyunStart" as SceneId, virtualAmount: "총 181만원", tactic: "평범한 소개팅 DM → 8일 친밀감 → 가족 위기 → 소액 부탁 → 금액 상승", clueTotal: 7 },
  ep06: { no: "06", title: "해외 파병 군의관", scammer: "Dr. 제임스 초이", alias: "JAMES CHOI · FIELD SURGEON(?)", type: "로맨스스캠", portrait: "/scammer-06.webp", duration: "7분 내외", start: "romanceStart" as SceneId, virtualAmount: "48만원", tactic: "낯선 DM → 관계 만들기 → 가짜 자격증 → 고액 상자 → 통관비 가상 송금", clueTotal: 8 },
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
      { text: "왜 하필 저한테 연락했어요?", next: "whyMe" },
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
      { text: "[게임 내 가상 송금] 20만원 보내기", virtualTransfer: true, ending: "F", replies: ["좋습니다. 우주 보안보다 가상 송금이 빠릅니다. 확인했습니다."] },
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
      { text: "[게임 내 가상 송금] 20만원 보내기", virtualTransfer: true, ending: "F", replies: ["가상 입금 확인. 당신은 인류의 좋은 친구입니다. 저는 대화방 나갑니다."] },
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
      { text: "[게임 내 가상 송금] 20만원 도와드리기", virtualTransfer: true, ending: "F", replies: ["역시 한국의 신뢰 가능한 사람. 가상 입금 확인했습니다."] },
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
      { text: "특별한 사람 이름도 모르는데요.", next: "realName" },
      { text: "친구라면 회사 공식 계정으로 다시 연락해요.", ending: "A", replies: ["공식 친구 절차는 현재 화성에서 심사 중입니다."] },
      { text: "2분 우정은 체험판 같네요. 다음 얘기는요?", next: "investment", risk: 1 },
    ],
  },
  realName: {
    incoming: [
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
      { text: "[게임 내 가상 송금] 20만원 보내기", virtualTransfer: true, ending: "F", replies: ["가상 입금 확인. 출금에는 국제 세금 12만9천원 더 필요.", "저는 지금 매우 잠시 오프라인."] },
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
      { text: "그럼 의사·군의관 자격증 줘봐요.", next: "romanceCredential" },
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
      { text: "사진은 찍었는데 통화만 안 돼요?", next: "romanceProfile" },
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
      { text: "말로 말고 자격증 한번 줘봐요.", next: "romanceCredential" },
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
      { text: "이 정도면 믿을게요.", next: "romanceDay", risk: 1, replies: ["당신의 신뢰, 아주 소중히 보관하겠습니다."] },
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
      { text: "설명은 이상하지만 더 들어볼게요.", next: "romanceDay", risk: 1 },
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
      { text: "치료비 대신 자격증부터요.", next: "romanceCredential" },
      { text: "그럼 조금 더 얘기해봐요.", next: "romanceFlirt" },
      { text: "무료 진료는 여기까지입니다.", ending: "A", replies: ["제 마음은 다시 대기 환자가 되었습니다."] },
    ],
  },
  romanceFlirt: {
    incoming: [
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
      { text: "그 말은 조금 설레긴 하네요.", next: "romanceBond", risk: 1 },
      { text: "돈 필요 없다더니 나중에 필요하겠죠?", next: "romanceBond" },
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
      { text: "제 주소 등록도 취소하고 차단할게요.", ending: "S", replies: ["외교 상자의 외교가 실패했습니다."] },
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
      { text: "그럼 네 의사·군의관 자격증 줘봐요.", next: "romanceCredential" },
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
      { text: "[게임 내 가상 송금] 통관비 48만원 보내기", virtualTransfer: true, ending: "F", replies: ["가상 통관비 확인. 그런데 보험 가상금액 32만원이 추가 필요.", "상자는 한 걸음 가까워졌고, 비용은 두 걸음 늘었습니다."] },
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
      { text: "[게임 내 가상 송금] 48만원 보내기", virtualTransfer: true, ending: "F", replies: ["가상 입금 확인. 상자는 보험 문제로 잠시 매우 영원히 대기합니다."] },
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
      { abortTyping: true, typingMs: 1900, pauseBefore: 650 },
      { text: "아니다. 이건 내가 알아서 해야지.", typingMs: 1500 },
    ],
    choices: [
      { text: "무슨 일인데?", next: "seoyunConfide", replies: ["아니야. 말하면 오빠까지 신경 쓰이잖아."] },
      { text: "그래, 가족 일이니까 잘 해결해.", next: "seoyunConfide", replies: ["응... 그러려고 했는데, 잠깐만 얘기 들어주면 안 돼?"] },
      { text: "필요한 거 있어?", next: "seoyunConfide", risk: 1, replies: ["아니야, 그런 뜻으로 말 꺼낸 거 아니야 ㅠ"] },
    ],
  },
  seoyunConfide: {
    incoming: ["오빠한테 부탁하려던 건 아니야. 그냥 누구한테라도 말하고 싶었어 ㅠ"],
    clues: ["emotionalPressure"],
    choices: [
      { text: "그래도 무슨 일인지는 말해봐.", next: "seoyunDeposit", replies: ["정말 그냥 물어만 보는 거야. 부담 가지면 안 돼."] },
      { text: "도울 수 있는 일이면 말해.", next: "seoyunDeposit", risk: 1, replies: ["그 말 들으니까 더 미안하다... 정말 하루면 돼."] },
      { text: "엄마 일이라면 가족들부터 연락해.", next: "seoyunDeposit", replies: ["그러고 싶은데 연락할 사람이 마땅치 않아..."] },
    ],
  },
  seoyunDeposit: {
    incoming: [
      { text: "근데 진짜 미안한데 하나만 물어봐도 돼?", typingMs: 1700 },
      { abortTyping: true, typingMs: 2300, pauseBefore: 500 },
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
    clues: ["amountEscalation"],
    cluePrompt: true,
    choices: [
      { text: "이번엔 병원 주차비는 아니지?", next: "seoyunSecondAsk", replies: ["농담할 정신은 있네... 진짜 중요한 일이야."] },
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

const clueOptions = [
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
  { id: "photo", label: "프로필 사진의 파란 안경" },
  { id: "uniform", label: "프로필에서 군복 같은 옷을 입음" },
  { id: "grammar", label: "조금 어색한 한국어" },
];

const clueExplanations: Record<string, string> = {
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

const exitScripts: Record<CaseId, Record<EndingGrade, string[]>> = {
  ep01: {
    S: ["지금 보안 문제가 생겨서 잠시 매우 오래 오프라인입니다.", "당신은 해커보다 질문이 많습니다. good bye."],
    A: ["화성에서 긴급 회의가 시작됐습니다. 당분간 연락 불가능.", "당신의 신뢰는 기억하겠습니다. good bye."],
    C: ["본인 인증이 복잡해져서 저는 다른 지구 업무를 보겠습니다.", "링크는 곧 매우 공식적으로 사라집니다. good bye."],
    F: ["추가 국제 비용을 확인하고 다시 연락하겠습니다.", "지금은 화성 회의 때문에 잠시 매우 오래 오프라인입니다."],
  },
  ep02: {
    S: ["아, 왜 이렇게 꼬치꼬치 물어?", "됐어. 연락하지 마."],
    A: ["계속 확인부터 하니까 좀 서운하네.", "됐어. 연락하지 마."],
    C: ["도와줄 것처럼 하더니 끝까지 따질 거면 됐어.", "나 지금 정신없어. 연락하지 마."],
    F: ["지금 병원이라 당분간 연락 못 할 것 같아.", "나중에 꼭 연락할게. 진짜로."],
  },
  ep06: {
    S: ["질문이 작전 보안보다 많군요.", "당분간 연락 안 될 거예요. 긴 수술이 있어서요."],
    A: ["당분간 연락 안 될 거예요. 긴 수술이 있어서요.", "당신 잊지 않을게요. goodbuy."],
    C: ["세관과 사랑 모두 잠시 멈췄습니다.", "당신 잊지 않을게요. goodbuy."],
    F: ["보험 문제를 해결하러 긴 수술에 들어갑니다.", "당신 잊지 않을게요. goodbuy."],
  },
};

const sceneCollections: Record<CaseId, Record<string, Scene>> = { ep01: scenes, ep02: seoyunScenes, ep06: romanceScenes };
const getScene = (caseId: CaseId, sceneId: SceneId): Scene => sceneCollections[caseId][sceneId];

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const typingDelay = (text: string, seed: number) => Math.min(2700, 620 + text.length * 27 + (seed % 5) * 80);
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function calculateScore({ virtualMoneyLost, virtualMoneyAtRisk: totalMoney, decisionScore, foundClues, totalClues, earlyDetection, wrongClues }: ScoreInput): ScoreBreakdown {
  const wallet = virtualMoneyLost === 0 ? 40 : Math.round(40 * (1 - clamp(virtualMoneyLost / totalMoney, 0, 1)));
  const decisions = clamp(Math.round(decisionScore), 0, 30);
  const evidence = totalClues > 0 ? Math.round(25 * clamp(foundClues / totalClues, 0, 1)) : 0;
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
  return (
    <button className="message-image-button" onClick={() => onOpen({ src: message.image!, alt })} aria-label={`${alt} 크게 보기`}>
      <img src={message.image} alt={alt} width="1120" height="896" decoding="async" fetchPriority="high" onError={() => setFailed(true)} />
      <span><b>전송된 파일</b> 눌러서 확대하기</span>
    </button>
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

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [activeCaseId, setActiveCaseId] = useState<CaseId>("ep01");
  const [featuredCaseId, setFeaturedCaseId] = useState<CaseId>("ep01");
  const [sceneId, setSceneId] = useState<SceneId>("start");
  const [turn, setTurn] = useState(0);
  const [phase, setPhase] = useState<Phase>("incoming");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [risk, setRisk] = useState(0);
  const [virtualMoneyLost, setVirtualMoneyLost] = useState(0);
  const [availableClues, setAvailableClues] = useState<string[]>([]);
  const [ending, setEnding] = useState<EndingGrade>("A");
  const [clueOpen, setClueOpen] = useState(false);
  const [foundClues, setFoundClues] = useState<string[]>([]);
  const [wrongClueIds, setWrongClueIds] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [infoEpisode, setInfoEpisode] = useState<(typeof episodes)[number] | null>(null);
  const [pendingTransfer, setPendingTransfer] = useState<Choice | null>(null);
  const [simulationConfirmed, setSimulationConfirmed] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  const [portraitOpen, setPortraitOpen] = useState(false);
  const [highlightedClueIds, setHighlightedClueIds] = useState<string[]>([]);
  const [clueHintVisible, setClueHintVisible] = useState(false);
  const [qaMode, setQaMode] = useState(false);
  const [qaPanelOpen, setQaPanelOpen] = useState(false);
  const [qaFast, setQaFast] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const runRef = useRef(0);
  const messageId = useRef(1);
  const clueHintShownRef = useRef(false);
  const qaFastRef = useRef(false);

  const activeCase = caseProfiles[activeCaseId];
  const featuredCase = caseProfiles[featuredCaseId];
  const featuredEpisode = episodes.find((episode) => episode.no === featuredCase.no) ?? episodes[0];
  const orderedEpisodes = [...episodes]
    .filter((episode) => episode.no !== featuredCase.no)
    .sort((left, right) => Number(Boolean(right.live)) - Number(Boolean(left.live)) || Number(left.no) - Number(right.no));
  const activeEndingCopy = activeCaseId === "ep01" ? endingCopy : activeCaseId === "ep02" ? seoyunEndingCopy : romanceEndingCopy;
  const transcriptText = messages.map((message) => message.text ?? "").join(" ");
  const dubuWasShown = messages.some((message) => message.image?.includes("seoyun-dubu") || message.imageFallback?.includes("두부"));
  const falseClueIds = activeCaseId === "ep01" ? ["photo", "grammar"] : activeCaseId === "ep02"
    ? ["normalDm", ...(dubuWasShown ? ["dogPhoto"] : []), ...(transcriptText.includes("평소보다 답장이 늦") ? ["lateReply"] : [])]
    : ["uniform", "grammar"];
  const suspicion = foundClues.length;
  const wrongClues = wrongClueIds.length;
  const unfoundClues = availableClues.filter((id) => !foundClues.includes(id));
  const highlightedUnfoundClues = highlightedClueIds.filter((id) => !foundClues.includes(id));
  const pacedWait = (ms: number) => wait(qaFastRef.current ? Math.max(45, Math.round(ms * .14)) : ms);

  useEffect(() => {
    const randomize = window.setTimeout(() => setFeaturedCaseId(liveEpisodeIds[Math.floor(Math.random() * liveEpisodeIds.length)]), 0);
    return () => window.clearTimeout(randomize);
  }, []);

  useEffect(() => {
    const enabled = new URLSearchParams(window.location.search).get("qa") === "1";
    setQaMode(enabled);
    setQaPanelOpen(enabled);
    setQaFast(enabled);
    qaFastRef.current = enabled;
  }, []);

  useEffect(() => {
    window.history.replaceState({ todayScammerScreen: "home" satisfies Screen }, "");
  }, []);

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
          setMessages((prev) => [...prev, { id: messageId.current++, from: "system", text: detail.text ?? "시간이 흘렀습니다." }]);
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
        const line = typeof incoming === "string" ? incoming : incoming.text ?? "사진을 보냈습니다.";
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
        }]);
        await pacedWait(330 + (line.length % 4) * 70);
      }
      if (runRef.current === currentRun) {
        const readingPause = 750 + Math.min(550, scene.incoming.reduce((sum, incoming) => sum + (typeof incoming === "string" ? incoming.length : (incoming.text?.length ?? 12)), 0) * 5);
        await pacedWait(readingPause);
        if (runRef.current !== currentRun) return;
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

  const stats = useMemo(() => calculateScore({
    virtualMoneyLost,
    virtualMoneyAtRisk: virtualMoneyAtRisk[activeCaseId],
    decisionScore: (ending === "S" ? 30 : ending === "A" ? 26 : ending === "C" ? 19 : 8) - risk * 2,
    foundClues: suspicion,
    totalClues: activeCase.clueTotal,
    earlyDetection: ending === "S" && virtualMoneyLost === 0,
    wrongClues,
  }), [activeCase.clueTotal, activeCaseId, ending, risk, suspicion, virtualMoneyLost, wrongClues]);

  const startCase = (caseId: CaseId) => {
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
    setMessages([]);
    setActiveCaseId(caseId);
    setSceneId(targetScene);
    setTurn(0);
    setPhase("incoming");
    setTyping(false);
    setRisk(0);
    setVirtualMoneyLost(0);
    setAvailableClues([]);
    setFoundClues([]);
    setWrongClueIds([]);
    setHighlightedClueIds([]);
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

  const finish = async (grade: EndingGrade, currentRisk: number, currentLoss: number, currentRun: number) => {
    const resolved = grade !== "F" && currentLoss > 0 ? "C" : grade === "A" && currentRisk >= 3 ? "C" : grade;
    for (const line of exitScripts[activeCaseId][resolved]) {
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
    addMessage("system", resolved === "S" ? `${activeCase.scammer}님을 차단했습니다.` : resolved === "F" ? "게임 속 가상 송금 처리가 끝났습니다. 실제 금전 거래는 없습니다." : `${activeCase.scammer}님이 대화방을 나갔습니다.`);
    await pacedWait(1150);
    if (runRef.current !== currentRun) return;
    addMessage("system", `CASE ${activeCase.no} 대화 기록 분석이 완료됐습니다.`);
    await pacedWait(1050);
    if (runRef.current !== currentRun) return;
    setEnding(resolved);
    setPhase("resolved");
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
      await finish(choice.ending, nextRisk, nextVirtualLoss, currentRun);
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
    const copy = activeEndingCopy[ending];
    const moneyResult = virtualMoneyLost > 0 ? `게임 속 가상금액 ${virtualMoneyLost.toLocaleString("ko-KR")}원을 보냈습니다.` : `게임 속 가상금액 ${activeCase.virtualAmount}을 지켜냈습니다.`;
    const text = `《오늘의 사기꾼》\n속아 넘어가기 전에 탈출하라\n\n사기 생존력 ${stats.total}점\n🔍 증거 ${suspicion} / ${activeCase.clueTotal}\n오판 ${wrongClues}\n${moneyResult}\n${copy.shareLine}\n\n너도 살아남을 수 있음?\n게임 시뮬레이션 · 실제 금전 거래 없음`;
    try {
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
      };
      setWrongClueIds((prev) => [...prev, id]);
      playClueTone(false);
      navigator.vibrate?.([20, 45, 20]);
      setToast(`헛다리! 오판 +1 · ${jokes[id] ?? "아직 그 냄새는 나지 않습니다. 코를 아껴두세요."}`);
    }
  };

  const goHome = () => {
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

  const showEnding = () => {
    setScreen("ending");
    window.history.pushState({ todayScammerScreen: "ending" satisfies Screen }, "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (screen === "briefing") {
    return (
      <main className={`briefing-screen case-${activeCase.no}`}>
        <img className="briefing-portrait" src={activeCase.portrait} alt={`${activeCase.scammer} 가상 캐릭터`} width="1024" height="1536" decoding="async" fetchPriority="high" />
        <div className="briefing-shade" aria-hidden="true" />
        <header className="briefing-nav">
          <button className="plain-back" onClick={goHome} aria-label="에피소드 목록으로">← 돌아가기</button>
          <span><i /> 접속 중</span>
        </header>
        <section className="briefing-card">
          <div className="briefing-topline"><span>CASE {activeCase.no} · 공식 아님</span><span>{activeCase.duration}</span></div>
          <p className="briefing-label">오늘의 상대</p>
          <h1>{activeCase.scammer}</h1>
          <p className="suspect-alias">{activeCase.alias}</p>
          <p className="briefing-title">{activeCase.title}</p>
          <div className="case-tags"><span>{activeCase.type}</span><span>{activeCaseId === "ep02" ? "난이도 ★★★★☆" : "난이도 보통"}</span><span>엔딩 4개</span></div>
          <div className="mission-note"><span>MISSION</span><p>{activeCaseId === "ep01" ? "이 사람의 말이 어디서부터 이상한지 찾아내고, 가상 송금 전에 대화방을 빠져나오세요." : activeCaseId === "ep02" ? "평범한 소개팅 대화 속에서 8일 전의 말과 오늘의 말이 어긋나는 순간을 기억하세요." : "느끼한 미소가 통관비 요구로 변하는 순간을 찾아내고, 가상 송금 전에 사건을 끝내세요."}</p></div>
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
      <main className={`chat-shell${qaMode ? " qa-enabled" : ""}`}>
        <header className="chat-header">
          <button className="chat-back" onClick={goHome} aria-label="사건 목록으로 돌아가기">‹</button>
          <button className="avatar-button tiny-avatar" onClick={() => setPortraitOpen(true)} aria-label={`${activeCase.scammer} 프로필 사진 크게 보기`}><img src={activeCase.portrait} alt="" /><span className="online-dot" /></button>
          <div className="chat-person"><strong>{activeCase.scammer}</strong><span>{typing ? "입력 중…" : activeCaseId === "ep02" ? "온라인 · 대화 중" : "온라인 · 번역기로 대화 중인 것 같음"}</span></div>
          {qaMode && <button className="qa-toggle" onClick={() => setQaPanelOpen((open) => !open)} aria-expanded={qaPanelOpen}>QA</button>}
        </header>

        {qaMode && qaPanelOpen && (
          <aside className="qa-panel" aria-label="대화 점검 모드">
            <div className="qa-panel-head"><div><span>CREATOR QA</span><strong>대화 점검 모드</strong></div><button onClick={() => setQaPanelOpen(false)} aria-label="점검 패널 닫기">×</button></div>
            <div className="qa-controls">
              <label>사건<select value={activeCaseId} onChange={(event) => { const caseId = event.target.value as CaseId; qaJumpToScene(caseId, caseProfiles[caseId].start); }}><option value="ep01">EP.01 모스크바</option><option value="ep02">EP.02 J</option><option value="ep06">EP.06 제임스</option></select></label>
              <label>장면<select value={sceneId} onChange={(event) => qaJumpToScene(activeCaseId, event.target.value as SceneId)}>{qaSceneIds.map((id) => <option value={id} key={id}>{id}</option>)}</select></label>
              <button className={qaFast ? "active" : ""} onClick={toggleQaSpeed}>빠른 재생 {qaFast ? "ON" : "OFF"}</button>
            </div>
            <div className="qa-status"><span>현재 <b>{sceneId}</b></span><span>상태 <b>{phase}</b></span><span>단서 <b>{qaScene.clues?.join(", ") || "없음"}</b></span><span>알림 <b>{qaScene.cluePrompt ? "결정적" : "일반"}</b></span></div>
            <ol className="qa-lines">
              {qaScene.incoming.map((incoming, index) => { const detail = typeof incoming === "string" ? null : incoming; const line = typeof incoming === "string" ? incoming : incoming.text ?? (incoming.image ? "[이미지]" : "[입력 중 취소]"); return <li key={`${index}-${line}`}><span>{detail?.from === "system" ? "SYSTEM" : detail?.callCard ? "CALL" : detail?.image ? "IMAGE" : "CHAT"}</span>{line}</li>; })}
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
          <p className="secure-note"><strong>게임 시뮬레이션 · 실제 금전 거래 없음</strong><br />{activeCaseId === "ep01" ? "이 대화는 우주 보안 규정에 의해 전혀 보호되지 않습니다." : activeCaseId === "ep02" ? "처음엔 정말 평범한 대화처럼 보일 수 있습니다." : "이 대화는 작전 보안과 사랑의 힘으로 전혀 인증되지 않았습니다."}</p>
          {messages.map((message) => (
            <div className={`message-row ${message.from}`} key={message.id}>
              {message.from === "scammer" && <button className="avatar-button bubble-avatar" onClick={() => setPortraitOpen(true)} aria-label={`${activeCase.scammer} 프로필 사진 크게 보기`}><img src={activeCase.portrait} alt="" /></button>}
              <div className={`message-bubble${message.image ? " has-image" : ""}${message.callCard ? " has-call" : ""}`}>
                {message.image && <MessageImage message={message} onOpen={setPreviewImage} />}
                {message.callCard && <VideoCallCard portrait={activeCase.portrait} name={activeCase.scammer} note={message.text ?? "짧은 영상통화가 연결되었습니다."} />}
                {message.text && !message.callCard && <span className="message-text">{message.text}</span>}
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
                <button className={choice.virtualTransfer ? "virtual-transfer-choice" : ""} key={choice.text} onClick={() => selectReply(choice)}><span>{String.fromCharCode(65 + index)}</span>{choice.text}</button>
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
              <p>{activeCaseId === "ep02" && availableClues.length === 0 ? "아직 뚜렷한 사기 신호는 없습니다. 사람과 대화하는 것 자체는 범죄가 아닙니다." : "수상한 장면 하나를 고르세요. 헛다리는 오판 +1, 최종 점수 -3점입니다."}</p>
              <div className="clue-grid">
                {clueOptions.filter((clue) => availableClues.includes(clue.id) || falseClueIds.includes(clue.id)).map((clue) => {
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
              <div className="evidence-preview-head"><div><span>{previewImage.src.includes("dubu") ? "전송된 사진 · 게임 일러스트" : "전송된 파일 · 가상 서류"}</span><h2 id="evidence-preview-title">{previewImage.src.includes("dubu") ? "두부 사진" : "자격증 이미지(?)"}</h2></div><button onClick={() => setPreviewImage(null)} aria-label="이미지 닫기">×</button></div>
              <img src={previewImage.src} alt={previewImage.alt} width="1120" height="896" decoding="async" />
              {previewImage.src.includes("dubu") ? <p><strong>게임용 가상 캐릭터 이미지</strong><br />두부는 무죄입니다. 귀여운 사진 자체는 사기 증거가 아닙니다.</p> : <p><strong>게임 속 가상 서류 · 실제 자격증 아님</strong><br />수정 스티커, 철자, 날짜, 직인을 자세히 보세요. 이미지가 공식 확인을 대신할 수는 없습니다.</p>}
            </section>
          </div>
        )}
        {portraitOpen && (
          <div className="modal-backdrop avatar-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPortraitOpen(false); }}>
            <section className="avatar-preview" role="dialog" aria-modal="true" aria-labelledby="avatar-preview-title">
              <div><span>프로필 사진 · 가상 캐릭터</span><h2 id="avatar-preview-title">{activeCase.scammer}</h2></div>
              <button onClick={() => setPortraitOpen(false)} aria-label="프로필 사진 닫기">×</button>
              <img src={activeCase.portrait} alt={`${activeCase.scammer} 얼굴 일러스트`} width="1024" height="1536" decoding="async" />
            </section>
          </div>
        )}
        {toast && <div className="game-toast" role="status">{toast}</div>}
      </main>
    );
  }

  if (screen === "ending") {
    const copy = activeEndingCopy[ending];
    const moneyResult = virtualMoneyLost > 0 ? `게임 속 가상금액 ${virtualMoneyLost.toLocaleString("ko-KR")}원을 보냈습니다.` : `게임 속 가상금액 ${activeCase.virtualAmount}을 지켜냈습니다.`;
    const damageResult = virtualMoneyLost > 0 ? `게임 속 가상피해 ${virtualMoneyLost.toLocaleString("ko-KR")}원` : "게임 속 가상피해 0원";
    const allCluesFound = suspicion === activeCase.clueTotal && wrongClues === 0;
    const endingBody = activeCaseId === "ep02" && ending === "C" && virtualMoneyLost > 0
      ? `게임 속 가상금액 ${virtualMoneyLost.toLocaleString("ko-KR")}원을 보냈지만, 다음 요구에서 멈췄습니다. 실제 금전 거래는 없었습니다.`
      : copy.body;
    const connectedCases = liveEpisodeIds.filter((caseId) => caseId !== activeCaseId);
    return (
      <main className={`ending-screen grade-${ending.toLowerCase()}`}>
        <div className="ending-noise" />
        {stats.total >= 90 && <div className="result-confetti" aria-hidden="true">{Array.from({ length: 14 }, (_, index) => <i key={index} />)}</div>}
        <section className="result-card">
          <nav className="result-nav" aria-label="결과 화면 이동"><button onClick={goHome}>← 사건 목록</button></nav>
          {stats.total >= 90 && <div className="respect-effect"><span>🎉 S급 사기 생존자</span><strong>오늘은 당신 지갑이 매우 평화롭습니다.</strong><i aria-hidden="true" /></div>}
          {allCluesFound && <div className="scent-master-badge"><span>👃</span><div><small>SPECIAL BADGE</small><strong>후각 만렙 · 증거 전체 수집</strong></div></div>}
          <div className="result-stamp"><small>CASE CLOSED</small><strong>{ending}</strong><span>RANK</span></div>
          <p className="ending-kicker">{copy.kicker}</p>
          <h1>{copy.title}</h1>
          <div className="survival-score"><span>사기 생존력</span><strong>{stats.total}</strong><em>/100</em></div>
          <div className="result-core-summary"><span>{damageResult}</span><strong>🔍 증거 {suspicion} / {activeCase.clueTotal}</strong><em>오판 {wrongClues}</em></div>
          <button className="share-button primary-share" onClick={shareResult}><span>친구도 살아남는지 보내보기</span><b>↗</b></button>
          <p className="ending-body">{endingBody}</p>
          <div className="score-breakdown" aria-label="점수 계산 근거">
            <div><span>지갑 방어</span><b>{stats.wallet} / 40</b></div>
            <div><span>판단력</span><b>{stats.decisions} / 30</b></div>
            <div><span>증거 포착</span><b>{stats.evidence} / 25</b></div>
            <div><span>조기 간파</span><b>{stats.earlyBonus} / 5</b></div>
            <div className={wrongClues ? "penalty" : ""}><span>오판 {wrongClues}</span><b>{stats.wrongPenalty}점</b></div>
          </div>
          <div className="evidence-summary"><span>{activeCase.clueTotal - suspicion > 0 ? `놓친 수법 ${activeCase.clueTotal - suspicion}개 · 다른 선택에서 발견 가능` : "모든 사기 냄새를 찾았습니다"}</span><strong>{suspicion} / {activeCase.clueTotal}</strong></div>

          <section className="share-card" aria-label="공유할 결과">
            <span>오늘의 생존 보고서</span>
            <strong>사기 생존력 {stats.total}점</strong>
            <p>🔍 증거 {suspicion} / {activeCase.clueTotal} · 오판 {wrongClues}<br />{moneyResult}<br />{copy.shareLine}</p>
            <small>게임 시뮬레이션 · 실제 금전 거래 없음</small>
          </section>

          <section className="tactic-recap" aria-labelledby="tactic-title">
            <span>방금 당할 뻔한 수법</span>
            <h2 id="tactic-title">{activeCase.tactic}</h2>
          </section>

          <section className="next-case-panel" aria-labelledby="next-case-title">
            <div className="next-case-signal"><span>연결된 사건</span><b>바로 상대하기</b></div>
            <h2 id="next-case-title" className="next-case-heading">바로 이어서 상대할 사기꾼</h2>
            <div className="connected-case-list">
              {connectedCases.map((caseId) => {
                const profile = caseProfiles[caseId];
                const episode = episodes.find((item) => item.no === profile.no)!;
                return (
                  <button className="connected-case-card" key={caseId} onClick={() => startCase(caseId)} aria-label={`${profile.title} 사건파일 열기`}>
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
        {toast && <div className="game-toast" role="status">{toast}</div>}
      </main>
    );
  }

  return (
    <main className="home-screen">
      <div className="home-glow" aria-hidden="true" />
      {qaMode && <section className="qa-home-bar" aria-label="QA 사건 바로 열기"><div><span>CREATOR QA</span><strong>검수할 사건을 바로 여세요</strong></div>{liveEpisodeIds.map((caseId) => <button key={caseId} onClick={() => qaJumpToScene(caseId, caseProfiles[caseId].start)}>CASE {caseProfiles[caseId].no}</button>)}</section>}
      <header className="game-brand">
        <div className="eyebrow"><span>SCAMMER ARCHIVE</span><b>SEASON 01</b></div>
        <h1><img className="brand-logo" src="/logo-oneul.webp" alt="오늘의 사기꾼" width="800" height="375" decoding="async" fetchPriority="high" /></h1>
        <p>메시지가 도착했습니다.<br />누구 말부터 의심해볼까요?</p>
      </header>

      <section className="roster" aria-labelledby="roster-heading">
        <div className="roster-heading"><div><span>지금 접속 중</span><h2 id="roster-heading">현재 접속한 상대</h2></div><p><i /> 3명</p></div>
        <article className="featured-case" style={{ "--accent": featuredEpisode.accent } as React.CSSProperties}>
          <img className="featured-portrait" src={featuredCase.portrait} alt={`${featuredCase.scammer} 가상 캐릭터`} width="1024" height="1536" decoding="async" fetchPriority="high" />
          <div className="featured-shade" aria-hidden="true" />
          <div className="featured-status"><span><i /> LIVE</span><b>CASE {featuredCase.no}</b></div>
          <div className="featured-copy"><span className="type-chip">{featuredCase.type} · 공식 아님</span><h3>{featuredEpisode.name}</h3><p>“{featuredEpisode.line}.”</p><div className="suspect-name"><span>상대</span><strong>{featuredCase.scammer}</strong><em>{featuredCase.alias.split(" · ")[0]}</em></div></div>
          <button onClick={() => startCase(featuredCaseId)} aria-label={`케이스 ${featuredCase.no} 플레이`}><span>상대하기</span><b>→</b></button>
        </article>

        <div className="next-up"><div><span>다른 사기꾼들</span><h2>다른 사건파일</h2></div><b>{orderedEpisodes.length} CASES</b></div>
        <div className="episode-grid">
          {orderedEpisodes.map((episode) => {
            const playable = Boolean(episode.live);
            const episodeCaseId = caseIdFromEpisodeNo(episode.no);
            return (
            <button className={`episode-card case-${episode.no} ${playable ? "live" : ""}`} key={episode.no} style={{ "--accent": episode.accent } as React.CSSProperties} onClick={() => playable ? startCase(episodeCaseId) : setInfoEpisode(episode)}>
              <div className={`episode-visual ${playable ? "has-portrait" : ""}`}>{playable && <img src={caseProfiles[episodeCaseId].portrait} alt="" loading="lazy" decoding="async" />}<span>{playable ? "" : episode.mark}</span><b>{episode.no}</b></div>
              <div className="episode-meta"><span>{episode.type}</span><em>{playable ? "상대하기" : "COMING SOON"}</em></div>
              <h3>{episode.name}</h3>
              <p>{episode.line}</p>
              <small>{episode.scammer}</small>
            </button>
          )})}
        </div>
      </section>

      <footer className="home-footer"><strong>의심은 빠르게, 가상 송금도 신중하게.</strong><p>게임 시뮬레이션 · 실제 금전 거래 없음<br />웃기는 건 사기꾼이지, 피해자가 아닙니다.</p></footer>

      {infoEpisode && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setInfoEpisode(null); }}>
          <section className="soon-sheet" role="dialog" aria-modal="true" style={{ "--accent": infoEpisode.accent } as React.CSSProperties}>
            <button className="soon-close" onClick={() => setInfoEpisode(null)} aria-label="닫기">×</button>
            <span>CASE {infoEpisode.no} · COMING SOON</span><div className="soon-mark">{infoEpisode.mark}</div><small>{infoEpisode.type}</small><h2>{infoEpisode.name}</h2><p>{infoEpisode.line}</p><div><span>상대</span><strong>{infoEpisode.scammer}</strong></div><button className="notify-fake" onClick={() => { setInfoEpisode(null); setToast("출시 알림은 마음속으로 예약됐습니다."); }}>조금만 기다리기</button>
          </section>
        </div>
      )}
      {toast && <div className="game-toast" role="status">{toast}</div>}
    </main>
  );
}
