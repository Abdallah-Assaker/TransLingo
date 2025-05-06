import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Look for test files in the "tests" directory, relative to the config file.
  testDir: './tests',
  // Run all tests in parallel.
  fullyParallel: false,
  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,
  // Retry on CI only.
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel tests on CI.
  workers: 1,
  
  // reporter: [['json', { outputFile: 'test-results.json' }]],
  reporter: 'html',

  // Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions.
  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL: 'http://localhost:8080',

    // Collect traces on first retry and more upon failures.
    trace: 'on-first-retry',

    headless: true, 

    // API testing: Configure the request fixture
    extraHTTPHeaders: {
      // Add any headers you need here
      'Accept': 'application/json',
    },
  },

  // Configure projects for major browsers.
  projects: [
    {
      name: 'api',
      use: {
        // Use the baseURL from the root 'use' block
        // No browser is needed for API tests
      },
    },
    // Add other projects for UI testing if needed
  ],
});