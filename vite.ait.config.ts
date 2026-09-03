import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const aitAdStub = fileURLToPath(new URL("./ait/ad-banner-stub.tsx", import.meta.url));

export default defineConfig({
  root: "ait",
  base: "./",
  publicDir: "../public",
  plugins: [
    {
      name: "ait-disable-external-web-ads",
      enforce: "pre",
      resolveId(source, importer) {
        if (source === "./components/ad-banner" && importer?.endsWith("/app/page.tsx")) return aitAdStub;
        return null;
      },
    },
    react(),
  ],
  define: {
    "process.env.NEXT_PUBLIC_REWARDED_UNLOCKS_ENABLED": JSON.stringify("false"),
  },
  build: {
    outDir: "../ait-dist",
    emptyOutDir: true,
    sourcemap: false,
  },
});
