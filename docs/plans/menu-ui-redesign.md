# Menu + Product Detail + Cart UI Redesign

**Status:** Draft spec — awaiting approval before implementation
**Date:** 2026-04-17
**Owner:** ai@msoans.com
**Inspiration:** Suiten Restaurant (middle + right screens) + Gemini UX review
**Brand:** GoldRush gold #D4A574, serif headings, Inter body, 6px radius

---

## Headline

Move the menu from a **flat text list** to a **category-led storefront** with Suiten-style product detail and order summary. Keep the existing React structure (`MenuBrowseScreen`, `ProductDetailSheet`, `CartDrawer`, `ShopCheckoutScreen`) — no new routes or data models.

---

## Scope

| File | Change level |
|---|---|
| `src/features/ordering/MenuBrowseScreen.tsx` | Major rework (header, category row, product grid) |
| `src/features/ordering/ProductDetailSheet.tsx` | Visual rework (hero, sticky total) |
| `src/features/ordering/CartDrawer.tsx` | Visual rework of item rows + summary |
| `src/features/ordering/ShopCheckoutScreen.tsx` | Align item rows with new cart style |
| No backend changes | Menu API already returns categories + online_products |

---

## Known constraint — product images

- **Cafe products (Petpooja menu) have NO images today** — fields exist but unset
- **Shop products (online_products — Performance Coffee, Hampers) DO have images**
- Suiten's "grid of food photos" look only works once cafe images exist
- Plan handles this with an image-optional grid + branded placeholder, so we can ship UI now and assets later

---

## 1. Menu / Shop screen (`MenuBrowseScreen.tsx`)

### Header block

```
┌─────────────────────────────────────┐
│ Welcome back, [Name]          [≡]   │  ← optional greeting (skip if not logged in)
│ GoldRush Jubilee Hills              │  ← store name, serif, larger
│ ● Open Now · Pickup ~15 min         │  ← HOISTED status + prep time
└─────────────────────────────────────┘
```

