import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname || ".", "./src"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    // Several legacy tests share data/.ai_config.json; run files serially to avoid disk races.
    fileParallelism: false,
  },
});
