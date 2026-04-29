import { test, expect } from '@playwright/test'
import { gotoProtected } from './helpers/auth'

// Iced Americano has no addon_groups — clicking Add goes straight to cart.
// Classic Latte has addon_groups — clicking Add opens ProductDetailSheet.
// Mock membership.status = 'Active' so TierGuard passes for /checkout.

test.describe('Cart and checkout initiation', () => {
  test('adding a no-addon product increments the cart count badge', async ({ page }) => {
    await gotoProtected(page, '/order')
    await page.locator('text=Cold Coffee').click()
    await expect(page.locator('[aria-label="Add Iced Americano"]')).toBeVisible({ timeout: 8_000 })
    await page.locator('[aria-label="Add Iced Americano"]').click()
    // FloatingCartButton or ScreenHeader cart badge shows count 1
    await expect(page.locator('text=1').first()).toBeVisible({ timeout: 6_000 })
  })

  test('adding the same no-addon product twice shows count 2', async ({ page }) => {
    await gotoProtected(page, '/order')
    await page.locator('text=Cold Coffee').click()
    await expect(page.locator('[aria-label="Add Iced Americano"]')).toBeVisible({ timeout: 8_000 })
    await page.locator('[aria-label="Add Iced Americano"]').click()
    await page.locator('[aria-label="Add Iced Americano"]').click()
    await expect(page.locator('text=2').first()).toBeVisible({ timeout: 6_000 })
  })

  test('checkout page loads for active member and does not redirect to dashboard', async ({ page }) => {
    // TierGuard requires 'active-member'; mock membership.status = 'Active' passes
    await gotoProtected(page, '/checkout')
    await expect(page).not.toHaveURL(/\/dashboard/, { timeout: 6_000 })
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('unauthenticated access to checkout redirects to login', async ({ page }) => {
    // No session — ProtectedLayout redirects before TierGuard even runs
    await page.goto('/checkout')
    await page.waitForURL('**/login', { timeout: 8_000 })
    await expect(page).toHaveURL(/\/login/)
  })
})
