import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    // Pass DEV env vars so the test-phone bypass works
    extraHTTPHeaders: {},
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? 'https://YOUR_PROJECT_REF.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'sb_publishable_AJemA3U5n1ppf5Z4-z_qkQ_kcwOwVj9',
      VITE_TEST_PHONE: '9999999999',
      VITE_TEST_OTP: '123456',
    },
  },
})
