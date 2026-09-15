import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { kstDate, readStats, storageMode } from "../../lib/stats-store";

const COOKIE = "today_scammer_ops";

function authorized(value: string | undefined) {
  const password = process.env.OPS_PASSWORD;
  if (!password) return false;
  return value === password;
}

export async function GET() {
  const jar = await cookies();
  if (!authorized(jar.get(COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "unauthorized", needPassword: !process.env.OPS_PASSWORD }, { status: 401 });
  }

  const state = await readStats();
  const today = kstDate();
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return kstDate(date);
  });

  const series = dates.map((date) => {
    const day = state.days[date];
    return {
      date,
      visits: day?.visits ?? 0,
      visitors: day?.visitors ?? 0,
      starts: day?.briefing ?? 0,
      clears: day?.ending ?? 0,
    };
  });

  const weekSources: Record<string, number> = {};
  const weekCases: Record<string, { start: number; clear: number }> = {};
  for (const date of dates) {
    const day = state.days[date];
    if (!day) continue;
    for (const [source, count] of Object.entries(day.sources)) {
      weekSources[source] = (weekSources[source] ?? 0) + count;
    }
    for (const [caseId, row] of Object.entries(day.cases)) {
      const current = weekCases[caseId] ?? { start: 0, clear: 0 };
      current.start += row.start;
      current.clear += row.clear;
      weekCases[caseId] = current;
    }
  }

  return NextResponse.json({
    ok: true,
    today,
    storage: storageMode(),
    todayStats: state.days[today] ?? null,
    series,
    weekSources,
    weekCases,
    recent: state.recent,
  });
}

export async function POST(request: NextRequest) {
  const password = process.env.OPS_PASSWORD;
  if (!password) {
    return NextResponse.json({ ok: false, error: "OPS_PASSWORD 환경변수가 없습니다." }, { status: 500 });
  }
  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  if (!body?.password || body.password !== password) {
    return NextResponse.json({ ok: false, error: "비밀번호가 다릅니다." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, password, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return response;
}
