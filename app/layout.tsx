import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    title: "오늘의 사기꾼 — 말이 무너지기 전에 탈출하라",
    description: "수상한 사기꾼과 실제 메신저처럼 대화하고, 사기 신호를 찾아 탈출하는 짧은 상황극 게임.",
    openGraph: {
      title: "오늘의 사기꾼",
      description: "말이 무너지기 전에 탈출하라",
      type: "website",
      images: [{ url: `${origin}/og.png`, width: 1727, height: 911, alt: "오늘의 사기꾼 CASE 01 캐릭터 셀렉트" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "오늘의 사기꾼",
      description: "말이 무너지기 전에 탈출하라",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
