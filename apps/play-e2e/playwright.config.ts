import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';

// For CI, you may want to set BASE_URL to the deployed application.
const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      // Force full Chromium instead of Playwright's default headless-shell:
      // nixpkgs' chromium_headless_shell crashes on aarch64-linux (the
      // Sandcastle container's arch). The full chromium binary ships in the
      // same Nix bundle and works on every arch, so PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD
      // stays satisfied and the config is uniform across host/CI/sandbox.
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // WebKit only runs reliably with the nixpkgs browsers on macOS; on Linux
    // (CI) it hangs at newPage. Run it locally on mac, skip it on Linux.
    ...(process.platform === 'darwin'
      ? [
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
          },
        ]
      : []),

    // Uncomment for mobile browsers support
    /* {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    }, */

    // Uncomment for branded browsers
    /* {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    } */
  ],
});
