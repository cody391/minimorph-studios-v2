import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 90000,
  globalTimeout: 600000,
  workers: 1, // run serially so shared admin session is consistent
  use: {
    headless: true,
    screenshot: "on",
    video: "retain-on-failure",
    storageState: undefined,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
