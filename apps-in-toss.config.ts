import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "today-scammer",
  brand: {
    displayName: "오늘의 사기꾼",
    primaryColor: "#d82418",
    icon: "https://static.toss.im/appsintoss/78263/cd6a08e3-aec0-451e-a977-77ac29ca6abb.png",
  },
  permissions: [],
  navigationBar: {
    withBackButton: false,
    withHomeButton: false,
    withTitle: true,
    transparentBackground: true,
    theme: "dark",
  },
  webView: {
    bounces: false,
    pullToRefreshEnabled: false,
    overScrollMode: "never",
    mediaPlaybackRequiresUserAction: true,
    allowsBackForwardNavigationGestures: true,
  },
  webBundleDir: "ait-dist",
});
