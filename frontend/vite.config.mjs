import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
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
    // One bundle, same as CRA produced (~650 kB, 183 kB gzip). Splitting it would be a refactor.
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      checks: { pluginTimings: false },
    },
  },
});
