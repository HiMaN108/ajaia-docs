import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;
const env = {
  DATABASE_URL: "file:e2e.db", // separate DB so e2e runs never touch local.db
  SESSION_SECRET: "e2e-only-session-secret-at-least-32-chars",
};

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: { baseURL: `http://localhost:${PORT}`, viewport: { width: 1280, height: 860 } },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 860 } } }],
  webServer: {
    command: `rm -f e2e.db && npx tsx scripts/seed.ts && npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    timeout: 120_000,
    reuseExistingServer: false,
    env,
  },
});
