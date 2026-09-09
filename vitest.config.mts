import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Resolves the "~/*" alias from tsconfig.json.
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    // Playwright specs live in e2e/ and are run by `npm run test:e2e`.
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**/*.ts", "components/**/*.tsx", "middleware.ts"],
      exclude: ["components/ui/**"],
    },
  },
});
