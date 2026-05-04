# Subscription UX Action Bar — AC Audit

**Branch:** `feature/subscription-ux-action-bar`
**Date:** 2026-05-05
**Auditor:** worker-4 (T8 verification)
**Commits audited:** 4c371a4 → 951698b (T1–T7, 7 commits)

---

## Verification Summary

| Check | Result | Detail |
|---|---|---|
| TypeScript (`npx tsc --noEmit`) | **PASS** (exit 0) | Zero errors |
| Lint (`npm run lint`) | **PASS (no regressions)** | 28 errors, all pre-existing on main (baseline 30, delta -2 from prior cleanup). Zero new errors introduced by this branch. |
| Build (`npm run build`) | **PASS** | JS bundle built cleanly (696 kB / 189 kB gzip). PWA workbox oversized-PNG failure is pre-existing (15 unoptimised menu images) — not introduced by this branch. |
| Dev server | **PASS** | Ready at http://localhost:5174/ in 149ms |
| Screenshot matrix | **PASS** | 25 screenshots captured (5 tabs × 5 states) |

---

## AC Audit — Acceptance Criteria 1–14

### Subscription Page (Subs Tab) — Goal #2

- [x] **AC-1** Non-subscriber empty state with CTA: `SubscriptionsSection.tsx` renders empty state with "Browse beans" CTA → `/order?subscribe=1`. Copy: "Subscribe to Performance Coffee and get it delivered on your schedule." AC met. *(Note: copy differs slightly from spec "Start a subscription from any bean's product page" — functionally equivalent, no UX regression.)*

- [x] **AC-2** Active subscriber hero card: `SubscriptionCard` (via `SubscriptionsSection`) shows bean name, variant, next shipment date, status pill, price. `ManageSubscriptionSheet` (T2) added edit-by deadline pill and countdown. AC met.

- [x] **AC-3** Skip next delivery — 1 tap from Subs hero: `ManageSubscriptionSheet` has wired "Skip next" button calling `useSubscriptionActions().skipNext()`. Single tap from hero. AC met.

- [x] **AC-4** Change frequency — 1 tap from hero, 2 options (Biweekly/Monthly): `ManageSubscriptionSheet` has wired frequency picker with Biweekly + Monthly options. *(Spec AC-4 originally stated 4 options; plan revision Section 0 corrected to 2 options matching existing PDP model. Correct.)* AC met.

- [x] **AC-5** Cancel — minimum 2 taps: Cancel link on Subs page → `CancelInterstitialScreen` (route `/subscriptions/cancel`) shows Change Frequency + Skip offers ABOVE "I still want to cancel" link. Cancel requires explicit confirmation dialog (setConfirmCancel flow). 2-tap minimum enforced. AC met.

- [ ] **AC-6** Time-to-skip ≤ 15s (n=5 usability test): Cannot verify mechanically — requires live usability test. Flow is: open app → Home → Subs tab (1 tap) → "Skip next" button (1 tap) = 2 taps total. Code path is optimal. **Deferred to manual usability test.**

---

### Action-Bar Cleverness — Goal #1

- [x] **AC-7** Home tab — 4 state-aware variants: `SubscriptionStateBlock.tsx` implements all 4:
  - `none/cancelled`: acquisition cross-sell card with "Subscribe & save 10%" + "Browse subscribable beans" CTA ✓
  - `active`: countdown "Ships in N days · Edit by [day]" + Skip button + "View subscription →" ✓
  - `paused`: "Resumes in X days" + disabled "Resume now" button (v1.1 placeholder) ✓
  - `expired`: red alert banner "Your subscription paused — payment failed" + "Update payment" CTA → `/account` ✓
  All 4 variants verified via QA `?subState=` override. Screenshots: `home-none.png`, `home-active.png`, `home-paused.png`, `home-expired.png`. AC met.

- [x] **AC-8** Menu tab — 2 affordances:
  1. "IN YOUR SUB" pill on subscribed bean card: `MenuBrowseScreen.tsx:128` renders `IN YOUR SUB` pill when `subscribedProductId === product.id`. ✓
  2. PDP Subscribe & Save toggle with active-subscriber state notice: `VariantPickerSheet.tsx` shows "You're subscribed to this bean" notice when `isSubscribedToThis`, and toggle defaults to subscribed frequency. Non-subscribed active subscriber sees disabled "Swap your subscription to this bean" (v1.1). AC met.

- [x] **AC-9** Reorder tab — 2 affordances:
  1. Convert-to-sub banner on items reordered ≥3 times: `QuickReorderRow.tsx` renders "SAVE 10% / Subscribe — never reorder again →" banner below each non-subscribed top-item card. `topItems.ts` threshold is `MIN_ORDERS_THRESHOLD = 3`. ✓
  2. "Auto-shipping" pill replacing Reorder button for subscribed items: `QuickReorderRow.tsx` renders "Auto-shipping every X" pill instead of `+` button when `topItem.source_item.id === activeSubProductId`. ✓
  Order tags added to `PastOrderCard`: "One-time order" (gray) with TODO for Phase 3.5 `is_subscription` flag. AC met.

