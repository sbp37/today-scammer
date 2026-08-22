import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "ait",
  base: "./",
  publicDir: "../public",
  plugins: [react()],
  build: {
    outDir: "../ait-dist",
    emptyOutDir: true,
    sourcemap: false,
  },
});
