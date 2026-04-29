import type { Page } from '@playwright/test'

const SUPABASE_URL = 'https://hotymmwjdqnztegxgttb.supabase.co'
// Supabase JS v2 stores session under this key in localStorage
const SUPABASE_SESSION_KEY = 'sb-hotymmwjdqnztegxgttb-auth-token'

/**
 * A fake Supabase session that satisfies AuthContext's `session !== null` check.
 * access_token is 'dev-bypass' — matching what setDevSession() would set.
 * API calls from api.ts won't actually use this token because isDevMock() returns
 * true (grsc_dev_session=1) and short-circuits before any network call.
 */
const FAKE_SESSION = {
  access_token: 'dev-bypass',
  refresh_token: 'dev-bypass-refresh',
  expires_in: 999999,
  expires_at: Math.floor(Date.now() / 1000) + 999999,
  token_type: 'bearer',
  user: {
    id: 'dev-user-001',
    aud: 'authenticated',
    role: 'authenticated',
    phone: '+919999999999',
    phone_confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    app_metadata: { provider: 'phone', providers: ['phone'] },
    user_metadata: {},
  },
}

/**
 * Inject a fake auth session into localStorage and activate the DEV mock data
 * layer via sessionStorage. Must be called before any page.goto().
 *
 * This makes:
 * - AuthContext see a valid session on page load (no redirect to /login)
 * - api.ts return mock data from mock-data.ts (no real network calls)
 * - OrderingContext use mock store IDs (mock-store-001 / mock-rest-001)
 */
export async function injectDevSession(page: Page) {
  await page.addInitScript(
    ({ sessionKey, fakeSession }: { sessionKey: string; fakeSession: object }) => {
      // Supabase JS v2 reads session from localStorage on init
      localStorage.setItem(sessionKey, JSON.stringify(fakeSession))
      // Activate the DEV mock data layer in api.ts and OrderingContext
      sessionStorage.setItem('grsc_dev_session', '1')
    },
    { sessionKey: SUPABASE_SESSION_KEY, fakeSession: FAKE_SESSION }
  )
}

/**
 * Stub Supabase auth endpoints so no real SMS or token exchange fires.
 * Belt-and-suspenders: the DEV bypass skips these anyway, but intercept
 * in case Supabase JS tries to refresh the fake token.
 */
export async function stubSupabaseAuth(page: Page) {
  await page.route(`${SUPABASE_URL}/auth/v1/**`, route => {
    // Allow Supabase JS getSession to "succeed" by returning our fake session
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FAKE_SESSION),
    })
  })
}

/**
 * Full login flow via the phone+OTP UI (tests the actual login screens).
 * Uses VITE_TEST_PHONE=9999999999 bypass — no real SMS sent.
 * After this, session is in React state but NOT persisted to localStorage,
 * so subsequent full-page navigations should use injectDevSession instead.
 */
export async function loginWithTestPhone(page: Page) {
  await stubSupabaseAuth(page)
  await page.goto('/login')
  await page.locator('input[type="tel"]').fill('9999999999')
  await page.locator('button[type="submit"]').click()
  // OTPVerificationScreen auto-submits VITE_TEST_OTP=123456 for the test phone
  await page.waitForURL('**/dashboard', { timeout: 10_000 })
}

/**
 * Navigate directly to a protected route without going through the login UI.
 * Use this for dashboard/menu/cart tests that don't need to test login itself.
 */
export async function gotoProtected(page: Page, path: string) {
  await injectDevSession(page)
  await stubSupabaseAuth(page)
  await page.goto(path)
}
