import { test, expect } from '@playwright/test'
import { gotoProtected } from './helpers/auth'

// Mock menu data (from mock-data.ts, active when grsc_dev_session=1):
// Store: 'GoldRush Jubilee Hills'
// Categories: Hot Coffee, Cold Coffee, Protein Shakes, Snacks
// Products: 'Classic Latte' (₹220, has addons), 'Iced Americano' (₹180, no addons),
//           'Cold Brew' (₹250), 'Cappuccino' (₹200)

test.describe('Menu browse screen', () => {
  test.beforeEach(async ({ page }) => {
    await gotoProtected(page, '/order')
  })

  test('menu screen renders the store name', async ({ page }) => {
    await expect(page.locator('text=GoldRush Jubilee Hills')).toBeVisible({ timeout: 8_000 })
  })

  test('category pills are rendered from mock menu data', async ({ page }) => {
    await expect(page.locator('text=Hot Coffee')).toBeVisible({ timeout: 8_000 })
    await expect(page.locator('text=Cold Coffee')).toBeVisible({ timeout: 8_000 })
  })

  test('product cards render product name and price', async ({ page }) => {
    // Hot Coffee is selected by default (first category)
    await expect(page.locator('text=Classic Latte')).toBeVisible({ timeout: 8_000 })
    await expect(page.locator('text=₹220')).toBeVisible({ timeout: 8_000 })
  })

  test('add button is present on a product card', async ({ page }) => {
    await expect(page.locator('[aria-label="Add Classic Latte"]')).toBeVisible({ timeout: 8_000 })
  })

  test('clicking a category pill switches the displayed products', async ({ page }) => {
    await page.locator('text=Cold Coffee').click()
    await expect(page.locator('text=Iced Americano')).toBeVisible({ timeout: 6_000 })
    await expect(page.locator('text=Cold Brew')).toBeVisible({ timeout: 6_000 })
  })

  test('search input filters products by name', async ({ page }) => {
    await page.locator('input[placeholder="Search menu..."]').fill('Cappuccino')
    await expect(page.locator('text=Cappuccino')).toBeVisible({ timeout: 6_000 })
    await expect(page.locator('[aria-label="Add Classic Latte"]')).toHaveCount(0)
  })
})
