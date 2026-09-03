import {
  AdMob,
  AdmobConsentStatus,
  BannerAdPosition,
  BannerAdSize,
  MaxAdContentRating,
} from "@capacitor-community/admob";
import { Capacitor } from "@capacitor/core";
import { NativePurchases, PURCHASE_TYPE } from "@capgo/native-purchases";
import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { TodayScammer } from "../app/page";
import type { CaseId, GameScreen, RewardedUnlockResult } from "../app/page";
import "../app/globals.css";

const viteEnvironment = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const testBannerId = "ca-app-pub-3940256099942544/9214589741";
const testRewardedId = "ca-app-pub-3940256099942544/5224354917";
const bannerAdId = viteEnvironment?.VITE_ADMOB_BANNER_ID || testBannerId;
const rewardedAdId = viteEnvironment?.VITE_ADMOB_REWARDED_ID || testRewardedId;
const adFreeProductId = viteEnvironment?.VITE_PLAY_AD_FREE_PRODUCT_ID || "today_scammer_ad_free";
const isTesting = viteEnvironment?.VITE_ADMOB_TEST_MODE !== "false";
const adFreeStorageKey = "today-scammer:google-play:ad-free";

type RewardedAdStatus = "loading" | "ready" | "showing" | "unavailable" | "failed";