Changes:
- Drop per-card "Pickup ~15 min" pill → hoist once into header next to "Open Now"
- Store name becomes larger serif (matches Suiten "Welcome to Suiten Restaurant" weight)
- Remove the Table/location chip (we're pickup-only for now)

### Search bar
- Keep existing; stack below header

### Categories section (the main visible change)

```
┌─────────────────────────────────────┐
│ Categories            [ ▦ grid ]    │  ← section title + right-side filter icon
│                                     │
│ ( ☕ Hot Coffee ) ( 🧊 Cold Coffee ) │  ← taller pills, icon + label
│ ( 🥤 Shakes ) ( 🥪 Sandwiches ) ...  │  ← horizontal scroll, sticky on scroll
└─────────────────────────────────────┘
```

Changes:
- **Remove the "All" pill** — first category selected on load
- **"Categories" section header** above the pill row (serif, matches Suiten)
- **Taller, rounded pills (~44px h)** with small emoji/icon + label (not circular thumbnail — avoids per-category asset need)
- **Selected pill**: gold bg + white text (current behavior kept)
- **Unselected pill**: white bg, `#E8DDD0` border
- **Sticky on scroll** with scroll-spy (active pill auto-updates as user scrolls sections)
- Icon strategy: use emoji as v1 (zero asset work); upgrade to SVG per-category later

### Product grid (replaces flat list)

Suiten-style 2-column grid, with graceful image-absent fallback.

```
┌─────────────┐ ┌─────────────┐
│ ┌─────────┐ │ │ ┌─────────┐ │
│ │  image  │ │ │ │ ■ fallbk│ │  ← fallback = gold monogram on muted bg
│ │ or logo │ │ │ │         │ │
│ └─────────┘ │ │ └─────────┘ │
│ Classic     │ │ Cappuccino  │
│ Latte       │ │             │
│ ₹220        │ │ ₹200    [+] │
│         [+] │ │             │
└─────────────┘ └─────────────┘
```

Card spec:
- Square image area (1:1), rounded 6px
- **Fallback when image missing**: muted bg `#F5EFE9` with centered gold "GR" monogram (serif) — brand-consistent, not generic grey
- Product name, serif, 14px, 2 lines max
- Price in gold `#D4A574`, bold
- `+` button bottom-right, 32px gold square, serves as quick-add for simple items
- Tapping anywhere **except +** opens ProductDetailSheet (for items with addons, tapping + also opens the sheet)
- **No description** on card (moves to detail sheet — saves vertical space)
- Scrollable vertical grid, 12px gap

### Sections within a category
If the selected category has sub-groupings (future), render sticky section headers inside the grid. For v1, flat grid under the selected pill.

### Bottom of screen
- Keep existing `FloatingCartButton` (bottom-right)
- Keep existing bottom nav

---

## 2. Product Detail sheet (`ProductDetailSheet.tsx`)

Align with Suiten middle screen. Currently a bottom sheet with no image — upgrade to hero + body.

```
┌─────────────────────────────────────┐
│ [←]                          [···]  │  ← overlay back + menu on image
│                                     │
│     FULL-BLEED HERO IMAGE           │  ← 260-300px, fallback = gold monogram
│     (or monogram fallback)          │
│                                     │
├─────────────────────────────────────┤  ← sheet top edge, rounded 16px, overlaps image
│ Classic Latte    ✓                 │  ← title + verified check if bestseller
│ Rich & Creamy                       │  ← short tagline (uses existing .description)
│                                     │
│ ★ 4.9 (120)            ₹220        │  ← rating (optional, hide if no data) + price
│                                     │
│ Full description text here blah     │
│ blah blah blah…                     │
│                                     │
│ ── Add Ons ────────────────────     │
│ ┌─────────────────────────────────┐ │
│ │ Oat Milk (+₹30)       [−] 0 [+] │ │  ← stepper for multi-select addons
│ │ Extra Shot (+₹40)     [−] 1 [+] │ │
│ │ Vanilla Syrup (+₹20)    [ + ]   │ │  ← + for not-yet-added
│ └─────────────────────────────────┘ │
│                                     │
│ ── Milk Choice · Choose 1 ─────     │  ← required radio group
│  ○ Whole Milk      ● Skim Milk      │
│                                     │
│ Notes                               │
│ ┌─────────────────────────────────┐ │
│ │ Any special requests?           │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ Total: ₹260          [Add to Cart]  │  ← STICKY bottom bar
└─────────────────────────────────────┘
```

Changes:
- Hero image region at top of sheet (260-300px), sheet content overlaps by 16px w/ rounded corners
- Back arrow + overflow menu as overlay buttons on image (white circular bg, like Suiten)
- Bestseller check ✓ next to title only if we flag the SKU as bestseller (future)
- Rating line: hide entirely when no review data (v1 — no rating system yet)
- **Addon groups stay functional** but switch UI: single-select (`max_selection=1`, `min=1`) → radio row; multi-select → stepper per addon
- **Sticky footer bar**: total left, CTA right (replaces current inline row) — always visible during scroll
- Quantity stepper moves into the sticky bar, left of total

---

## 3. Cart / Order Summary (`CartDrawer.tsx`)

Align Cafe tab item rows with Suiten right screen. Shop tab already close — minor polish only.

### Item row (cafe)
```
┌─────────────────────────────────────┐
│ ┌──┐  Classic Latte       [−] 2 [+] │
│ │img│  Oat milk, Extra shot         │
│ └──┘  ₹260                          │
└─────────────────────────────────────┘
```
- **72×72 thumbnail on left** (image or monogram fallback) — new
- Name + addon summary + unit price stacked
- Stepper on the right (existing, but bigger tap target)
- Remove button becomes swipe-to-delete OR a small × icon (replaces red text link)

### Order summary block
Add Suiten's promo code field between items and payment summary.

```
── Have a Promo Code? ──────────────
┌─────────────────────────────┐
│ [SUITENDISC5%]       [Enter]│  ← input + apply button
└─────────────────────────────┘
✓ Promo Applied: GR10 -10% off     ← green success line after apply

── Payment Summary ───────────────
Subtotal                    ₹520
Tax & Service (18%)          ₹93
Promo (10%)                 -₹52
────────────────────────────────
Total Payment               ₹561   ← bold, gold
```

Changes:
- Add promo field (UI only for now — wire to backend later if not already)
- Rename "GST (est. 18%)" → "Tax & Service"
- Strong total line at bottom in gold

### Sticky footer
Current has single CTA. Suiten right has two: "Order & Pay Now" (secondary) + "Order Now" (primary). Keeping **single primary CTA** for v1 — simpler, matches our flow (payment is picked above).

### Order type + Payment sections
Keep as-is for now (Pickup / Delivery / Dine-in and COD / Online / Card). Consider collapsing into a single "Pickup" pill since we're pickup-only — **flag for decision**.

---

## 4. Member-tier pricing display (across screens)

Not implemented today. Add once tier discount logic is wired:

- **Non-member**: `₹220`
- **Pro member**: `₹220` with small `Pro ₹198` chip below (using `#A0826D`)
- **Elite member**: large `₹190` in gold + `₹220` strikethrough secondary + "Elite" chip (using `#C9A961`)

Out of scope for this pass — spec noted for later.

---

## Phased rollout

### P1 — Structure only (no assets)
1. Remove "All" pill, default-select first category
2. Add "Categories" section header with grid icon on right
3. Beef up pills (height, emoji icon, sticky on scroll)
4. Hoist "Pickup ~15 min" to store header
5. Switch product list → 2-col grid with image-optional cards (gold "GR" monogram fallback for cafe items that lack images)
6. Cart: add 72² thumbnails (monogram fallback), promo code UI (stub action), rename summary rows

### P2 — Image-dependent polish (needs content team)
1. Shoot/source cafe product images (Petpooja product image field)
2. ProductDetailSheet hero image (260-300px, fallback monogram)
3. Bestseller flag surfacing

### P3 — Personalization / pricing
1. Tier-aware price display (Pro/Elite chips + strikethrough)
2. "Your usuals" block at top for returning members
3. Scroll-spy on category pills (requires section anchors in grid)
4. Rating system (if added to menu)

---

## Decisions needed (open questions)

1. **Emoji vs SVG icons for category pills** — emoji is zero-effort; SVG matches premium brand better. Recommendation: **emoji for P1, SVG for P2**.
2. **Keep `Pickup / Delivery / Dine-In` order type selector?** — user said "pickup-only for now". If so, hide the selector entirely for v1. **Need confirmation.**
3. **Promo code — wire to existing loyalty-rewards / loyalty-redeem flow, or stub UI only?** Loyalty edge functions exist in backend. **Need confirmation whether to integrate in P1.**
4. **Bottom sheet vs full-screen for ProductDetail?** — Current is bottom sheet. Suiten uses a nearly full-screen card. Recommendation: **keep bottom sheet, raise to 92vh** so hero feels full.
5. **Shop products ("online_products") in same grid as cafe, or separate "Shop" subcategory?** — Current mixes them. Gemini/Suiten pattern implies same grid. **Recommendation: keep mixed under "All"-style view; category pill filters still work.**

---

## Acceptance criteria

- [ ] `MenuBrowseScreen` renders with no "All" pill; first category pre-selected
- [ ] Category pills ≥44px tall, emoji-prefixed, horizontally scrollable, sticky on scroll
- [ ] "Pickup ~15 min" appears exactly once (in header), not on any card
- [ ] Products render in 2-col grid; each card shows image or gold-monogram fallback
- [ ] Tapping card opens detail sheet; tapping `+` on a simple item quick-adds to cart, on a customizable item opens detail sheet
- [ ] `ProductDetailSheet` has hero image area (fallback-safe) and sticky bottom total + CTA
- [ ] `CartDrawer` item rows have 72² thumbnail; summary has promo code field + "Tax & Service" label
- [ ] No regressions: cart add/remove/qty, order placement, Razorpay shop flow all still work
- [ ] Tests pass: `src/__tests__/*`, `src/features/*/__tests__/*`

---

## Risks

- **Empty-image grid looks weak in production until cafe photos land** → mitigated by branded gold-monogram fallback (not generic grey)
- **Grid cards may feel too dense on small phones** → test at iPhone SE width (375px); fall back to 1-col below 340px if needed
- **Sticky pills + scroll-spy requires section anchors** → deferred to P3; P1 pills sticky but not scroll-spy
- **Promo code UI without backend = dead button** → either wire to loyalty-redeem in P1 or hide until P3

---

## Verification plan

- Visual: run dev server, walk through Menu → Detail → Cart → Order Type → Place Order on mobile viewport
- Regression: existing tests in `contexts/__tests__/CartContext.test.tsx`, `features/orders/__tests__/useReorder.test.tsx`
- Store-closed state still blocks + button (disabled) and Place Order CTA
- Shop (Performance Coffee / Hampers) still routes through Razorpay via `ShopCheckoutScreen`

---

## Not in this plan

- Backend changes (none needed)
- Order tracking screens (different ticket)
- Dashboard screens (different ticket)
- Design-system refactor / CSS variable changes
