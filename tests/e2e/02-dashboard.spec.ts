import { test, expect } from '@playwright/test'
import { loginWithTestPhone, gotoProtected } from './helpers/auth'

// Mock data from mock-data.ts (active when grsc_dev_session=1):
// customer.name = 'Test User', membership.status = 'Active', tier = 'pro'
// store: 'GoldRush Jubilee Hills', online_products include 'Performance Coffee'

test.describe('Dashboard screen (authenticated member)', () => {
  test('dashboard URL is /dashboard after login via UI', async ({ page }) => {
    await loginWithTestPhone(page)
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('renders the store name from mock data', async ({ page }) => {
    await gotoProtected(page, '/dashboard')
    // HomeHeader shows storeName from OrderingContext = 'GoldRush Jubilee Hills'
    await expect(page.locator('text=GoldRush Jubilee Hills')).toBeVisible({ timeout: 8_000 })
  })

  test('renders the bottom navigation bar', async ({ page }) => {
    await gotoProtected(page, '/dashboard')
    await expect(page.locator('nav').first()).toBeVisible({ timeout: 8_000 })
  })

  test('Performance Coffee section appears for active member with mock online products', async ({ page }) => {
    await gotoProtected(page, '/dashboard')
    // mockMenu has online_products with category_name = 'Performance Coffee'
    await expect(page.locator('text=Performance Coffee')).toBeVisible({ timeout: 8_000 })
  })

  test('unauthenticated visit to dashboard redirects to login', async ({ page }) => {
    // No session injected — ProtectedLayout should redirect
    await page.goto('/dashboard')
    await page.waitForURL('**/login', { timeout: 8_000 })
    await expect(page).toHaveURL(/\/login/)
  })
})
