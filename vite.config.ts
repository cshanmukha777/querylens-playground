import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/@codemirror/") || id.includes("/node_modules/@lezer/")) return "editor";
          if (id.includes("/node_modules/node-sql-parser/") || id.includes("/node_modules/@noble/hashes/")) return "querylens-core";
          if (id.includes("/node_modules/react") || id.includes("/node_modules/scheduler/")) return "react-vendor";
        },
      },
    },
  },
  server: { proxy: { "/api": "http://localhost:4179" } },
});