function GooglePlayTodayScammer() {
  const isAndroid = Capacitor.getPlatform() === "android";
  const [screen, setScreen] = useState<GameScreen>("home");
  const [adMobReady, setAdMobReady] = useState(false);
  const [rewardedAdStatus, setRewardedAdStatus] = useState<RewardedAdStatus>(() => isAndroid ? "loading" : "unavailable");
  const [adFreePurchased, setAdFreePurchased] = useState(() => {
    try {
      return window.localStorage.getItem(adFreeStorageKey) === "1";
    } catch {
      return false;
    }
  });
  const [adFreePurchasePending, setAdFreePurchasePending] = useState(false);
  const [adFreePriceLabel, setAdFreePriceLabel] = useState("3,900원");
  const bannerVisibleRef = useRef(false);
  const rewardLoadingRef = useRef(false);

  const grantAdFree = useCallback(() => {
    setAdFreePurchased(true);
    try {
      window.localStorage.setItem(adFreeStorageKey, "1");
    } catch {
      // Google Play 구매 조회가 다음 실행에서 다시 권한을 복원합니다.
    }
  }, []);

  const restoreAdFreePurchase = useCallback(async () => {
    if (!isAndroid) return;
    try {
      const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.INAPP });
      const owned = purchases.some((purchase) => purchase.productIdentifier === adFreeProductId && purchase.purchaseState === "1");
      if (owned) {
        grantAdFree();
        return;
      }
      setAdFreePurchased(false);
      try {
        window.localStorage.removeItem(adFreeStorageKey);
      } catch {
        // 구매 조회 결과가 우선이며, 저장소 정리는 다음 실행에 다시 시도합니다.
      }
    } catch (error) {
      console.warn("광고 제거 구매 복원 실패", error);
    }
  }, [grantAdFree, isAndroid]);

  const loadAdFreeProduct = useCallback(async () => {
    if (!isAndroid) return;
    try {
      const { products } = await NativePurchases.getProducts({
        productIdentifiers: [adFreeProductId],
        productType: PURCHASE_TYPE.INAPP,
      });
      const product = products.find((item) => item.identifier === adFreeProductId) ?? products[0];
      if (product?.priceString) setAdFreePriceLabel(product.priceString);
    } catch (error) {
      console.warn("광고 제거 상품 정보 조회 실패", error);
    }
  }, [isAndroid]);

  const preloadRewardedAd = useCallback(async () => {
    if (!isAndroid || !adMobReady || adFreePurchased || rewardLoadingRef.current) return false;
    rewardLoadingRef.current = true;
    setRewardedAdStatus("loading");
    try {
      await AdMob.prepareRewardVideoAd({ adId: rewardedAdId, isTesting });
      setRewardedAdStatus("ready");
      return true;
    } catch (error) {
      console.warn("Google 보상형 광고 준비 실패", error);
      setRewardedAdStatus("failed");
      return false;
    } finally {
      rewardLoadingRef.current = false;
    }
  }, [adFreePurchased, adMobReady, isAndroid]);

  useEffect(() => {
    if (!isAndroid) return;

    let cancelled = false;
    void (async () => {
      try {
        await AdMob.initialize({
          initializeForTesting: isTesting,
          maxAdContentRating: MaxAdContentRating.ParentalGuidance,
          tagForChildDirectedTreatment: false,
          tagForUnderAgeOfConsent: false,
        });
        const consent = await AdMob.requestConsentInfo();
        if (consent.status === AdmobConsentStatus.REQUIRED && consent.isConsentFormAvailable) {
          await AdMob.showConsentForm();
        }
        if (!cancelled) setAdMobReady(true);
      } catch (error) {
        console.warn("Google Mobile Ads 초기화 실패", error);
        if (!cancelled) setRewardedAdStatus("failed");
      }
      await Promise.allSettled([restoreAdFreePurchase(), loadAdFreeProduct()]);
    })();

    return () => {
      cancelled = true;
      void AdMob.removeBanner().catch(() => undefined);
    };
  }, [isAndroid, loadAdFreeProduct, restoreAdFreePurchase]);

  useEffect(() => {
    if (!adMobReady || adFreePurchased) return;
    const preloadId = window.setTimeout(() => void preloadRewardedAd(), 0);
    return () => window.clearTimeout(preloadId);
  }, [adFreePurchased, adMobReady, preloadRewardedAd]);

  useEffect(() => {
    if (!isAndroid || !adMobReady) return;
    const shouldShowBanner = !adFreePurchased && (screen === "home" || screen === "ending");

    if (shouldShowBanner && !bannerVisibleRef.current) {
      bannerVisibleRef.current = true;
      document.documentElement.dataset.nativeBanner = "visible";
      void AdMob.showBanner({
        adId: bannerAdId,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        isTesting,
        margin: 0,
      }).catch((error) => {
        console.warn("Google 배너 광고 표시 실패", error);
        bannerVisibleRef.current = false;
        delete document.documentElement.dataset.nativeBanner;
      });
      return;
    }

    if (!shouldShowBanner && bannerVisibleRef.current) {
      bannerVisibleRef.current = false;
      delete document.documentElement.dataset.nativeBanner;
      void AdMob.removeBanner().catch(() => undefined);
    }
  }, [adFreePurchased, adMobReady, isAndroid, screen]);

  const requestRewardedUnlock = useCallback(async (_caseId: CaseId): Promise<RewardedUnlockResult> => {
    void _caseId;
    if (adFreePurchased) return "earned";
    if (!isAndroid || !adMobReady) return "unavailable";

    if (rewardedAdStatus !== "ready") {
      const loaded = await preloadRewardedAd();
      if (!loaded) return "not-ready";
    }

    setRewardedAdStatus("showing");
    try {
      const reward = await AdMob.showRewardVideoAd();
      window.setTimeout(() => void preloadRewardedAd(), 350);
      return reward.amount > 0 ? "earned" : "dismissed";
    } catch (error) {
      console.warn("Google 보상형 광고 표시 실패", error);
      window.setTimeout(() => void preloadRewardedAd(), 350);
      return "dismissed";
    }
  }, [adFreePurchased, adMobReady, isAndroid, preloadRewardedAd, rewardedAdStatus]);

  const purchaseAdFree = useCallback(async () => {
    if (!isAndroid || adFreePurchasePending) return false;
    setAdFreePurchasePending(true);
    try {
      const support = await NativePurchases.isBillingSupported();
      if (!support.isBillingSupported) return false;
      const transaction = await NativePurchases.purchaseProduct({
        productIdentifier: adFreeProductId,
        productType: PURCHASE_TYPE.INAPP,
        isConsumable: false,
        autoAcknowledgePurchases: true,
      });
      if (transaction.productIdentifier !== adFreeProductId || transaction.purchaseState !== "1") return false;
      grantAdFree();
      return true;
    } catch (error) {
      console.warn("광고 제거 구매 미완료", error);
      await restoreAdFreePurchase();
      return false;
    } finally {
      setAdFreePurchasePending(false);
    }
  }, [adFreePurchasePending, grantAdFree, isAndroid, restoreAdFreePurchase]);

  return (
    <TodayScammer
      rewardedUnlocksEnabled
      rewardedAdStatus={rewardedAdStatus}
      onRequestRewardedUnlock={requestRewardedUnlock}
      showAdFreeOffer
      adFreePurchased={adFreePurchased}
      adFreePurchasePending={adFreePurchasePending}
      adFreePriceLabel={adFreePriceLabel}
      onPurchaseAdFree={purchaseAdFree}
      onScreenChange={setScreen}
    />
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("오늘의 사기꾼 Google Play 앱 루트를 찾지 못했습니다.");
createRoot(root).render(<GooglePlayTodayScammer />);
