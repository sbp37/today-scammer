"use client";

import { useEffect, useMemo, useState } from "react";
import "./ops.css";

type SeriesRow = { date: string; visits: number; visitors: number; starts: number; clears: number };
type CaseRow = { start: number; clear: number };
type RecentEvent = { t: number; name: string; source: string; caseId?: string };

type StatsPayload = {
  ok: boolean;
  error?: string;
  needPassword?: boolean;
  today?: string;
  storage?: "kv" | "memory";
  todayStats?: {
    visits: number;
    visitors: number;
    briefing: number;
    ending: number;
    sources: Record<string, number>;
  } | null;
  series?: SeriesRow[];
  weekSources?: Record<string, number>;
  weekCases?: Record<string, CaseRow>;
  recent?: RecentEvent[];
};

const caseLabel: Record<string, string> = {
  ep01: "01 억만장자",
  ep02: "02 소개팅",
  ep03: "03 검사",
  ep04: "04 코인",
  ep06: "06 군의관",
  ep07: "07 연예인",
};

const eventLabel: Record<string, string> = {
  visit: "방문",
  case_start: "사건 시작",
  case_clear: "엔딩",
};

export function OpsView() {
  const [password, setPassword] = useState("");
  const [data, setData] = useState<StatsPayload | null>(null);
  const [status, setStatus] = useState<"loading" | "login" | "ready" | "setup">("loading");
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/stats", { cache: "no-store" });
    const payload = (await response.json()) as StatsPayload;
    if (response.status === 401 && payload.needPassword) {
      setStatus("setup");
      setData(payload);
      return;
    }
    if (!response.ok) {
      setStatus("login");
      setData(payload);
      return;
    }
    setData(payload);
    setStatus("ready");
  }

  useEffect(() => {
    void load();
  }, []);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/stats", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const payload = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok) {
      setError(payload.error || "로그인 실패");
      return;
    }
    await load();
  }

  const maxVisits = useMemo(() => Math.max(1, ...(data?.series ?? []).map((row) => row.visits)), [data]);

  if (status === "loading") {
    return (
      <main className="ops-shell">
        <p className="ops-muted">불러오는 중...</p>
      </main>
    );
  }

  if (status === "setup") {
    return (
      <main className="ops-shell">
        <h1>운영 페이지</h1>
        <p>Vercel 환경변수에 `OPS_PASSWORD`를 넣고 다시 배포하세요.</p>
        <p className="ops-muted">숫자는 `KV_REST_API_URL` / `KV_REST_API_TOKEN`이 있어야 서버가 재시작돼도 납니다. Vercel → Storage → KV 생성하면 자동으로 들어갑니다.</p>
      </main>
    );
  }

  if (status === "login") {
    return (
      <main className="ops-shell">
        <h1>오늘의 사기꾼 운영</h1>
        <form className="ops-login" onSubmit={login}>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="OPS_PASSWORD" autoFocus />
          <button type="submit">들어가기</button>
        </form>
        {error ? <p className="ops-error">{error}</p> : null}
      </main>
    );
  }

  const today = data?.todayStats;
  const sources = Object.entries(data?.weekSources ?? {}).sort((a, b) => b[1] - a[1]);
  const cases = Object.entries(data?.weekCases ?? {}).sort((a, b) => b[1].start - a[1].start);

  return (
    <main className="ops-shell">
      <header className="ops-head">
        <div>
          <p className="ops-kicker">{data?.today} · KST</p>
          <h1>웹 유입</h1>
        </div>
        <button type="button" onClick={() => void load()}>새로고침</button>
      </header>

      {data?.storage === "memory" ? (
        <p className="ops-warn">지금은 서버 메모리에만 쌓입니다. Vercel KV를 연결하면 날짜별로 납니다.</p>
      ) : (
        <p className="ops-ok">KV 저장 중 · 날짜별 유지</p>
      )}

      <section className="ops-grid">
        <article><b>{today?.visitors ?? 0}</b><span>오늘 방문자</span></article>
        <article><b>{today?.visits ?? 0}</b><span>오늘 방문</span></article>
        <article><b>{today?.briefing ?? 0}</b><span>사건 시작</span></article>
        <article><b>{today?.ending ?? 0}</b><span>엔딩</span></article>
      </section>

      <section className="ops-card">
        <h2>최근 7일 방문</h2>
        <div className="ops-bars">
          {(data?.series ?? []).map((row) => (
            <div key={row.date} className="ops-bar">
              <i style={{ height: `${Math.round((row.visits / maxVisits) * 72) + 4}px` }} />
              <em>{row.visits}</em>
              <span>{row.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="ops-split">
        <article className="ops-card">
          <h2>7일 유입</h2>
          {sources.length === 0 ? <p className="ops-muted">아직 없음</p> : (
            <ul>
              {sources.map(([source, count]) => (
                <li key={source}><span>{source}</span><b>{count}</b></li>
              ))}
            </ul>
          )}
        </article>
        <article className="ops-card">
          <h2>7일 사건</h2>
          {cases.length === 0 ? <p className="ops-muted">아직 없음</p> : (
            <ul>
              {cases.map(([id, row]) => (
                <li key={id}><span>{caseLabel[id] ?? id}</span><b>{row.start} → {row.clear}</b></li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="ops-card">
        <h2>최근 이벤트</h2>
        <ul className="ops-recent">
          {(data?.recent ?? []).map((event, index) => (
            <li key={`${event.t}-${index}`}>
              <span>{eventLabel[event.name] ?? event.name}</span>
              <span>{event.source}{event.caseId ? ` · ${caseLabel[event.caseId] ?? event.caseId}` : ""}</span>
              <em>{new Date(event.t).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</em>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
