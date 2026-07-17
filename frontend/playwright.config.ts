/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-07-17
 *
 * E2E config for the Chronograph frontend. Locks in the S-tier quality bar
 * (ISC-1/2/3): every route renders with zero console errors and no horizontal
 * overflow, and the signature features (reading-first folio, music thread,
 * expand-all) keep working. Runs against a production build on :3111.
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: "http://localhost:3111",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx next start -p 3111",
    url: "http://localhost:3111",
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
