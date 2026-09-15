export type TrackEventName = "visit" | "case_start" | "case_clear";

export type TrackPayload = {
  name: TrackEventName;
  caseId?: string;
  source?: string;
};

const SESSION_KEY = "today-scammer:session-id";
const VISIT_KEY = "today-scammer:visit-sent";

export function getSessionId() {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return "anon";
  }
}

export function classifySource(href = window.location.href, referrer = document.referrer) {
  const url = new URL(href, window.location.origin);
  const utm = (url.searchParams.get("utm_source") || url.searchParams.get("source") || "").toLowerCase();
  const ref = referrer.toLowerCase();

  if (utm.includes("thread") || ref.includes("threads.net") || ref.includes("threads.com")) return "threads";
  if (utm.includes("insta") || ref.includes("instagram.com")) return "instagram";
  if (utm.includes("toss") || ref.includes("toss.im") || ref.includes("minion.toss")) return "toss";
  if (utm.includes("play") || ref.includes("play.google")) return "play";
  if (utm) return utm.slice(0, 24);
  if (!referrer) return "direct";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "").slice(0, 32);
  } catch {
    return "other";
  }
}

export function trackEvent(payload: TrackPayload) {
  if (typeof window === "undefined") return;
  const body = {
    name: payload.name,
    caseId: payload.caseId,
    source: payload.source || classifySource(),
    sessionId: getSessionId(),
    path: window.location.pathname,
  };
  const json = JSON.stringify(body);
  if (navigator.sendBeacon) {
    const blob = new Blob([json], { type: "application/json" });
    if (navigator.sendBeacon("/api/collect", blob)) return;
  }
  void fetch("/api/collect", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: json,
    keepalive: true,
  }).catch(() => {
    // 집계 실패해도 게임은 그대로 진행합니다.
  });
}

export function trackVisitOnce() {
  try {
    if (window.sessionStorage.getItem(VISIT_KEY) === "1") return;
    window.sessionStorage.setItem(VISIT_KEY, "1");
  } catch {
    // 세션 저장을 못 해도 한 번은 보냅니다.
  }
  trackEvent({ name: "visit" });
}
