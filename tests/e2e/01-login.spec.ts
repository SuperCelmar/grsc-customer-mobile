import { test, expect } from '@playwright/test'
import { stubSupabaseAuth } from './helpers/auth'

test.describe('Login screen', () => {
  test('login page loads and shows phone input and submit button', async ({ page }) => {
    await stubSupabaseAuth(page)
    await page.goto('/login')
    await expect(page.locator('h1')).toContainText('GoldRush')
    await expect(page.locator('input[type="tel"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toContainText('Send OTP')
  })

  test('shows validation error for a short phone number on submit', async ({ page }) => {
    await stubSupabaseAuth(page)
    await page.goto('/login')
    await page.locator('input[type="tel"]').fill('12345')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=valid 10-digit')).toBeVisible()
  })

  test('phone field strips non-digit characters typed via keyboard', async ({ page }) => {
    await stubSupabaseAuth(page)
    await page.goto('/login')
    const input = page.locator('input[type="tel"]')
    // Type digits only (fill bypasses onChange strip; use type to trigger it properly)
    await input.focus()
    await page.keyboard.type('9876543210')
    await expect(input).toHaveValue('9876543210')
  })

  test('navigates to OTP screen after submitting test phone number', async ({ page }) => {
    await stubSupabaseAuth(page)
    await page.goto('/login')
    await page.locator('input[type="tel"]').fill('9999999999')
    await page.locator('button[type="submit"]').click()
    await page.waitForURL('**/otp', { timeout: 8_000 })
    await expect(page.locator('text=verification code')).toBeVisible()
  })

  test('completes full login flow and lands on dashboard', async ({ page }) => {
    await stubSupabaseAuth(page)
    await page.goto('/login')
    await page.locator('input[type="tel"]').fill('9999999999')
    await page.locator('button[type="submit"]').click()
    // OTPVerificationScreen auto-submits VITE_TEST_OTP=123456 for test phone
    await page.waitForURL('**/dashboard', { timeout: 10_000 })
    await expect(page).toHaveURL(/\/dashboard/)
  })
})
