import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./server/test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/samples.ts", "src/history.ts", "server/src/**/*.ts"],
      thresholds: { lines: 75, functions: 65, branches: 65, statements: 75 },
    },
  },
});
