import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const adStub = fileURLToPath(new URL("./ait/ad-banner-stub.tsx", import.meta.url));

export default defineConfig({
  root: "google-play",
  base: "./",
  publicDir: "../public",
  envDir: "../",
  plugins: [
    {
      name: "google-play-disable-web-ads",
      enforce: "pre",
      resolveId(source, importer) {
        if (source === "./components/ad-banner" && importer?.endsWith("/app/page.tsx")) return adStub;
        return null;
      },
    },
    react(),
  ],
  define: {
    "process.env.NEXT_PUBLIC_REWARDED_UNLOCKS_ENABLED": JSON.stringify("false"),
  },
  build: {
    outDir: "../google-play-dist",
    emptyOutDir: true,
    sourcemap: false,
  },
});
