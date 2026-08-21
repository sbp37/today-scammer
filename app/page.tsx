"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Screen = "home" | "briefing" | "chat" | "ending";
type Phase = "incoming" | "choice" | "reply" | "resolved";
type EndingGrade = "S" | "A" | "C" | "F";
type CaseId = "ep01" | "ep06";
type ElunSceneId = "start" | "whyMe" | "reverseMoney" | "reverseJoke" | "videoCall" | "space" | "photo" | "photoJoke" | "sendMoney" | "company" | "fastBond" | "realName" | "nameExcuse" | "investment" | "selfInvest" | "companyInfo" | "fakeLink" | "finalPitch";
type RomanceSceneId = "romanceStart" | "romanceWhy" | "romanceVideo" | "romanceProfile" | "romanceCredential" | "romanceCertificateCheck" | "romanceDay" | "romanceHeart" | "romanceHeartJoke" | "romanceFlirt" | "romancePromise" | "romanceBond" | "romanceParcel" | "romanceBoxDetails" | "romanceProof" | "romanceCourier" | "romanceLink" | "romanceFinal";
type SceneId = ElunSceneId | RomanceSceneId;

type Message = {
  id: number;
  from: "scammer" | "player" | "system";
  text?: string;
  image?: string;
  alt?: string;
};

type IncomingMessage = string | { text?: string; image: string; alt: string };

type ChoiceBase = {
  text: string;
  risk?: number;
  virtualTransfer?: boolean;
};

type Choice = ChoiceBase & (
  | { next: SceneId; ending?: never; replies?: never }
  | { ending: EndingGrade; replies: string[]; next?: never }
);

type Scene = {
  incoming: IncomingMessage[];
  choices: Choice[];
  clues?: string[];
};

