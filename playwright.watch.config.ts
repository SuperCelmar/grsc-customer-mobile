import { defineConfig, devices } from '@playwright/test'
import baseConfig from './playwright.config'

export default defineConfig({
  ...baseConfig,
  timeout: 90_000,
  use: {
    ...baseConfig.use,
    headless: false,
    launchOptions: { slowMo: 250 },
    actionTimeout: 15_000,
    navigationTimeout: 15_000,
    video: 'on',
    trace: 'on',
  },
  projects: [
    {
      name: 'chromium-watch',
      use: { ...devices['Pixel 5'] },
    },
  ],
})
