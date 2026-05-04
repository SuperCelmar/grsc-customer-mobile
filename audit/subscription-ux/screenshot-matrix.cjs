/**
 * Subscription UX screenshot matrix — AC-12/AC-13 evidence
 * Runs against dev server at http://localhost:5174/
 * States driven by ?subState= QA override in useSubscription.ts
 *
 * Usage: node audit/subscription-ux/screenshot-matrix.js
 */
const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const BASE = 'http://localhost:5174'
const OUT = path.join(__dirname)

const STATES = ['none', 'active', 'active-edit-window', 'paused', 'expired']

const TABS = [
  { name: 'home',    path: '/' },
  { name: 'shop',    path: '/order' },
  { name: 'reorder', path: '/orders' },
  { name: 'subs',    path: '/subscriptions' },
  { name: 'account', path: '/account' },
]

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro
    deviceScaleFactor: 2,
  })

  for (const state of STATES) {
    for (const tab of TABS) {
      const url = `${BASE}${tab.path}?subState=${state}`
      const page = await context.newPage()
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 })
        await page.waitForTimeout(800) // let animations settle
        const filename = path.join(OUT, `${tab.name}-${state}.png`)
        await page.screenshot({ path: filename, fullPage: false })
        console.log(`CAPTURED: ${filename}`)
      } catch (err) {
        console.error(`FAILED: ${tab.name}-${state} — ${err.message}`)
      } finally {
        await page.close()
      }
    }
  }

  await browser.close()
  console.log('Screenshot matrix complete.')
}

main().catch(err => { console.error(err); process.exit(1) })
