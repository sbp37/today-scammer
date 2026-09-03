import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export function InfoPage({ eyebrow, title, summary, children }: { eyebrow: string; title: string; summary: string; children: ReactNode }) {
  return (
    <main className="info-screen">
      <div className="info-glow" aria-hidden="true" />
      <header className="info-nav">
        <Link href="/" aria-label="오늘의 사기꾼 사건 목록으로 돌아가기">← 사건 목록</Link>
        <span>SCAMMER ARCHIVE</span>
      </header>
      <article className="info-card">
        <p className="info-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="info-summary">{summary}</p>
        <div className="info-body">{children}</div>
      </article>
      <footer className="info-footer">
        <Image src="/logo-oneul.webp" alt="오늘의 사기꾼" width="800" height="375" />
        <p>게임 시뮬레이션 · 실제 금전 거래 없음</p>
      </footer>
    </main>
  );
}
