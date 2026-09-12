export type SourceCounts = Record<string, number>;

export type DayStats = {
  visits: number;
  visitors: number;
  briefing: number;
  chat: number;
  ending: number;
  sources: SourceCounts;
  cases: Record<string, { start: number; clear: number }>;
  endings: Record<string, number>;
};

export type RecentEvent = {
  t: number;
  name: string;
  source: string;
  caseId?: string;
};

export type StatsState = {
  days: Record<string, DayStats>;
  recent: RecentEvent[];
  visitorKeys: Record<string, string[]>;
};

const STATE_KEY = "today-scammer:stats:v1";
const MAX_DAYS = 30;
const MAX_RECENT = 40;
const MAX_VISITOR_KEYS = 400;

type GlobalStore = { memory: StatsState | null };
const globalStore = globalThis as typeof globalThis & { __todayScammerStats?: GlobalStore };

function emptyDay(): DayStats {
  return {
    visits: 0,
    visitors: 0,
    briefing: 0,
    chat: 0,
    ending: 0,
    sources: {},
    cases: {},
    endings: {},
  };
}

function emptyState(): StatsState {
  return { days: {}, recent: [], visitorKeys: {} };
}

export function kstDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

function kvEnabled() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function kvGet(): Promise<StatsState | null> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const response = await fetch(`${url}/get/${encodeURIComponent(STATE_KEY)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { result?: string | StatsState | null };
  if (!payload.result) return null;
  if (typeof payload.result === "string") {
    try {
      return JSON.parse(payload.result) as StatsState;
    } catch {
      return null;
    }
  }
  return payload.result;
}

async function kvSet(state: StatsState) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return;
  await fetch(`${url}/set/${encodeURIComponent(STATE_KEY)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(state),
  });
}

function prune(state: StatsState) {
  const dates = Object.keys(state.days).sort();
  if (dates.length > MAX_DAYS) {
    for (const date of dates.slice(0, dates.length - MAX_DAYS)) {
      delete state.days[date];
      delete state.visitorKeys[date];
    }
  }
  if (state.recent.length > MAX_RECENT) state.recent = state.recent.slice(0, MAX_RECENT);
}

export async function readStats(): Promise<StatsState> {
  if (kvEnabled()) {
    return (await kvGet()) ?? emptyState();
  }
  return globalStore.__todayScammerStats?.memory ?? emptyState();
}

export async function writeStats(state: StatsState) {
  prune(state);
  if (kvEnabled()) {
    await kvSet(state);
    return;
  }
  globalStore.__todayScammerStats = { memory: state };
}

export async function recordEvent(input: {
  name: "visit" | "case_start" | "case_clear";
  source: string;
  caseId?: string;
  visitorKey: string;
}) {
  const state = await readStats();
  const date = kstDate();
  const day = state.days[date] ?? emptyDay();
  const source = input.source || "direct";

  if (input.name === "visit") {
    day.visits += 1;
    const seen = new Set(state.visitorKeys[date] ?? []);
    if (!seen.has(input.visitorKey)) {
      seen.add(input.visitorKey);
      day.visitors += 1;
      state.visitorKeys[date] = [...seen].slice(-MAX_VISITOR_KEYS);
    }
    day.sources[source] = (day.sources[source] ?? 0) + 1;
  }

  if (input.name === "case_start" && input.caseId) {
    day.briefing += 1;
    const row = day.cases[input.caseId] ?? { start: 0, clear: 0 };
    row.start += 1;
    day.cases[input.caseId] = row;
  }

  if (input.name === "case_clear" && input.caseId) {
    day.ending += 1;
    const row = day.cases[input.caseId] ?? { start: 0, clear: 0 };
    row.clear += 1;
    day.cases[input.caseId] = row;
  }

  state.days[date] = day;
  state.recent.unshift({
    t: Date.now(),
    name: input.name,
    source,
    caseId: input.caseId,
  });
  await writeStats(state);
  return { date, persistent: kvEnabled() };
}

export function storageMode() {
  return kvEnabled() ? "kv" : "memory";
}
