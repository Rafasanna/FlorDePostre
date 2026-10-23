import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  expect: { timeout: 7000 },
  outputDir: ".local/playwright-results",
  reporter: [
    ["list"],
    ["html", { outputFolder: ".local/playwright-report", open: "never" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:4190",
    headless: true,
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      args: ["--disable-background-networking"],
    },
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm run dev:admin -- --port 4190 --strictPort",
      url: "http://127.0.0.1:4190",
      reuseExistingServer: false,
    },
    {
      command: "node scripts/e2e-server.mjs production",
      url: "http://127.0.0.1:4191",
      reuseExistingServer: false,
    },
    {
      command: "node scripts/e2e-server.mjs baseline",
      url: "http://127.0.0.1:4192",
      reuseExistingServer: false,
    },
  ],
});
