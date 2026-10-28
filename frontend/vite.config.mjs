import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    // With VITE_API_URL empty, the app calls /api on this origin.
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
  preview: {
    port: 3000,
  },
  build: {
    // One bundle, as under CRA (~650 kB with the original deps, ~720 kB after the B4 upgrades).
    // Splitting it would be a refactor.
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      checks: { pluginTimings: false },
    },
  },
});
