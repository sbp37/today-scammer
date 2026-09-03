import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sbp37.todayscammer",
  appName: "오늘의 사기꾼",
  webDir: "google-play-dist",
  backgroundColor: "#070910",
  android: {
    allowMixedContent: false,
    backgroundColor: "#070910",
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
