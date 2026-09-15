"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent, trackVisitOnce } from "../lib/track";

export function WebTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/ops") || pathname.startsWith("/api")) return;
    trackVisitOnce();
  }, [pathname]);

  useEffect(() => {
    const onScreen = (event: Event) => {
      const detail = (event as CustomEvent<{ screen?: string; caseId?: string }>).detail;
      if (detail?.screen === "briefing") trackEvent({ name: "case_start", caseId: detail.caseId });
      if (detail?.screen === "ending") trackEvent({ name: "case_clear", caseId: detail.caseId });
    };
    window.addEventListener("today-scammer:screen", onScreen);
    return () => window.removeEventListener("today-scammer:screen", onScreen);
  }, []);

  return null;
}
