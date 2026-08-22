import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "today-scammer",
  brand: {
    primaryColor: "#d82418",
  },
  permissions: [],
  navigationBar: {
    withBackButton: false,
    withHomeButton: false,
    withTitle: false,
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
