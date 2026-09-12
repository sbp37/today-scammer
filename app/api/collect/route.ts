import { NextRequest, NextResponse } from "next/server";
import { recordEvent } from "../../lib/stats-store";

const allowed = new Set(["visit", "case_start", "case_clear"]);
const buckets = new Map<string, { count: number; resetAt: number }>();

function visitorKey(request: NextRequest, sessionId: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0";
  const seed = `${forwarded}|${sessionId || "anon"}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash.toString(36);
}

function limited(key: string) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 40;
}

export async function POST(request: NextRequest) {
  let body: { name?: string; source?: string; caseId?: string; sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const name = body.name ?? "";
  if (!allowed.has(name)) return NextResponse.json({ ok: false }, { status: 400 });

  const key = visitorKey(request, body.sessionId ?? "");
  if (limited(key)) return NextResponse.json({ ok: true, limited: true });

  const source = String(body.source ?? "direct").slice(0, 32);
  const caseId = body.caseId ? String(body.caseId).slice(0, 16) : undefined;

  const result = await recordEvent({
    name: name as "visit" | "case_start" | "case_clear",
    source,
    caseId,
    visitorKey: key,
  });

  return NextResponse.json({ ok: true, ...result });
}
