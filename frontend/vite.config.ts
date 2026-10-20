import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return;

          if (
            id.includes("react") ||
            id.includes("react-dom") ||
            id.includes("react-router-dom")
          ) {
            return "vendor-react";
          }
          if (id.includes("@tanstack/react-query") || id.includes("axios")) {
            return "vendor-query";
          }
          if (
            id.includes("react-hook-form") ||
            id.includes("zod") ||
            id.includes("@hookform/resolvers")
          ) {
            return "vendor-forms";
          }
          if (
            id.includes("lucide-react") ||
            id.includes("@radix-ui") ||
            id.includes("tailwind-merge") ||
            id.includes("clsx")
          ) {
            return "vendor-ui";
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