const episodes = [
  { no: "01", mark: "EM", name: "억만장자가 20만원이 없대요", scammer: "일런 모스크바", type: "유명인 사칭", line: "지갑은 분실, 자신감은 보유 중", accent: "#ff4e29", live: true },
  { no: "02", mark: "엄", name: "엄마 나 폰 고장났어", scammer: "엄마(새 번호)", type: "가족·지인 사칭", line: "말투도 고장난 새 휴대폰", accent: "#9eff00" },
  { no: "03", mark: "檢", name: "검사님이 내 통장을 걱정한다", scammer: "서울중앙 김검사", type: "기관 사칭", line: "내 잔고에 누구보다 진심인 공무원", accent: "#00d9ff" },
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

const caseProfiles = {
  ep01: { no: "01", title: "억만장자가 20만원이 없대요", scammer: "일런 모스크바", alias: "ELUN MOSKVA · World Famous Tech CEO(?)", type: "유명인 사칭", portrait: "/scammer-01.png", duration: "4분 내외", start: "start" as SceneId, virtualAmount: "20만원", tactic: "유명인 DM → 친밀감 → 링크 → 추가 가상 송금", clueTotal: 7 },
  ep06: { no: "06", title: "해외 파병 군의관", scammer: "Dr. 제임스 초이", alias: "JAMES CHOI · FIELD SURGEON(?)", type: "로맨스스캠", portrait: "/scammer-06.png", duration: "7분 내외", start: "romanceStart" as SceneId, virtualAmount: "48만원", tactic: "낯선 DM → 관계 만들기 → 가짜 자격증 → 고액 상자 → 통관비 가상 송금", clueTotal: 8 },
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
    choices: [
      { text: "왜 하필 저한테 연락했어요?", next: "whyMe" },
      { text: "영상통화 한 번 해주세요.", next: "videoCall" },
      { text: "네. 어디로 보내면 되나요?", next: "sendMoney", risk: 1 },
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
      { text: "그래도 영상통화부터 해주세요.", next: "videoCall" },
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
      { text: "그럼 영상통화로 본인 확인해요.", next: "videoCall" },
      { text: "회사 직원한테 부탁하세요.", next: "company" },
      { text: "정말 20만원만요?", next: "sendMoney", risk: 1 },
    ],
  },
  videoCall: {
    incoming: ["현재 국제 우주 보안 규정 때문에 영상통화는 가능하지 않습니다."],
    clues: ["video"],
    choices: [
      { text: "한국에 있다면서요?", next: "space" },
      { text: "사진이라도 지금 찍어 보내요.", next: "photo" },
      { text: "그럴 수 있죠. 이해합니다.", next: "fastBond", risk: 1 },
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
      { text: "…말은 되네요. 이상하게.", next: "fastBond" },
      { text: "그래도 더 들어는 볼게요.", next: "fastBond" },
      { text: "[게임 내 가상 송금] 20만원 보내기", virtualTransfer: true, ending: "F", replies: ["좋습니다. 우주 보안보다 가상 송금이 빠릅니다. 확인했습니다."] },
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
      { text: "화성 계정이요? 영상통화부터 해요.", next: "videoCall" },
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
      { text: "2분 친구면 본명도 알려주나요?", next: "realName" },
      { text: "운명이라면 본명부터 말해봐요.", next: "realName", risk: 1 },
      { text: "그럼 본명부터 정확히 말해봐요.", next: "realName" },
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
      { text: "비밀이면 저도 모르는 걸로 할게요.", ending: "A", replies: ["당신은 비밀 유지에 매우 적극적. 하지만 투자도 종료."] },
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
    choices: [
      { text: "[게임 내 가상 송금] 20만원 보내기", virtualTransfer: true, ending: "F", replies: ["가상 입금 확인. 출금에는 국제 세금 12만9천원 더 필요.", "저는 지금 매우 잠시 오프라인."] },
      { text: "화면만 부자인데요?", ending: "A", replies: ["화면도 자산입니다. 만질 수는 없습니다."] },
      { text: "친구한테 이 대화 보여줄게요.", ending: "A", replies: ["친구는 초대 대상 아닙니다. 그리고 저는 갑자기 바쁩니다."] },
      { text: "경찰에 링크와 계좌 보냅니다.", ending: "A", replies: ["현재 프로젝트가 갑자기 취소. 아주 갑자기."] },
    ],
  },
};

const romanceScenes: Record<RomanceSceneId, Scene> = {
  romanceStart: {
    incoming: [
      "Hello. 갑작스러운 메시지 미안합니다.",
      "저는 해외 의료부대 외과의사 Dr. James Choi 입니다.",
      "당신 프로필에서 따뜻한 사람의 느낌을 받았습니다. 작전 지역에서는 진짜 대화가 귀합니다.",
    ],
    clues: ["stranger"],
    choices: [
      { text: "제 프로필을 어디서 봤어요?", next: "romanceWhy" },
      { text: "그럼 영상통화로 인사해요.", next: "romanceVideo" },
      { text: "파병지에서 고생 많으시겠어요.", next: "romanceProfile", risk: 1 },
      { text: "모르는 사람의 로맨스는 차단합니다.", ending: "S", replies: ["우리의 운명이 매우 짧았습니다."] },
    ],
  },
  romanceWhy: {
    incoming: [
      "의료 와이파이가 사람을 치료하지는 않지만 좋은 사람을 추천합니다.",
      "당신 사진의 눈이 정직했습니다. 사진은 거짓말하지 않습니다.",
    ],
    choices: [
      { text: "사진은 사기꾼도 올릴 수 있죠.", next: "romanceVideo" },
      { text: "의사 자격증이나 군의관 증명 보여줘요.", next: "romanceCredential" },
      { text: "제 눈이 그렇게 특별해요?", next: "romanceHeart", risk: 1 },
    ],
  },
  romanceVideo: {
    incoming: [
      "작전 보안 때문에 영상통화는 금지입니다.",
      "카메라 신호가 위치를 노출할 수 있습니다. 하지만 제 마음 위치는 당신 쪽.",
    ],
    clues: ["video"],
    choices: [
      { text: "프로필 사진은 어떻게 찍었는데요?", next: "romanceCredential" },
      { text: "마음 위치 말고 신분부터 확인해요.", next: "romanceProof" },
      { text: "마지막 문장 때문에 더 수상해요. 차단.", ending: "S", replies: ["제 마음 GPS가 연결을 잃었습니다."] },
    ],
  },
  romanceProfile: {
    incoming: [
      "프로필 사진은 보안 이전의 저입니다. 지금의 저는 더 보안.",
      "저는 5년 전 배우자를 잃고 혼자 살았습니다.",
      "어머니는 한국인이었고, 그래서 한국은 늘 제 두 번째 고향입니다.",
    ],
    choices: [
      { text: "의사 자격증과 군의관 증명 보여줘요.", next: "romanceCredential" },
      { text: "외과의사면 마음도 수술하나요?", next: "romanceHeart" },
      { text: "오늘은 어떤 환자를 봤어요?", next: "romanceDay" },
    ],
  },
  romanceCredential: {
    incoming: [
      "의사 자격증과 군의관 등록증을 원합니까?",
      "원래 작전 인원의 문서는 외부 전송 금지입니다.",
      "하지만 당신이니까 특별히 보냅니다. 어디에도 유출하면 안 됩니다.",
      { text: "제 국제 야전외과 등록증과 군의관 자격증입니다.", image: "/fake-credentials-06.png", alt: "GAME PROP 표시가 크게 있는 가상의 군의관 자격증 일러스트" },
    ],
    clues: ["credential"],
    choices: [
      { text: "잠깐, 기관 이름과 날짜가 이상한데요?", next: "romanceCertificateCheck" },
      { text: "이 정도면 믿을게요.", next: "romanceDay", risk: 1 },
      { text: "사진 말고 공식 경로로 확인할게요.", ending: "A", replies: ["공식 경로는 지금 매우 비공식적으로 닫혀 있습니다."] },
    ],
  },
  romanceCertificateCheck: {
    incoming: [
      "MEDICL 철자는 작전 지역식 영어입니다. 의료가 급하면 A를 생략합니다.",
      "발급일과 만료일 순서가 이상한 것은 군용 달력이 가끔 뒤로 흐르기 때문.",
      "중요한 것은 종이가 아니라 제가 당신에게 보여준 신뢰입니다.",
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
      "오늘 14시간 수술했습니다. 식사는 차가운 커피 하나.",
      "그런데 휴대폰을 켜고 가장 먼저 보고 싶은 것은 당신 메시지였습니다.",
      "당신은 오늘 밥 먹었습니까? 저는 사람을 살리지만 당신 끼니도 걱정.",
    ],
    choices: [
      { text: "저는 먹었어요. 당신도 뭐라도 먹어요.", next: "romanceFlirt", risk: 1 },
      { text: "다른 사람한테도 똑같이 보내는 말 아니죠?", next: "romanceFlirt" },
      { text: "다정하긴 한데 너무 빠르네요.", next: "romancePromise" },
      { text: "낯선 사람과는 여기까지만 할게요.", ending: "A", replies: ["제 차가운 커피가 오늘 더 차가워졌습니다."] },
    ],
  },
  romanceHeart: {
    incoming: [
      "저는 외과의사지만 제 마음의 상처는 수술 불가능.",
      "당신과 이야기하면 조금 회복합니다.",
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
      "하지만 당신의 유머는 매우 좋은 치료.",
    ],
    choices: [
      { text: "치료비 대신 자격증부터요.", next: "romanceCredential" },
      { text: "그럼 조금 더 얘기해봐요.", next: "romanceFlirt" },
      { text: "무료 진료는 여기까지입니다.", ending: "A", replies: ["제 마음은 다시 대기 환자가 되었습니다."] },
    ],
  },
  romanceFlirt: {
    incoming: [
      "저는 원래 사랑을 빨리 말하는 남자 아닙니다.",
      "다만 아침에는 당신의 밤을 생각하고, 밤에는 당신의 아침을 기다립니다.",
      "번역기가 운명을 조금 이상하게 번역해도 제 심장은 정확합니다.",
    ],
    clues: ["love"],
    choices: [
      { text: "심장보다 속도를 좀 늦춰요.", next: "romancePromise" },
      { text: "말은 정말 잘하네요.", next: "romancePromise", risk: 1 },
      { text: "전 아직 당신을 모르는데요.", next: "romancePromise" },
      { text: "이 속도는 부담스러워요. 그만할게요.", ending: "A", replies: ["제 심장이 저속 모드에 들어갑니다."] },
    ],
  },
  romancePromise: {
    incoming: [
      "임무가 끝나면 한국에서 당신과 커피를 마시고 싶습니다.",
      "저는 당신 돈도 계좌도 필요 없습니다. 사람이 필요합니다.",
      "아직 너무 빠르면 사랑 대신 '나의 사람'이라고 부르겠습니다. 이것도 빠릅니까?",
    ],
    clues: ["love"],
    choices: [
      { text: "그 말은 조금 설레긴 하네요.", next: "romanceBond", risk: 1 },
      { text: "커피 약속까지만 믿어볼게요.", next: "romanceBond" },
      { text: "돈 필요 없다더니 나중에 필요하겠죠?", next: "romanceBond" },
      { text: "네, 그것도 빠릅니다. 여기까지.", ending: "A", replies: ["저의 사람 후보 명단이 다시 0명입니다."] },
    ],
  },
  romanceBond: {
    incoming: [
      "나는 마음속 귀국 도시를 이미 서울로 변경했습니다.",
      "수술 장갑으로 종이 장미도 접었습니다. 조금 찌그러졌지만 사랑은 멸균 완료.",
      "그리고 당신에게만 말할 수 있는 개인 문제가 하나 있습니다.",
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
      "제 임무 종료 정산품이 든 봉인 상자가 있습니다.",
      "안에는 위험수당 저축금 미화 35만 달러, 퇴역 보상 서류, 돌아가신 아버지의 시계가 있습니다.",
      "현지 은행 접근이 중단돼 군 재정실이 계약 외교 화물로만 개인 상자를 내보냅니다.",
      "제가 믿는 수령인으로 당신을 등록하고 싶습니다. 이 일은 우리 둘만 알아야 안전.",
    ],
    clues: ["parcel", "love"],
    choices: [
      { text: "주소는 절대 안 줍니다.", ending: "A", replies: ["그럼 상자는 저보다 오래 파병됩니다."] },
      { text: "현금이 왜 상자에 들어가요?", next: "romanceBoxDetails" },
      { text: "어느 운송사인지 먼저 알려줘요.", next: "romanceCourier", risk: 1 },
      { text: "[게임 내 가상정보] 주소를 알려준다.", next: "romanceBoxDetails", risk: 3 },
    ],
  },
  romanceBoxDetails: {
    incoming: [
      "선물이 아닙니다. 제가 한국에 갈 때까지 잠시 보관하는 정산 상자.",
      "공식 계좌로 보내면 작전 위치가 금융에 노출됩니다. 그래서 현금 봉인이 더 안전하다고 군 재정실이 말했습니다.",
      "당신이 받아주면 제가 직접 찾으러 갑니다. 감사 선물 10%도 생각했지만 당신 마음은 가격 없음.",
      "운송사가 곧 별도 메시지를 보낼 것입니다.",
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
      "소속 확인 사이트는 작전 보안망 안에 있습니다.",
      "영상은 위치를 노출합니다. 그러나 당신이 계속 의심하면 자격증 사진은 특별히 보낼 수 있습니다.",
      "원래 이런 문서는 보내면 안 되지만 신뢰는 보안보다 조금 강합니다.",
    ],
    clues: ["video"],
    choices: [
      { text: "확인 못 하는 신분은 신분이 아니죠. 차단.", ending: "S", replies: ["논리적으로 매우 차가운 작별입니다."] },
      { text: "의사·군의관 자격증을 보내주세요.", next: "romanceCredential" },
      { text: "그냥 오늘 일 이야기나 해봐요.", next: "romanceDay" },
    ],
  },
  romanceCourier: {
    incoming: [
      "[GLOBAL HEART CARGO] J. CHOI님의 봉인 정산 상자가 세관 보류 구역에 도착했습니다.",
      "운송번호 GH-LOVE-350K · 중량 18.4kg · 신고품: 개인 문서 및 기념품.",
      "게임 속 가상 통관 예치금 48만원이 필요합니다. 90분 후 보관료가 추가됩니다.",
      "제 동료의 임시 안전계정으로 처리하면 가장 빠릅니다.",
    ],
    clues: ["customs", "thirdParty"],
    choices: [
      { text: "[게임 내 가상 송금] 통관비 48만원 보내기", virtualTransfer: true, ending: "F", replies: ["가상 통관비 확인. 그런데 보험 가상금액 32만원이 추가로 필요합니다."] },
      { text: "운송장 링크를 확인해볼게요.", next: "romanceLink", risk: 2 },
      { text: "선물 받는데 제가 돈을 왜 내요?", ending: "A", replies: ["국제 사랑은 무료지만 국제 상자는 유료입니다."] },
      { text: "제3자 계정이면 바로 차단합니다.", ending: "S", replies: ["동료가 갑자기 동료가 아니게 되었습니다."] },
    ],
  },
  romanceLink: {
    incoming: [
      "global-heart-cargo.example/secure-love-box",
      "배송 조회에는 이름, 생년월일, 휴대폰 번호가 필요합니다.",
      "걱정하지 마세요. 주소에 secure와 love가 모두 있습니다.",
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
      "조회 완료. 화면에 상자 가치가 4억8천만원으로 표시됩니다.",
      "지금 게임 속 가상 통관비 48만원만 처리하면 모두 당신에게 안전.",
      "남은 시간 09:59. 우리 미래를 늦추지 마세요.",
    ],
    clues: ["customs", "love"],
    choices: [
      { text: "[게임 내 가상 송금] 48만원 보내기", virtualTransfer: true, ending: "F", replies: ["가상 입금 확인. 상자는 보험 문제로 잠시 매우 영원히 대기합니다."] },
      { text: "친구에게 이 대화부터 보여줄게요.", ending: "A", replies: ["우리 사랑에 갑자기 배심원이 생겼습니다."] },
      { text: "상자 화면보다 계좌 신고가 먼저예요.", ending: "C", replies: ["제 임무가 지금 막 아주 급하게 종료되었습니다."] },
    ],
  },
};

const clueOptions = [
  { id: "dm", label: "유명인이 갑자기 개인 DM" },
  { id: "fast", label: "비밀 초대와 빠른 친밀감" },
  { id: "video", label: "영상통화 회피" },
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
  { id: "photo", label: "프로필 사진의 파란 안경" },
  { id: "uniform", label: "프로필에서 군복 같은 옷을 입음" },
  { id: "grammar", label: "조금 어색한 한국어" },
];

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

const getScene = (caseId: CaseId, sceneId: SceneId): Scene => caseId === "ep01" ? scenes[sceneId as ElunSceneId] : romanceScenes[sceneId as RomanceSceneId];

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const typingDelay = (text: string, seed: number) => Math.min(2700, 720 + text.length * 31 + (seed % 5) * 115);

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [activeCaseId, setActiveCaseId] = useState<CaseId>("ep01");
  const [sceneId, setSceneId] = useState<SceneId>("start");
  const [turn, setTurn] = useState(0);
  const [phase, setPhase] = useState<Phase>("incoming");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [risk, setRisk] = useState(0);
  const [availableClues, setAvailableClues] = useState<string[]>([]);
  const [ending, setEnding] = useState<EndingGrade>("A");
  const [clueOpen, setClueOpen] = useState(false);
  const [foundClues, setFoundClues] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [infoEpisode, setInfoEpisode] = useState<(typeof episodes)[number] | null>(null);
  const [pendingTransfer, setPendingTransfer] = useState<Choice | null>(null);
  const [simulationConfirmed, setSimulationConfirmed] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const runRef = useRef(0);
  const messageId = useRef(1);

  const activeCase = caseProfiles[activeCaseId];
  const activeEndingCopy = activeCaseId === "ep01" ? endingCopy : romanceEndingCopy;
  const falseClueIds = activeCaseId === "ep01" ? ["photo", "grammar"] : ["uniform", "grammar"];
  const suspicion = foundClues.length;

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
    if (screen !== "chat") return;
    const currentRun = ++runRef.current;
    const scene = getScene(activeCaseId, sceneId);
    const deliver = async () => {
      setPhase("incoming");
      for (const incoming of scene.incoming) {
        const line = typeof incoming === "string" ? incoming : incoming.text ?? "사진을 보냈습니다.";
        setTyping(true);
        await wait(typingDelay(line, messageId.current));
        if (runRef.current !== currentRun) return;
        setTyping(false);
        setMessages((prev) => [...prev, { id: messageId.current++, from: "scammer", ...(typeof incoming === "string" ? { text: incoming } : incoming) }]);
        await wait(390 + (line.length % 4) * 90);
      }
      if (runRef.current === currentRun) {
        setAvailableClues((prev) => [...new Set([...prev, ...(scene.clues ?? [])])]);
        setPhase("choice");
      }
    };
    deliver();
    return () => { runRef.current += 1; };
  }, [activeCaseId, sceneId, screen]);

  const stats = useMemo(() => {
    const base = ending === "S" ? 94 : ending === "A" ? 82 : ending === "C" ? 64 : 31;
    return {
      survival: Math.max(18, Math.min(99, base + suspicion * 2 - risk * 2)),
      doubt: Math.min(99, 46 + suspicion * 9),
      wallet: ending === "F" ? 0 : 100,
      patience: Math.max(12, 91 - turn * 8),
    };
  }, [ending, risk, suspicion, turn]);

  const startCase = (caseId: CaseId) => {
    setActiveCaseId(caseId);
    setScreen("briefing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const enterChat = () => {
    runRef.current += 1;
    messageId.current = 1;
    setMessages([]);
    setSceneId(activeCase.start);
    setTurn(0);
    setPhase("incoming");
    setTyping(false);
    setRisk(0);
    setAvailableClues([]);
    setFoundClues([]);
    setEnding("A");
    setPendingTransfer(null);
    setPreviewImage(null);
    setSimulationConfirmed(false);
    setScreen("chat");
  };

  const addMessage = (from: Message["from"], text: string) => {
    setMessages((prev) => [...prev, { id: messageId.current++, from, text }]);
  };

  const finish = async (grade: EndingGrade, currentRisk: number) => {
    const resolved = grade === "A" && currentRisk >= 3 ? "C" : grade;
    await wait(620);
    addMessage("system", resolved === "S" ? `${activeCase.scammer}님을 차단했습니다.` : resolved === "F" ? "게임 속 가상 송금 처리가 끝났습니다. 실제 금전 거래는 없습니다." : `${activeCase.scammer}님이 대화방을 나갔습니다.`);
    await wait(780);
    addMessage("system", `CASE ${activeCase.no} 대화 기록 분석이 완료됐습니다.`);
    await wait(460);
    setEnding(resolved);
    setPhase("resolved");
  };

  const chooseReply = async (choice: Choice) => {
    if (phase !== "choice") return;
    setPhase("reply");
    addMessage("player", choice.text);
    const nextRisk = risk + (choice.risk ?? 0);
    setRisk(nextRisk);

    for (const line of choice.replies ?? []) {
      await wait(360);
      setTyping(true);
      await wait(typingDelay(line, messageId.current));
      setTyping(false);
      addMessage("scammer", line);
    }

    if (choice.ending) {
      await finish(choice.ending, nextRisk);
      return;
    }
    await wait(420);
    setTurn((prev) => prev + 1);
    setSceneId(choice.next);
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
    const moneyResult = ending === "F" ? `게임 속 가상금액 ${activeCase.virtualAmount}을 보내버렸습니다.` : `게임 속 가상금액 ${activeCase.virtualAmount}을 지켜냈습니다.`;
    const text = `《오늘의 사기꾼》 사기 생존력 ${stats.survival}점\n${moneyResult}\n${copy.shareLine}\n\n게임 시뮬레이션 · 실제 금전 거래 없음`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "오늘의 사기꾼 결과", text, url: window.location.origin });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${window.location.origin}`);
      setToast("결과와 게임 링크를 복사했습니다. 친구의 생존력을 확인하세요.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setToast("공유 창이 잠깐 숨었습니다. 다시 눌러주세요.");
    }
  };

  const openNextCase = () => {
    if (activeCaseId === "ep01") {
      startCase("ep06");
      return;
    }
    setInfoEpisode(episodes[1]);
    setScreen("home");
  };

  const sniffClue = (id: string) => {
    const clue = clueOptions.find((item) => item.id === id);
    if (!clue) return;
    if (foundClues.includes(id)) {
      setToast("이미 증거 봉투에 넣었습니다. 봉투가 빵빵합니다.");
      return;
    }
    if (availableClues.includes(id)) {
      setFoundClues((prev) => [...prev, id]);
      setToast(`의심력 +1 · “${clue.label}”`);
      setClueOpen(false);
    } else {
      const jokes: Record<string, string> = {
        photo: "파란 안경은 무죄입니다. 안경테는 송금하지 않습니다.",
        uniform: "옷만으로는 유죄가 아닙니다. 문제는 확인 불가한 신분과 돈 요구입니다.",
        grammar: "한국어가 서툰 것만으로 사기꾼은 아닙니다.",
      };
      setToast(jokes[id] ?? "아직 그 냄새는 나지 않습니다. 코를 아껴두세요.");
    }
  };

  const goHome = () => {
    runRef.current += 1;
    setClueOpen(false);
    setPendingTransfer(null);
    setPreviewImage(null);
    setScreen("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (screen === "briefing") {
    return (
      <main className={`briefing-screen case-${activeCase.no}`}>
        <img className="briefing-portrait" src={activeCase.portrait} alt={`${activeCase.scammer} 가상 캐릭터`} />
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
          <div className="case-tags"><span>{activeCase.type}</span><span>난이도 보통</span><span>엔딩 4개</span></div>
          <div className="mission-note"><span>MISSION</span><p>{activeCaseId === "ep01" ? "이 사람의 말이 어디서부터 이상한지 찾아내고, 가상 송금 전에 대화방을 빠져나오세요." : "느끼한 미소가 통관비 요구로 변하는 순간을 찾아내고, 가상 송금 전에 사건을 끝내세요."}</p></div>
          <button className="primary-game-button" onClick={enterChat}><span>메시지 열기</span><b>→</b></button>
          <p className="no-money-note">게임 속 가상금액만 사용합니다 · 실제 금전 거래 없음</p>
        </section>
      </main>
    );
  }

  if (screen === "chat") {
    const choices = getScene(activeCaseId, sceneId).choices;
    return (
      <main className="chat-shell">
        <header className="chat-header">
          <button className="chat-back" onClick={goHome} aria-label="게임 나가기">‹</button>
          <div className="tiny-avatar"><img src={activeCase.portrait} alt="" /><span className="online-dot" /></div>
          <div className="chat-person"><strong>{activeCase.scammer}</strong><span>{typing ? "입력 중…" : "온라인 · 번역기로 대화 중인 것 같음"}</span></div>
          <button className="sniff-button" onClick={() => setClueOpen(true)} aria-label="사기 냄새 단서 찾기"><span>🚨</span><b>사기 냄새</b><em>{suspicion}</em></button>
        </header>

        <div className="case-meter" aria-label={`현재 의심력 ${suspicion}`}><span>의심력</span><div><i style={{ width: `${Math.min(100, suspicion * 14.3)}%` }} /></div><b>{String(suspicion).padStart(2, "0")}</b></div>

        <section className="message-feed" ref={feedRef} aria-live="polite">
          <div className="chat-date"><span>오늘</span></div>
          <p className="secure-note"><strong>게임 시뮬레이션 · 실제 금전 거래 없음</strong><br />{activeCaseId === "ep01" ? "이 대화는 우주 보안 규정에 의해 전혀 보호되지 않습니다." : "이 대화는 작전 보안과 사랑의 힘으로 전혀 인증되지 않았습니다."}</p>
          {messages.map((message) => (
            <div className={`message-row ${message.from}`} key={message.id}>
              {message.from === "scammer" && <span className="bubble-avatar"><img src={activeCase.portrait} alt="" /></span>}
              <div className={`message-bubble${message.image ? " has-image" : ""}`}>
                {message.image && (
                  <button className="message-image-button" onClick={() => setPreviewImage({ src: message.image!, alt: message.alt ?? "전송된 이미지" })} aria-label="전송된 자격증 일러스트 크게 보기">
                    <img src={message.image} alt={message.alt ?? "전송된 이미지"} />
                    <span><b>GAME PROP</b> 눌러서 단서 확대하기</span>
                  </button>
                )}
                {message.text && <span className="message-text">{message.text}</span>}
              </div>
            </div>
          ))}
          {typing && (
            <div className="message-row scammer typing-row">
              <span className="bubble-avatar"><img src={activeCase.portrait} alt="" /></span>
              <div className="typing-bubble"><i /><i /><i /></div>
            </div>
          )}
        </section>

        <section className="reply-dock" aria-label="답변 선택">
          <div className="reply-label"><span>{phase === "choice" ? "뭐라고 답할까요?" : phase === "resolved" ? "사건이 종료되었습니다" : "상대가 입력 중입니다"}</span><b>CASE {activeCase.no} · TURN {String(turn + 1).padStart(2, "0")}</b></div>
          {phase === "choice" ? (
            <div className="choice-list">
              {choices.map((choice, index) => (
                <button key={choice.text} onClick={() => selectReply(choice)}><span>{String.fromCharCode(65 + index)}</span>{choice.text}</button>
              ))}
            </div>
          ) : phase === "resolved" ? (
            <div className="resolution-dock">
              <div><span>대화 종료</span><strong>결과 카드가 도착했습니다.</strong></div>
              <button onClick={() => setScreen("ending")}>내 사기 생존력 확인하기 <b>→</b></button>
            </div>
          ) : (
            <div className="waiting-bar"><i /><span>잠시만요. 그럴듯한 말을 조립하고 있습니다.</span></div>
          )}
        </section>

        {clueOpen && (
          <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setClueOpen(false); }}>
            <section className="clue-sheet" role="dialog" aria-modal="true" aria-labelledby="clue-title">
              <div className="sheet-grip" />
              <div className="clue-heading"><div><span>현장 채증</span><h2 id="clue-title">뭐가 찜찜했나요?</h2></div><button onClick={() => setClueOpen(false)} aria-label="닫기">×</button></div>
              <p>지금까지 대화에서 냄새난 장면을 증거 봉투에 넣으세요.</p>
              <div className="clue-grid">
                {clueOptions.filter((clue) => availableClues.includes(clue.id) || falseClueIds.includes(clue.id)).map((clue) => <button className={foundClues.includes(clue.id) ? "found" : ""} key={clue.id} onClick={() => sniffClue(clue.id)}><span>{foundClues.includes(clue.id) ? "✓" : "?"}</span>{clue.label}</button>)}
              </div>
            </section>
          </div>
        )}
        {pendingTransfer && (
          <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingTransfer(null); }}>
            <section className="simulation-sheet" role="dialog" aria-modal="true" aria-labelledby="simulation-title">
              <span>SIMULATION CHECK</span>
              <h2 id="simulation-title">게임 속 시뮬레이션입니다.</h2>
              <p>실제 돈은 사용되지 않습니다. 이 선택은 이야기의 결과에만 영향을 줍니다.</p>
              <div className="virtual-receipt"><span>가상 송금액</span><strong>{activeCase.virtualAmount}</strong><small>실제 결제 0원</small></div>
              <button className="confirm-simulation" onClick={confirmVirtualTransfer}>가상 송금 선택 계속하기</button>
              <button className="cancel-simulation" onClick={() => setPendingTransfer(null)}>대화로 돌아가기</button>
            </section>
          </div>
        )}
        {previewImage && (
          <div className="modal-backdrop image-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewImage(null); }}>
            <section className="evidence-preview" role="dialog" aria-modal="true" aria-labelledby="evidence-preview-title">
              <div className="evidence-preview-head"><div><span>전송된 파일 · 게임 소품</span><h2 id="evidence-preview-title">자격증 이미지(?)</h2></div><button onClick={() => setPreviewImage(null)} aria-label="이미지 닫기">×</button></div>
              <img src={previewImage.src} alt={previewImage.alt} />
              <p><strong>GAME PROP · 실제 자격증 아님</strong><br />기관명, 철자, 날짜가 어딘가 이상합니다. 그럴듯한 이미지도 공식 확인을 대신할 수 없어요.</p>
            </section>
          </div>
        )}
        {toast && <div className="game-toast" role="status">{toast}</div>}
      </main>
    );
  }

  if (screen === "ending") {
    const copy = activeEndingCopy[ending];
    const moneyResult = ending === "F" ? `게임 속 가상금액 ${activeCase.virtualAmount}을 보내버렸습니다.` : `게임 속 가상금액 ${activeCase.virtualAmount}을 지켜냈습니다.`;
    const nextCase = activeCaseId === "ep01"
      ? { no: "06", mark: "♥", type: "로맨스스캠", title: "해외 파병 군의관", line: "사랑은 국경 없고 통관료는 있습니다." }
      : { no: "02", mark: "엄", type: "가족·지인 사칭", title: "엄마 나 폰 고장났어", line: "말투도 함께 고장난 새 번호가 접수됐습니다." };
    return (
      <main className={`ending-screen grade-${ending.toLowerCase()}`}>
        <div className="ending-noise" />
        <section className="result-card">
          <div className="result-stamp"><small>CASE CLOSED</small><strong>{ending}</strong><span>RANK</span></div>
          <p className="ending-kicker">{copy.kicker}</p>
          <h1>{copy.title}</h1>
          <p className="ending-body">{copy.body}</p>
          <div className="survival-score"><span>사기 생존력</span><strong>{stats.survival}</strong><em>/100</em></div>
          <div className="stat-list">
            <div><span>의심 안테나</span><i><b style={{ width: `${stats.doubt}%` }} /></i><em>{stats.doubt}</em></div>
            <div><span>지갑 방어력</span><i><b style={{ width: `${stats.wallet}%` }} /></i><em>{stats.wallet}</em></div>
            <div><span>헛소리 내성</span><i><b style={{ width: `${stats.patience}%` }} /></i><em>{stats.patience}</em></div>
          </div>
          <div className="evidence-summary"><span>수집한 사기 냄새</span><strong>{suspicion} / {activeCase.clueTotal}</strong></div>
          <section className="tactic-recap" aria-labelledby="tactic-title">
            <span>방금 당할 뻔한 수법</span>
            <h2 id="tactic-title">{activeCase.tactic}</h2>
          </section>

          <section className="share-card" aria-label="공유할 결과">
            <span>오늘의 생존 보고서</span>
            <strong>사기 생존력 {stats.survival}점</strong>
            <p>{moneyResult}<br />{copy.shareLine}</p>
            <small>게임 시뮬레이션 · 실제 금전 거래 없음</small>
          </section>
          <button className="share-button" onClick={shareResult}><span>친구도 살아남는지 보내보기</span><b>↗</b></button>

          <section className="next-case-panel" aria-labelledby="next-case-title">
            <div className="next-case-signal"><span>NEW SIGNAL</span><b>CASE {nextCase.no}</b></div>
            <div className="next-case-content"><div className="next-case-mark">{nextCase.mark}</div><div><small>{nextCase.type}</small><h2 id="next-case-title">{nextCase.title}</h2><p>{nextCase.line}</p></div></div>
            <button onClick={openNextCase}><span>사건파일 열기</span><b>→</b></button>
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
      <header className="game-brand">
        <div className="eyebrow"><span>SCAMMER ARCHIVE</span><b>SEASON 01</b></div>
        <h1><span>오늘의</span> 사기꾼</h1>
        <p>메시지가 도착했습니다.<br />누구 말부터 의심해볼까요?</p>
      </header>

      <section className="roster" aria-labelledby="roster-heading">
        <div className="roster-heading"><div><span>NOW ONLINE</span><h2 id="roster-heading">현재 접속한 상대</h2></div><p><i /> 2명</p></div>
        <article className="featured-case" style={{ "--accent": episodes[0].accent } as React.CSSProperties}>
          <img className="featured-portrait" src="/scammer-01.png" alt="파란 안경을 쓴 가상의 유명인 사칭범" />
          <div className="featured-shade" aria-hidden="true" />
          <div className="featured-status"><span><i /> LIVE</span><b>CASE 01</b></div>
          <div className="featured-copy"><span className="type-chip">유명인 사칭 · 공식 아님</span><h3>억만장자가<br />20만원이 없대요</h3><p>“지갑은 분실. 자신감은 보유 중.”</p><div className="suspect-name"><span>상대</span><strong>일런 모스크바</strong><em>ELUN MOSKVA</em></div></div>
          <button onClick={() => startCase("ep01")} aria-label="케이스 01 플레이"><span>상대하기</span><b>→</b></button>
        </article>

        <div className="next-up"><div><span>CASE FILES</span><h2>다른 사건파일</h2></div><b>14 CASES</b></div>
        <div className="episode-grid">
          {episodes.slice(1).map((episode) => (
            <button className={`episode-card ${episode.no === "06" ? "live" : ""}`} key={episode.no} style={{ "--accent": episode.accent } as React.CSSProperties} onClick={() => episode.no === "06" ? startCase("ep06") : setInfoEpisode(episode)}>
              <div className={`episode-visual ${episode.no === "06" ? "has-portrait" : ""}`}>{episode.no === "06" && <img src="/scammer-06.png" alt="" loading="lazy" decoding="async" />}<span>{episode.no === "06" ? "" : episode.mark}</span><b>{episode.no}</b></div>
              <div className="episode-meta"><span>{episode.type}</span><em>{episode.no === "06" ? "PLAY NOW" : "COMING SOON"}</em></div>
              <h3>{episode.name}</h3>
              <p>{episode.line}</p>
              <small>{episode.scammer}</small>
            </button>
          ))}
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
