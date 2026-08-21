"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Screen = "home" | "briefing" | "chat" | "ending";
type Phase = "incoming" | "choice" | "reply";
type EndingGrade = "S" | "A" | "C" | "F";

type Message = {
  id: number;
  from: "scammer" | "player" | "system";
  text: string;
};

type Choice = {
  text: string;
  replies: string[];
  risk?: number;
  ending?: EndingGrade;
};

type Scene = {
  incoming: string[];
  choices: Choice[];
};

const episodes = [
  { no: "01", mark: "EM", name: "억만장자가 20만원이 없대요", scammer: "일런 무스크", type: "유명인 사칭", line: "유명인의 비밀 초대, 입장료는 20만원", accent: "#ff4e29", live: true },
  { no: "02", mark: "엄", name: "엄마 나 폰 고장났어", scammer: "엄마(새 번호)", type: "가족·지인 사칭", line: "말투도 고장난 새 휴대폰", accent: "#9eff00" },
  { no: "03", mark: "檢", name: "검사님이 내 통장을 걱정한다", scammer: "서울중앙 김검사", type: "기관 사칭", line: "내 잔고에 누구보다 진심인 공무원", accent: "#00d9ff" },
  { no: "04", mark: "₿", name: "인생역전 코인 선생님", scammer: "차트도사 불기둥", type: "투자사기", line: "손실은 경험, 수익은 곧 예정", accent: "#ffd600" },
  { no: "05", mark: "BOX", name: "택배가 왔는데 내가 시킨 게 없다", scammer: "행복택배 11팀", type: "스미싱", line: "상자는 없고 링크만 도착함", accent: "#bd7cff" },
  { no: "06", mark: "♥", name: "해외 파병 군의관", scammer: "Dr. 제임스 최", type: "로맨스스캠", line: "사랑은 국경 없고 통관료는 있음", accent: "#ff5c93" },
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

const scenes: Scene[] = [
  {
    incoming: [
      "안녕하세요. 저는 세계적으로 유명한 테크 기업 CEO Elun Moosk 입니다.",
      "현재 한국에 비밀 일정으로 와 있습니다.",
      "제 팀이 공개 프로필을 보고 비공개 프로젝트의 한국 멤버 후보로 당신을 추천했습니다.",
    ],
    choices: [
      { text: "제 프로필은 고양이 사진뿐인데요.", replies: ["그 사진의 반응과 관심사를 분석했습니다. 고양이는 화성 이주 적합도도 높습니다."], risk: 0 },
      { text: "저를 왜 골랐죠?", replies: ["제 보안 알고리즘이 한국에서 가장 신뢰할 수 있는 사람으로 당신을 추천했습니다.", "코드명은 TRUST-KOREA-2026 입니다."], risk: 0 },
      { text: "진짜 그 CEO 맞아요?", replies: ["제 법적 이름은 Elun Reeve Moosk 입니다. 공식 계정과 철자가 다른 것은 보안을 위해서입니다."], risk: 0 },
      { text: "비밀 프로젝트라니 영광인데요.", replies: ["짧게 대화했지만 당신은 다른 사람과 다릅니다. 아주 특별합니다."], risk: 1 },
    ],
  },
  {
    incoming: [
      "후보는 20명뿐입니다. 외부에 알려지면 초대가 취소되니 아직 누구에게도 말하지 마세요.",
      "확인되면 MARS COIN 비공개 베타 화면을 먼저 보여드리겠습니다.",
    ],
    choices: [
      { text: "영상통화로 본인 확인부터 하죠.", replies: ["현재 국제 우주 보안 규정 때문에 영상통화가 불가능합니다.", "한국도 우주의 일부입니다."], risk: 0 },
      { text: "오늘 날짜를 적은 사진 보내요.", replies: ["카메라가 보안 업데이트 중입니다. 셀카 기능은 72시간 뒤 복구됩니다.", "대신 제 진심을 믿어주세요."], risk: 0 },
      { text: "일단 전용 메신저로 옮길게요.", replies: ["좋습니다. 기록이 남지 않는 채널이 서로에게 안전합니다."], risk: 1 },
      { text: "여기까지. 우주로 차단합니다.", replies: ["잠깐, 화성 와이파이가—"], ending: "S" },
    ],
  },
  {
    incoming: [
      "참가 확인에는 5만원의 테스트 보증금이 필요합니다. 승인되면 즉시 환불됩니다.",
      "한국 결제팀 계정이 잠겨 있어서 제 현지 매니저 개인 계좌로만 처리됩니다.",
    ],
    choices: [
      { text: "억만장자가 5만원이 없어요?", replies: ["자산과 현금은 다릅니다. 회사 자금은 화성 계정에 있습니다."], risk: 0 },
      { text: "공식 회사 명의 청구서를 주세요.", replies: ["비공개 베타라 공개 회사 서류를 쓰면 비밀이 공개됩니다. 이것은 보안입니다."], risk: 0 },
      { text: "계좌번호만 확인해볼게요.", replies: ["예금주는 제 한국 파트너입니다. 유명인의 계좌는 유명해서 사용할 수 없습니다."], risk: 1 },
      { text: "그럼 저한테 30만원 먼저 보내세요.", replies: ["저도 지금 현금이 없고 당신도 저를 믿지 않습니다.", "억만장자 둘이서 서로 돈이 없네요."], risk: 0 },
    ],
  },
  {
    incoming: [
      "먼저 초대 링크에서 휴대폰 번호와 문자로 받은 6자리 코드를 입력하세요.",
      "mars-founder-pass.com/kr-invite",
    ],
    choices: [
      { text: "문자 인증번호까지 왜 필요하죠?", replies: ["투자자가 사람인지 확인하는 국제 절차입니다. 로봇은 MARS COIN을 살 수 없습니다."], risk: 0 },
      { text: "공식 사이트에서 직접 찾을게요.", replies: ["공식 사이트는 모두에게 보입니다. 비공개 링크는 검색되지 않는 것이 정상입니다."], risk: 0 },
      { text: "[가상] 링크를 열고 번호를 입력한다", replies: ["인증 성공. 자물쇠 이모지도 있습니다. 🔒", "지금 화면에 예상 수익이 표시될 것입니다."], risk: 3 },
      { text: "링크째 신고하고 나갈게요.", replies: ["신고는 우주 조약상 시차가—"], ending: "A" },
    ],
  },
  {
    incoming: [
      "테스트 보증금 5만원이 18만4천원으로 상승한 화면이 보입니까? 이것이 베타 수익입니다.",
      "출금 잠금을 풀려면 남은 보증금 15만원을 한 번만 더 인증해야 합니다.",
    ],
    choices: [
      { text: "화면 속 숫자가 실제 돈이라는 증거는요?", replies: ["서버에 표시된 숫자는 서버가 보증합니다. 서버는 거짓말을 배운 적이 없습니다."], risk: 0 },
      { text: "5만원만 먼저 보냈다고 가정할게요.", replies: ["좋습니다. 수익이 확인됐으니 이제 15만원만 보내면 출금됩니다.", "여기서 멈추면 앞의 5만원과 수익이 함께 잠깁니다."], risk: 2 },
      { text: "출금부터 되면 다음 돈을 보내죠.", replies: ["시스템상 출금 전에 출금 잠금 해제 비용이 필요합니다. 매우 출금적인 절차입니다."], risk: 0 },
      { text: "은행과 공식 고객센터에 확인할게요.", replies: ["그들은 비공개 프로젝트를 몰라서 무조건 사기라고 할 것입니다."], risk: 0 },
    ],
  },
  {
    incoming: [
      "기회는 7분 뒤 종료됩니다. 지금 취소하면 초대 기록과 테스트 금액이 모두 사라집니다.",
      "우리 대화는 비밀입니다. 가족이나 은행에 말하면 보안 자격이 취소됩니다.",
    ],
    choices: [
      { text: "[가상] 남은 15만원을 보낸다", replies: ["총 20만원 확인. 출금에는 국제 세금 12만9천원이 추가로 필요합니다.", "그리고 저는 잠시 대화방을 나갑니다."], ending: "F" },
      { text: "가족한테 이 대화부터 보여줄게요.", replies: ["가족은 화성 금융을 잘 모릅니다. 하지만 당신의 지갑은 지켰습니다."], ending: "A" },
      { text: "공식 계정과 은행에 확인했습니다.", replies: ["현재 프로젝트가 갑자기 취소됐습니다. 아주 갑자기요."], ending: "A" },
      { text: "20만원 대신 로켓 이모지 보냅니다 🚀", replies: ["이모지는 현금화가 어렵습니다. 오늘 처음 알았습니다."], ending: "A" },
    ],
  },
];

const clueOptions = [
  { id: "dm", label: "유명인이 갑자기 개인 DM", at: 0 },
  { id: "fast", label: "비밀 초대와 빠른 친밀감", at: 1 },
  { id: "video", label: "영상통화 회피", at: 1 },
  { id: "money", label: "개인 계좌로 테스트 입금", at: 2 },
  { id: "link", label: "외부 링크와 인증번호 요구", at: 3 },
  { id: "profit", label: "화면으로만 보이는 고수익", at: 4 },
  { id: "rush", label: "비밀 유지와 7분 압박", at: 5 },
  { id: "photo", label: "프로필 사진의 파란 안경", at: 99 },
  { id: "grammar", label: "문장에 마침표가 많음", at: 99 },
];

const endingCopy: Record<EndingGrade, { title: string; kicker: string; body: string }> = {
  S: { title: "궤도 밖 차단", kicker: "초기 간파 · 무피해", body: "일런 무스크는 아직 우주 보안 규정을 설명 중이지만, 당신의 대화방에는 산소가 없습니다." },
  A: { title: "지갑 무사 귀환", kicker: "긴 대화 · 송금 없음", body: "대화는 조금 길었지만 돈과 정보는 지켰습니다. 일런 무스크는 다른 행성으로 영업지를 옮겼습니다." },
  C: { title: "링크 앞 급정거", kicker: "아슬아슬 탈출", body: "개인정보 성층권까지 올라갔다가 무사히 귀환했습니다. 다음에는 링크보다 먼저 의심 버튼을 누르세요." },
  F: { title: "가상 20만원 증발", kicker: "소액 테스트 → 추가 입금", body: "당신 탓이 아닙니다. 화면 속 가짜 수익으로 다음 송금을 재촉한 사람이 이상한 겁니다. 현실 피해는 0원입니다." },
};

const scamSteps = [
  { step: "01 접근", title: "공개 프로필로 맞춤 DM", body: "취향과 게시물을 훑고, 내가 선택받은 것처럼 말을 겁니다." },
  { step: "02 신뢰", title: "비밀 초대와 소액 테스트", body: "검증은 피하면서 작은 금액부터 보내게 해 경계심을 낮춥니다." },
  { step: "03 증액", title: "가짜 수익 뒤 추가 입금", body: "화면에 수익을 띄운 뒤 출금·세금 명목으로 계속 돈을 요구합니다." },
];

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const typingDelay = (text: string, seed: number) => Math.min(2700, 720 + text.length * 31 + (seed % 5) * 115);

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [sceneIndex, setSceneIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("incoming");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [risk, setRisk] = useState(0);
  const [evidenceStage, setEvidenceStage] = useState(-1);
  const [ending, setEnding] = useState<EndingGrade>("A");
  const [clueOpen, setClueOpen] = useState(false);
  const [foundClues, setFoundClues] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [infoEpisode, setInfoEpisode] = useState<(typeof episodes)[number] | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const runRef = useRef(0);
  const messageId = useRef(1);

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
    const deliver = async () => {
      setPhase("incoming");
      for (const line of scenes[sceneIndex].incoming) {
        setTyping(true);
        await wait(typingDelay(line, messageId.current));
        if (runRef.current !== currentRun) return;
        setTyping(false);
        setMessages((prev) => [...prev, { id: messageId.current++, from: "scammer", text: line }]);
        await wait(390 + (line.length % 4) * 90);
      }
      if (runRef.current === currentRun) {
        setEvidenceStage(sceneIndex);
        setPhase("choice");
      }
    };
    deliver();
    return () => { runRef.current += 1; };
  }, [sceneIndex, screen]);

  const stats = useMemo(() => {
    const base = ending === "S" ? 94 : ending === "A" ? 82 : ending === "C" ? 64 : 31;
    return {
      survival: Math.max(18, Math.min(99, base + suspicion * 2 - risk * 2)),
      doubt: Math.min(99, 46 + suspicion * 9),
      wallet: ending === "F" ? 0 : 100,
      patience: Math.max(12, 91 - sceneIndex * 11),
    };
  }, [ending, risk, sceneIndex, suspicion]);

  const startCase = () => setScreen("briefing");

  const enterChat = () => {
    runRef.current += 1;
    messageId.current = 1;
    setMessages([]);
    setSceneIndex(0);
    setPhase("incoming");
    setTyping(false);
    setRisk(0);
    setEvidenceStage(-1);
    setFoundClues([]);
    setEnding("A");
    setScreen("chat");
  };

  const addMessage = (from: Message["from"], text: string) => {
    setMessages((prev) => [...prev, { id: messageId.current++, from, text }]);
  };

  const finish = (grade: EndingGrade, currentRisk: number) => {
    const resolved = grade === "A" && currentRisk >= 3 ? "C" : grade;
    setEnding(resolved);
    window.setTimeout(() => setScreen("ending"), 680);
  };

  const chooseReply = async (choice: Choice) => {
    if (phase !== "choice") return;
    setPhase("reply");
    addMessage("player", choice.text);
    const nextRisk = risk + (choice.risk ?? 0);
    setRisk(nextRisk);

    for (const line of choice.replies) {
      await wait(360);
      setTyping(true);
      await wait(typingDelay(line, messageId.current));
      setTyping(false);
      addMessage("scammer", line);
    }

    if (choice.ending) {
      finish(choice.ending, nextRisk);
      return;
    }
    await wait(420);
    setSceneIndex((prev) => prev + 1);
  };

  const sniffClue = (id: string) => {
    const clue = clueOptions.find((item) => item.id === id);
    if (!clue) return;
    if (foundClues.includes(id)) {
      setToast("이미 증거 봉투에 넣었습니다. 봉투가 빵빵합니다.");
      return;
    }
    if (clue.at <= evidenceStage) {
      setFoundClues((prev) => [...prev, id]);
      setToast(`의심력 +1 · “${clue.label}”`);
      setClueOpen(false);
    } else {
      const jokes: Record<string, string> = {
        photo: "파란 안경은 무죄입니다. 안경테는 송금하지 않습니다.",
        grammar: "마침표는 범행 도구가 아닙니다.",
      };
      setToast(jokes[id] ?? "아직 그 냄새는 나지 않습니다. 코를 아껴두세요.");
    }
  };

  const goHome = () => {
    runRef.current += 1;
    setClueOpen(false);
    setScreen("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (screen === "briefing") {
    return (
      <main className="briefing-screen">
        <img className="briefing-portrait" src="/scammer-01.png" alt="과장된 선글라스를 쓴 가상의 유명인 사칭범 일런 무스크" />
        <div className="briefing-shade" aria-hidden="true" />
        <header className="briefing-nav">
          <button className="plain-back" onClick={goHome} aria-label="에피소드 목록으로">← 돌아가기</button>
          <span><i /> 접속 중</span>
        </header>
        <section className="briefing-card">
          <div className="briefing-topline"><span>CASE 01 · 공식 아님</span><span>5분 내외</span></div>
          <p className="briefing-label">오늘의 상대</p>
          <h1>일런 무스크</h1>
          <p className="suspect-alias">ELUN MOOSK · World Famous Tech CEO(?)</p>
          <p className="briefing-title">억만장자가 20만원이 없대요</p>
          <div className="case-tags"><span>유명인 사칭</span><span>난이도 보통</span><span>엔딩 4개</span></div>
          <div className="mission-note"><span>MISSION</span><p>이 사람의 말이 어디서부터 이상한지 찾아내고, 송금 전에 대화방을 빠져나오세요.</p></div>
          <button className="primary-game-button" onClick={enterChat}><span>메시지 열기</span><b>→</b></button>
          <p className="no-money-note">실제 돈과 개인정보는 사용하지 않습니다.</p>
        </section>
      </main>
    );
  }

  if (screen === "chat") {
    const choices = scenes[sceneIndex]?.choices ?? [];
    return (
      <main className="chat-shell">
        <header className="chat-header">
          <button className="chat-back" onClick={goHome} aria-label="게임 나가기">‹</button>
          <div className="tiny-avatar"><img src="/scammer-01.png" alt="" /><span className="online-dot" /></div>
          <div className="chat-person"><strong>일런 무스크</strong><span>{typing ? "입력 중…" : "온라인 · 번역기로 대화 중인 것 같음"}</span></div>
          <button className="sniff-button" onClick={() => setClueOpen(true)} aria-label="사기 냄새 단서 찾기"><span>🚨</span><b>사기 냄새</b><em>{suspicion}</em></button>
        </header>

        <div className="case-meter" aria-label={`현재 의심력 ${suspicion}`}><span>의심력</span><div><i style={{ width: `${Math.min(100, suspicion * 14.3)}%` }} /></div><b>{String(suspicion).padStart(2, "0")}</b></div>

        <section className="message-feed" ref={feedRef} aria-live="polite">
          <div className="chat-date"><span>오늘</span></div>
          <p className="secure-note">이 대화는 우주 보안 규정에 의해<br />전혀 보호되지 않습니다.</p>
          {messages.map((message) => (
            <div className={`message-row ${message.from}`} key={message.id}>
              {message.from === "scammer" && <span className="bubble-avatar"><img src="/scammer-01.png" alt="" /></span>}
              <div className="message-bubble">{message.text}</div>
            </div>
          ))}
          {typing && (
            <div className="message-row scammer typing-row">
              <span className="bubble-avatar"><img src="/scammer-01.png" alt="" /></span>
              <div className="typing-bubble"><i /><i /><i /></div>
            </div>
          )}
        </section>

        <section className="reply-dock" aria-label="답변 선택">
          <div className="reply-label"><span>{phase === "choice" ? "뭐라고 답할까요?" : "상대가 입력 중입니다"}</span><b>CASE {String(sceneIndex + 1).padStart(2, "0")}/{String(scenes.length).padStart(2, "0")}</b></div>
          {phase === "choice" ? (
            <div className="choice-list">
              {choices.map((choice, index) => (
                <button key={choice.text} onClick={() => chooseReply(choice)}><span>{String.fromCharCode(65 + index)}</span>{choice.text}</button>
              ))}
            </div>
          ) : (
            <div className="waiting-bar"><i /><span>잠시만요. 그럴듯한 말을 조립하고 있습니다.</span></div>
          )}
        </section>

        {clueOpen && (
          <div className="modal-backdrop" role="presentation" onMouseDown={() => setClueOpen(false)}>
            <section className="clue-sheet" role="dialog" aria-modal="true" aria-labelledby="clue-title" onMouseDown={(e) => e.stopPropagation()}>
              <div className="sheet-grip" />
              <div className="clue-heading"><div><span>현장 채증</span><h2 id="clue-title">뭐가 찜찜했나요?</h2></div><button onClick={() => setClueOpen(false)} aria-label="닫기">×</button></div>
              <p>지금까지 대화에서 냄새난 장면을 증거 봉투에 넣으세요.</p>
              <div className="clue-grid">
                {clueOptions.filter((clue) => clue.at <= evidenceStage || clue.at === 99).map((clue) => <button className={foundClues.includes(clue.id) ? "found" : ""} key={clue.id} onClick={() => sniffClue(clue.id)}><span>{foundClues.includes(clue.id) ? "✓" : "?"}</span>{clue.label}</button>)}
              </div>
            </section>
          </div>
        )}
        {toast && <div className="game-toast" role="status">{toast}</div>}
      </main>
    );
  }

  if (screen === "ending") {
    const copy = endingCopy[ending];
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
          <div className="evidence-summary"><span>수집한 사기 냄새</span><strong>{suspicion} / 7</strong></div>
          <section className="tactic-recap" aria-labelledby="tactic-title">
            <span>방금 당할 뻔한 수법</span>
            <h2 id="tactic-title">작게 믿게 하고, 크게 보내게 한다</h2>
            <div className="tactic-list">
              {scamSteps.map((item) => <div key={item.step}><em>{item.step}</em><strong>{item.title}</strong><p>{item.body}</p></div>)}
            </div>
          </section>
          <div className="result-actions"><button className="primary-game-button" onClick={enterChat}><span>다시 상대하기</span><b>↻</b></button><button className="secondary-game-button" onClick={goHome}>다른 사기꾼 보기</button></div>
          <p className="victim-note">※ 피해를 입는 건 누구의 잘못도 아닙니다. 이상한 건 사기꾼입니다.</p>
        </section>
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
        <div className="roster-heading"><div><span>NOW ONLINE</span><h2 id="roster-heading">현재 접속한 상대</h2></div><p><i /> 1명</p></div>
        <article className="featured-case" style={{ "--accent": episodes[0].accent } as React.CSSProperties}>
          <img className="featured-portrait" src="/scammer-01.png" alt="과장된 선글라스를 쓴 가상의 유명인 사칭범" />
          <div className="featured-shade" aria-hidden="true" />
          <div className="featured-status"><span><i /> LIVE</span><b>CASE 01</b></div>
          <div className="featured-copy"><span className="type-chip">유명인 사칭 · 공식 아님</span><h3>억만장자가<br />20만원이 없대요</h3><p>“유명인의 비밀 초대, 입장료는 20만원”</p><div className="suspect-name"><span>상대</span><strong>일런 무스크</strong><em>ELUN MOOSK</em></div></div>
          <button onClick={startCase} aria-label="케이스 01 플레이"><span>상대하기</span><b>→</b></button>
        </article>

        <div className="next-up"><div><span>UPCOMING</span><h2>다음에 올 메시지</h2></div><b>14 CASES</b></div>
        <div className="episode-grid">
          {episodes.slice(1).map((episode) => (
            <button className="episode-card" key={episode.no} style={{ "--accent": episode.accent } as React.CSSProperties} onClick={() => setInfoEpisode(episode)}>
              <div className="episode-visual"><span>{episode.mark}</span><b>{episode.no}</b></div>
              <div className="episode-meta"><span>{episode.type}</span><em>COMING SOON</em></div>
              <h3>{episode.name}</h3>
              <p>{episode.line}</p>
              <small>{episode.scammer}</small>
            </button>
          ))}
        </div>
      </section>

      <footer className="home-footer"><strong>의심은 빠르게, 송금은 없게.</strong><p>모든 대화와 피해는 가상입니다.<br />웃기는 건 사기꾼이지, 피해자가 아닙니다.</p></footer>

      {infoEpisode && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setInfoEpisode(null)}>
          <section className="soon-sheet" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()} style={{ "--accent": infoEpisode.accent } as React.CSSProperties}>
            <button className="soon-close" onClick={() => setInfoEpisode(null)} aria-label="닫기">×</button>
            <span>CASE {infoEpisode.no} · COMING SOON</span><div className="soon-mark">{infoEpisode.mark}</div><small>{infoEpisode.type}</small><h2>{infoEpisode.name}</h2><p>{infoEpisode.line}</p><div><span>상대</span><strong>{infoEpisode.scammer}</strong></div><button className="notify-fake" onClick={() => { setInfoEpisode(null); setToast("출시 알림은 마음속으로 예약됐습니다."); }}>조금만 기다리기</button>
          </section>
        </div>
      )}
      {toast && <div className="game-toast" role="status">{toast}</div>}
    </main>
  );
}