- [x] **AC-10** Subs tab badge — dot within 48hr edit window: `BottomNav.tsx:20` computes `subsHasDot = sub?.status === 'active' && sub.inEditWindow`. When true, renders 6px gold (#D4A574) dot with 1.5px white outline at top-right of Subs icon. Verified via `?subState=active-edit-window` QA override. Screenshot: `subs-active-edit-window.png`. AC met.

- [x] **AC-11** Account tab — subscription summary for subscribers only: `SubscriptionAccordion` shows active content (skip button, details, savings snippet "10% off every delivery" + deep-link arrow → `/subscriptions`) when subscription is non-null. Non-subscriber sees empty state with "Subscribe & save 10%" CTA. Visibility controlled by prop `subscription: Sub | null` passed from `AccountScreen`. AC met.

---

### Cross-Cutting

- [ ] **AC-12** All 4 Home state Stitch v2 screen IDs recorded in MEMORY.md: Stitch v2 work is a parallel track. Home state variants implemented in code (T3 `SubscriptionStateBlock`). Stitch screen IDs for subscription-state Home variants are **not yet recorded** — Stitch work was not part of T1–T7 scope. **Deferred: requires Stitch design pass.**

- [x] **AC-13** Subscription state visible from ≥3 of 5 tabs without entering Subs tab: Evidence from code audit:
  - **Home**: `SubscriptionStateBlock` in `DashboardScreen` ✓
  - **Shop/PDP**: "IN YOUR SUB" pill on grid + PDP notice ✓
  - **Reorder**: Auto-shipping pill + convert-to-sub banner + order tags ✓
  - **Account**: `SubscriptionAccordion` shows savings snippet ✓
  4 of 4 non-Subs tabs show subscription state. Screenshots confirm. AC met (exceeds target of 3).

- [x] **AC-14** Brand-system consistency across all new/modified screens:
  - Gold: `#D4A574` ✓ (used in all CTAs, pills, badges)
  - Error/cancel: `#B42C1F` ✓ (`CancelInterstitialScreen`, expired payment banner)
  - Borders: `#E8DDD0` 1px ✓
  - Card bg: `#F5EFE9` / `#E8DDD0` ✓
  - Text: `#1A1410` / `#6B6560` ✓
  - Radius: `rounded-[6px]` / `rounded-md` (6px) ✓
  - Typography: `font-display` for headings (serif), Inter body ✓
  No new shadows introduced. AC met.

---

## AC Summary

| # | Status | Notes |
|---|---|---|
| AC-1 | PASS | Copy slightly rephrased but functionally equivalent |
| AC-2 | PASS | |
| AC-3 | PASS | |
| AC-4 | PASS | 2 options (Biweekly/Monthly) per plan revision |
| AC-5 | PASS | 2-tap minimum enforced via interstitial + confirm dialog |
| AC-6 | DEFERRED | Requires live usability test (n=5) |
| AC-7 | PASS | All 4 variants implemented + screenshots |
| AC-8 | PASS | Grid pill + PDP toggle state |
| AC-9 | PASS | Banner + auto-shipping pill + order tags |
| AC-10 | PASS | Dot indicator on 48hr edit window |
| AC-11 | PASS | Subscriber/non-subscriber visibility correct |
| AC-12 | DEFERRED | Stitch screen IDs not yet recorded (out of T1–T7 scope) |
| AC-13 | PASS | 4 of 5 tabs show subscription state |
| AC-14 | PASS | Brand system consistent across all new screens |

**PASS: 12/14 | DEFERRED: 2/14 (AC-6: usability test, AC-12: Stitch IDs)**

---

## Screenshot Matrix

25 screenshots captured at `audit/subscription-ux/` (5 states × 5 tabs, iPhone 14 Pro 390×844 @2x):

| State | Home | Shop | Reorder | Subs | Account |
|---|---|---|---|---|---|
| none | home-none.png | shop-none.png | reorder-none.png | subs-none.png | account-none.png |
| active | home-active.png | shop-active.png | reorder-active.png | subs-active.png | account-active.png |
| active-edit-window | home-active-edit-window.png | shop-active-edit-window.png | reorder-active-edit-window.png | subs-active-edit-window.png | account-active-edit-window.png |
| paused | home-paused.png | shop-paused.png | reorder-paused.png | subs-paused.png | account-paused.png |
| expired | home-expired.png | shop-expired.png | reorder-expired.png | subs-expired.png | account-expired.png |

---

## Branch Readiness

**Branch is ready for PR.** All critical ACs pass. Two deferred items (AC-6 usability test, AC-12 Stitch IDs) are non-blocking for code merge — they require post-merge activities (usability test session, Stitch design update).

**Do not push** — team-lead handles final push after review.
