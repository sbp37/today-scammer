"use client";

import { useEffect } from "react";
import { trackVisitOnce } from "../lib/track";

export function WebTracker() {
  useEffect(() => {
    trackVisitOnce();
  }, []);
  return null;
}
