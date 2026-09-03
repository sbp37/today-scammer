import { Environment, IAP, Promotion, Share, TossAds, generateHapticFeedback, loadFullScreenAd, showFullScreenAd } from "@apps-in-toss/web-framework";
import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { TodayScammer } from "../app/page";
import type { CaseId, RewardedUnlockResult } from "../app/page";
import "../app/globals.css";

const viteEnvironment = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const rewardedAdGroupId = viteEnvironment?.VITE_TOSS_REWARDED_AD_GROUP_ID || "ait.v2.live.6141fea128c44f43";
const bannerAdGroupId = viteEnvironment?.VITE_TOSS_BANNER_AD_GROUP_ID || "ait.v2.live.72cbbf1ba4fb488b";
const tossAdFreeProductId = viteEnvironment?.VITE_TOSS_AD_FREE_PRODUCT_ID || "today_scammer_ad_free";
const tossPromotionCode = viteEnvironment?.VITE_TOSS_PROMOTION_CODE || "01M1HCH8T18CN3A7AT6XFS70TN";
const tossShareOgImageUrl = "https://today-scammer.vercel.app/og.webp";
const tossAdFreeStorageKey = "today-scammer:toss:ad-free";
const tossPromotionClaimedStorageKey = "today-scammer:toss:first-game-promotion-claimed";

type RewardedAdStatus = "loading" | "ready" | "showing" | "unavailable" | "failed";
type TossBannerPlacement = "home" | "result";

function TossBannerAd({ enabled, placement }: { enabled: boolean; placement: TossBannerPlacement }) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "rendered" | "empty">("loading");

  useEffect(() => {
    if (!enabled || !targetRef.current) return;

    let active = true;
    const banner = TossAds.attachBanner(bannerAdGroupId, targetRef.current, {
      theme: "dark",
      tone: "blackAndWhite",
      variant: "expanded",
      callbacks: {
        onAdRendered: () => {
          if (active) setStatus("rendered");
        },
        onNoFill: () => {
          if (active) setStatus("empty");
        },
        onAdFailedToRender: (payload) => {
          console.warn(`토스 ${placement} 배너 광고 표시 실패`, payload.error.message);
          if (active) setStatus("empty");
        },
      },
    });

    return () => {
      active = false;
      banner.destroy();
    };
  }, [enabled, placement]);

  if (!enabled) return null;

  return (
    <aside className={`toss-banner-wrap toss-banner-${placement} is-${status}`} aria-label="광고">
      <div className="toss-banner-slot" ref={targetRef} />
    </aside>
  );
}

function isRewardedAdSupported() {
  try {
    return loadFullScreenAd.isSupported() && showFullScreenAd.isSupported();
  } catch {
    return false;
  }
}

function isTossIapSupported() {
  try {
    return IAP.getProductItemList.isSupported() && IAP.createOneTimePurchaseOrder.isSupported();
  } catch {
    return false;
  }
}

