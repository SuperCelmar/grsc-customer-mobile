# Customer App Database Access Boundary Rule

The customer app reads data from the new 8-schema main branch (`gaghicnkogwtprilbuex`) using exactly two access patterns. This document is the canonical decision rule for which pattern to use.

## TL;DR

| Need | Pattern | Example |
|------|---------|---------|
| Simple authenticated read of RLS-bounded lookup data | `supabase.schema('SCHEMA').from('TABLE')` | `supabase.schema('location').from('stores')` |
| Behavioral / multi-table / computed read or any write | `supabase.functions.invoke('FUNCTION_NAME')` | `supabase.functions.invoke('customer-orders')` |
| Touch internal plumbing schemas (`integration`, `crm`) | **Never** | — |

## Allowed schemas for `.schema().from()` access

Only two schemas are reachable via PostgREST from the customer app:

- **`public`** — legacy auth/session helpers and back-compat RPC wrappers (mig 021).
- **`location`** — store-location lookups (initially `location.stores`).

All other domain schemas (`customer`, `loyalty`, `catalog`, `menu`, `ordering`, `crm`, `integration`, `analytics`) are **sealed** from the customer app. Reads and writes must go through edge functions.

## Decision tree

When you need to read or write data, ask:

1. **Is it pure plumbing or service-role-only?** (`integration_inbox`, `integration_dead_letter`, `crm_*`) → **Never** from the customer app. Stop.
2. **Is it a behavioral operation?** (multi-table coordination, computed fields, business rules, mutations of customer state) → **Edge function**. Use existing or extend / add one.
3. **Is it a simple authenticated read of RLS-protected lookup data?** → **`.schema().from()`** if the schema is in the allowed list above. Otherwise, the schema must either be exposed in PostgREST (via backend coordination) or the access must move to an edge function.

## The three breakages (worked examples)

These are the three direct table reads the customer app had before the schema split. Each maps to a different answer in the decision tree.

### `stores` → `location.stores` — schema-aware client

The customer app reads store metadata (`store_id`, `store_name`, `city`, `petpooja_restaurant_id`) at app boot to know which PetPooja outlet to route orders to. This is a plain `SELECT ... WHERE store_name = ?` with RLS allowing all authenticated reads. No business logic, no multi-table join.

```ts
// src/features/ordering/OrderingContext.tsx:25-30
supabase
  .schema('location')
  .from('stores')
  .select('store_id, store_name, city, petpooja_restaurant_id')
  .eq('store_name', TARGET_STORE_NAME)
  .single()
```

### `orders` (with nested `order_fulfillment_events`) → `customer-orders` edge fn

Reading an order detail means joining `ordering.orders` with `ordering.order_fulfillment_events` and filtering by `customer_id = auth.uid()`. Multi-table, RLS-bounded by customer, and the fulfillment-events shape is a backend concern that may evolve. This is behavioral — keep it behind a function boundary.

```ts
// src/features/orders/lib/fetchOrderWithRetry.ts
const { data } = await supabase.functions.invoke('customer-orders', {
  body: { order_id, include_events: true }
})
```

### `customer_addresses` → dropped feature

The `customer_addresses` table was dropped in migration `2026-05-cutover/016`. Address data now lives as columns on `customer.customers.address_*`. The customer app dropped the multi-address UI and surfaces a single address via `customer-profile` GET output and a profile-update edge function. There is no `.schema('customer')` access — the `customer` schema is sealed.

## Why not just use `.schema()` for everything?

Three reasons:

1. **Behavioral logic belongs server-side.** Computing tier-upgrade thresholds, coordinating order + payment + loyalty writes, applying coupon rules — these are business operations, not data access. Putting them in the client couples the UI to backend internals.
2. **Schema names are stable but table layout isn't.** Edge functions hide table layout from the client; the backend can refactor `ordering.*` without breaking the customer app. With direct `.schema('ordering').from(...)` reads, every column rename or join change ripples to the client.
3. **Exposure sprawl risk.** Every schema added to PostgREST `exposed_schemas` widens the public API surface. Every table created in an exposed schema joins the API surface unless GRANTs and RLS are explicitly tightened. Keeping the exposure list short (currently 2 schemas: `public`, `location`) is hygiene.

## Why not edge functions for everything?

The stores lookup is pure ceremony as an edge function — no business logic, no coordination. Adding a cold-start round-trip for one `SELECT ... WHERE name = ?` on app boot is a measurable latency cost. The schema-aware client is honest about the data boundary: this is public lookup data with RLS in place.

## When the boundary needs to change

If the customer app legitimately needs to read another `location.*` table (e.g. `location.store_hours`, `location.holiday_calendar`):

1. Add the new table to PostgREST `exposed_schemas` (already done at the schema level — only the table-exposure toggle is needed in Supabase Dashboard → Data API settings).
2. Confirm `SELECT` RLS for `authenticated` on the new table.
3. Use `.schema('location').from('the_new_table')`.

If the customer app legitimately needs data from a sealed schema (e.g. `loyalty`, `catalog`, `menu`):

1. Author or extend an edge function that returns the needed shape.
2. Do NOT request that the schema be exposed.
3. Update the relevant feature code to call `supabase.functions.invoke(...)`.

If you find yourself wanting to bypass this rule for performance: the answer is almost always to extend an existing edge function rather than expose a new schema. Edge functions are cheap; PostgREST exposure is one-way unless you are willing to break clients.

## ESLint guard

A `no-restricted-syntax` rule in this repo blocks calls to `supabase.schema()` for any schema other than `public` or `location`. CI fails on violations. The rule is the mechanical floor; this document is the conceptual ceiling.

## References

- Spec: `2.GRSC/.omc/specs/deep-interview-grsc-customer-app-multischema-adapt.md` (deep-interview output, Round 8 in particular)
- Plan: `2.GRSC/.omc/plans/grsc-customer-app-multischema-adapt.md` (consensus output, Step 6f and ADR)
- Migration package: `453.grsc-backend/migrations/2026-05-cutover/`
