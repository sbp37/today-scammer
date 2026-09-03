"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

type AdPlacement = "home" | "result";

const slots: Record<AdPlacement, string | undefined> = {
  home: process.env.NEXT_PUBLIC_ADSENSE_HOME_SLOT,
  result: process.env.NEXT_PUBLIC_ADSENSE_RESULT_SLOT,
};

const subscribeToPreviewMode = () => () => {};
const getPreviewMode = () => new URLSearchParams(window.location.search).get("ad-preview") === "1";
const getServerPreviewMode = () => false;

export function AdBanner({ placement }: { placement: AdPlacement }) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const slotId = slots[placement];
  const initialized = useRef(false);
  const preview = useSyncExternalStore(subscribeToPreviewMode, getPreviewMode, getServerPreviewMode);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("ad-preview") === "1") return;
    if (!clientId || !slotId || initialized.current) return;
    initialized.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch {
      // 광고 차단기나 네트워크 오류가 있어도 게임 흐름은 그대로 유지합니다.
    }
  }, [clientId, slotId]);

  if (preview) {
    return (
      <aside className={`web-ad-slot web-ad-slot-${placement} web-ad-preview`} aria-label="광고 배치 미리보기">
        <span>광고 미리보기</span>
        <div className="ad-preview-creative">
          <i aria-hidden="true">AD</i>
          <div><strong>여기에 실제 배너 광고가 표시됩니다</strong><small>내용과 높이는 Google이 화면에 맞춰 자동으로 정합니다.</small></div>
          <b>보기</b>
        </div>
      </aside>
    );
  }

  if (!clientId || !slotId) return null;

  return (
    <aside className={`web-ad-slot web-ad-slot-${placement}`} aria-label="광고">
      <span>광고</span>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