function TossTodayScammer() {
  const [rewardedAdStatus, setRewardedAdStatus] = useState<RewardedAdStatus>("loading");
  const [bannerAdsReady, setBannerAdsReady] = useState(false);
  const [iapSupported] = useState(isTossIapSupported);
  const [adFreePurchased, setAdFreePurchased] = useState(() => {
    try {
      return window.localStorage.getItem(tossAdFreeStorageKey) === "1";
    } catch {
      return false;
    }
  });
  const [adFreePurchasePending, setAdFreePurchasePending] = useState(false);
  const [adFreePriceLabel, setAdFreePriceLabel] = useState("3,900원");
  const rewardedAdReadyRef = useRef(false);
  const adLoadingRef = useRef(false);
  const loadCleanupRef = useRef<null | (() => void)>(null);
  const showCleanupRef = useRef<null | (() => void)>(null);
  const iapCleanupRef = useRef<null | (() => void)>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const promotionClaimingRef = useRef(false);

  const grantTossAdFree = useCallback(() => {
    setAdFreePurchased(true);
    try {
      window.localStorage.setItem(tossAdFreeStorageKey, "1");
    } catch {
      // 주문 내역 조회가 다음 실행에서 다시 평생 권한을 복원합니다.
    }
  }, []);

  const revokeTossAdFree = useCallback(() => {
    setAdFreePurchased(false);
    try {
      window.localStorage.removeItem(tossAdFreeStorageKey);
    } catch {
      // 다음 주문 내역 조회 결과가 권한 상태를 다시 맞춥니다.
    }
  }, []);

  useEffect(() => {
    if (!iapSupported) return;
    let active = true;

    void (async () => {
      try {
        const catalog = await IAP.getProductItemList();
        const product = catalog?.products?.find((item) => item.sku === tossAdFreeProductId);
        if (active && product?.displayAmount) setAdFreePriceLabel(product.displayAmount);

        let restoredPendingOrder = false;
        if (IAP.getPendingOrders.isSupported() && IAP.completeProductGrant.isSupported()) {
          const pending = await IAP.getPendingOrders();
          for (const order of pending?.orders ?? []) {
            if (order.sku !== tossAdFreeProductId) continue;
            grantTossAdFree();
            restoredPendingOrder = true;
            await IAP.completeProductGrant({ params: { orderId: order.orderId } });
          }
        }
        if (restoredPendingOrder || !IAP.getCompletedOrRefundedOrders.isSupported()) return;

        const history = await IAP.getCompletedOrRefundedOrders();
        const latest = [...(history?.orders ?? [])]
          .filter((order) => order.sku === tossAdFreeProductId)
          .sort((left, right) => Date.parse(right.date) - Date.parse(left.date))[0];
        if (!active) return;
        if (latest?.status === "COMPLETED") grantTossAdFree();
        else if (latest?.status === "REFUNDED") revokeTossAdFree();
      } catch (error) {
        console.warn("토스 평생 광고 제거 상품 조회·복원 실패", error);
      }
    })();

    return () => {
      active = false;
      iapCleanupRef.current?.();
      iapCleanupRef.current = null;
    };
  }, [grantTossAdFree, iapSupported, revokeTossAdFree]);

  useEffect(() => {
    let active = true;

    try {
      if (!TossAds.initialize.isSupported()) return;
      TossAds.initialize({
        callbacks: {
          onInitialized: () => {
            if (active) setBannerAdsReady(true);
          },
          onInitializationFailed: (error) => {
            console.warn("토스 배너 광고 초기화 실패", error);
            if (active) setBannerAdsReady(false);
          },
        },
      });
    } catch (error) {
      console.warn("토스 배너 광고를 지원하지 않는 환경입니다", error);
    }

    return () => {
      active = false;
      try {
        TossAds.destroyAll();
      } catch {
        // 구형 토스 앱이나 브라우저 미리보기에서는 제거 API가 없을 수 있습니다.
      }
    };
  }, []);

  useEffect(() => {
    const playTapSound = () => {
      try {
        const context = audioContextRef.current ?? new AudioContext();
        audioContextRef.current = context;
        if (context.state === "suspended") void context.resume();

        const now = context.currentTime;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(430, now);
        oscillator.frequency.exponentialRampToValueAtTime(310, now + 0.035);
        gain.gain.setValueAtTime(0.018, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.045);
      } catch {
        // 기기에서 Web Audio를 지원하지 않아도 버튼 동작은 그대로 유지합니다.
      }
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("button:not(:disabled), a[href], [role='button']") : null;
      if (!target) return;
      playTapSound();
      try {
        void generateHapticFeedback({ type: "tickWeak" }).catch(() => navigator.vibrate?.(8));
      } catch {
        navigator.vibrate?.(8);
      }
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      if (audioContextRef.current) void audioContextRef.current.close();
      audioContextRef.current = null;
    };
  }, []);

  const loadRewardedAd = useCallback(() => {
    if (adFreePurchased) return;
    if (!isRewardedAdSupported()) {
      rewardedAdReadyRef.current = false;
      setRewardedAdStatus("unavailable");
      return;
    }
    if (adLoadingRef.current || rewardedAdReadyRef.current) return;

    adLoadingRef.current = true;
    setRewardedAdStatus("loading");
    loadCleanupRef.current?.();
    loadCleanupRef.current = loadFullScreenAd({
      options: { adGroupId: rewardedAdGroupId },
      onEvent: (event) => {
        if (event.type !== "loaded") return;
        adLoadingRef.current = false;
        rewardedAdReadyRef.current = true;
        setRewardedAdStatus("ready");
        loadCleanupRef.current?.();
        loadCleanupRef.current = null;
      },
      onError: (error) => {
        console.error("보상형 광고 로드 실패", error);
        adLoadingRef.current = false;
        rewardedAdReadyRef.current = false;
        setRewardedAdStatus("failed");
        loadCleanupRef.current?.();
        loadCleanupRef.current = null;
      },
    });
  }, [adFreePurchased]);

  useEffect(() => {
    const preloadId = window.setTimeout(loadRewardedAd, 0);
    return () => {
      window.clearTimeout(preloadId);
      loadCleanupRef.current?.();
      showCleanupRef.current?.();
    };
  }, [loadRewardedAd]);

  const requestRewardedUnlock = useCallback((_caseId: CaseId) => {
    void _caseId;
    return new Promise<RewardedUnlockResult>((resolve) => {
      if (adFreePurchased) {
        resolve("earned");
        return;
      }
      if (!isRewardedAdSupported()) {
        setRewardedAdStatus("unavailable");
        resolve("unavailable");
        return;
      }
      if (!rewardedAdReadyRef.current) {
        loadRewardedAd();
        resolve("not-ready");
        return;
      }

      rewardedAdReadyRef.current = false;
      setRewardedAdStatus("showing");
      let rewardEarned = false;
      let settled = false;
      let finished = false;
      let earnedFallbackId: number | undefined;
      let unregister = () => {};
      const settle = (result: RewardedUnlockResult) => {
        if (settled) return;
        settled = true;
        resolve(result);
      };
      const finishAd = (result: RewardedUnlockResult) => {
        if (finished) return;
        finished = true;
        if (earnedFallbackId !== undefined) window.clearTimeout(earnedFallbackId);
        settle(result);
        if (result === "earned") {
          try {
            void generateHapticFeedback({ type: "success" }).catch(() => navigator.vibrate?.([18, 35, 24]));
          } catch {
            navigator.vibrate?.([18, 35, 24]);
          }
        }
        unregister();
        showCleanupRef.current = null;
        window.setTimeout(loadRewardedAd, 350);
      };

      unregister = showFullScreenAd({
        options: { adGroupId: rewardedAdGroupId },
        onEvent: (event) => {
          if (event.type === "userEarnedReward") {
            rewardEarned = true;
            // 광고가 완전히 닫힌 뒤 사건 화면을 열어요. 구형 Android의 dismissed 누락에도 대비합니다.
            earnedFallbackId = window.setTimeout(() => finishAd("earned"), 2500);
            return;
          }
          if (event.type === "dismissed") {
            finishAd(rewardEarned ? "earned" : "dismissed");
            return;
          }
          if (event.type === "failedToShow") finishAd("failed");
        },
        onError: (error) => {
          console.error("보상형 광고 표시 실패", error);
          finishAd("failed");
        },
      });
      showCleanupRef.current = unregister;
    });
  }, [adFreePurchased, loadRewardedAd]);

  const purchaseTossAdFree = useCallback(() => {
    if (!iapSupported || adFreePurchased || adFreePurchasePending) return Promise.resolve(false);
    setAdFreePurchasePending(true);

    return new Promise<boolean>((resolve) => {
      let settled = false;
      let cleanup = () => {};
      const finish = (purchased: boolean) => {
        if (settled) return;
        settled = true;
        cleanup();
        iapCleanupRef.current = null;
        setAdFreePurchasePending(false);
        resolve(purchased);
      };

      try {
        cleanup = IAP.createOneTimePurchaseOrder({
          options: {
            sku: tossAdFreeProductId,
            processProductGrant: () => {
              grantTossAdFree();
              return true;
            },
          },
          onEvent: () => finish(true),
          onError: (error) => {
            console.warn("토스 평생 광고 제거 구매 미완료", error);
            finish(false);
          },
        });
        iapCleanupRef.current = cleanup;
      } catch (error) {
        console.warn("토스 인앱결제를 지원하지 않는 환경입니다", error);
        finish(false);
      }
    });
  }, [adFreePurchasePending, adFreePurchased, grantTossAdFree, iapSupported]);

  const grantFirstGamePromotion = useCallback(async () => {
    if (promotionClaimingRef.current) return;
    try {
      if (!Promotion.grantReward.isSupported() || window.localStorage.getItem(tossPromotionClaimedStorageKey) === "1") return;
    } catch {
      if (!Promotion.grantReward.isSupported()) return;
    }

    promotionClaimingRef.current = true;
    try {
      const result = await Promotion.grantReward({ promotionCode: tossPromotionCode, amount: 1 });
      if (result?.key) {
        try {
          window.localStorage.setItem(tossPromotionClaimedStorageKey, "1");
        } catch {
          // 다음 결과 화면에서 중복 호출을 막을 수 없지만, 토스 측 지급 이력은 유지됩니다.
        }
      } else {
        console.warn("첫 사건 완료 프로모션 지급 실패", result);
      }
    } catch (error) {
      console.warn("첫 사건 완료 프로모션 호출 실패", error);
    } finally {
      promotionClaimingRef.current = false;
    }
  }, []);

  const shareTossResult = useCallback(async (message: string) => {
    let sharePath = "intoss://today-scammer";
    try {
      if (Environment.environment === "sandbox" && Environment.deploymentId && Environment.deploymentId !== "local") {
        sharePath = `intoss-private://appsintoss?_deploymentId=${encodeURIComponent(Environment.deploymentId)}`;
      }
    } catch {
      // 출시 환경 기본 딥링크를 사용합니다.
    }

    const tossLink = await Share.createLink({ path: sharePath, ogImageUrl: tossShareOgImageUrl });
    await Share.sendMessage({ message: `${message}\n${tossLink}` });
  }, []);

  return (
    <TodayScammer
      homeAd={<TossBannerAd enabled={bannerAdsReady && !adFreePurchased} placement="home" />}
      resultAd={<TossBannerAd enabled={bannerAdsReady && !adFreePurchased} placement="result" />}
      rewardedUnlocksEnabled
      rewardedAdStatus={rewardedAdStatus}
      onRequestRewardedUnlock={requestRewardedUnlock}
      onShareResult={shareTossResult}
      onGameCompleted={grantFirstGamePromotion}
      showAdFreeOffer={false}
      adFreePurchased={adFreePurchased}
      adFreePurchasePending={adFreePurchasePending}
      adFreePriceLabel={adFreePriceLabel}
      onPurchaseAdFree={purchaseTossAdFree}
    />
  );
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("오늘의 사기꾼 앱 루트 요소를 찾지 못했습니다.");
}

createRoot(root).render(<TossTodayScammer />);
