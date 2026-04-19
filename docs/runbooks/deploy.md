# Deployment Runbook — Customer App

## Environments

| Env | URL | Secrets Set | Branch |
|-----|-----|-------------|--------|
| **dev** | http://localhost:5173 | `.env.local` | any |
| **staging** | https://staging.goldrush.app | Vercel Env Vars | `main` |
| **prod** | https://goldrush.app | Vercel Env Vars | `main` tagged release |

See [Backend Deploy Runbook](../../grsc-backend/docs/runbooks/deploy.md) for coordinating backend secrets and edge function deployments.

## Where Secrets Are Set

### Development
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Edit `.env.local` with real Supabase credentials and test values.
3. Local dev server reads `.env.local` automatically.

### Staging & Production
All secrets set in **Vercel Dashboard** under **Settings → Environment Variables**:

1. Go to https://vercel.com
2. Select **grsc-customer-app** project
3. **Settings → Environment Variables**
4. For each var in `.env.example`:
   - Add `Name` (e.g., `VITE_SUPABASE_URL`)
   - Paste `Value` (e.g., production Supabase URL)
   - Select `Environments`: **Preview**, **Production** (or **Preview** only for staging)
5. Click **Save**

**Critical vars** (Vercel encrypts these):
- `VITE_SENTRY_DSN`
- `VITE_RAZORPAY_KEY_ID`
- `VITE_SUPPORT_WHATSAPP_E164`
- `VITE_SUPABASE_ANON_KEY` (never commit real values)

## Deploy Customer App to Vercel

### From CLI (recommended for CI/CD)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to staging (preview)
vercel --prod=false

# Deploy to production
vercel --prod
```

### From GitHub (automatic on merge to main)
1. Merge PR to `main`
2. Vercel auto-deploys to staging
3. For production: create a git tag or manual trigger in Vercel dashboard

## Verify Deployment

```bash
# Check Vercel deployment status
vercel status

# Test production endpoint
curl https://goldrush.app/api/health
```

## Rotate a Secret

### In Vercel
1. Go to Vercel Dashboard → **grsc-customer-app** → **Settings → Environment Variables**
2. Edit the variable (e.g., `VITE_SENTRY_DSN`)
3. Paste the new value
4. Click **Save**
5. Vercel auto-redeploys to affected environments

### In Local Dev
1. Update `.env.local` with the new value
2. Restart dev server (`Ctrl+C` then `npm run dev`)

## Cross-repo Coordination

**Backend secrets** (Razorpay, WooCommerce webhooks) are managed separately in the Supabase CLI. See [Backend Deploy Runbook](../../grsc-backend/docs/runbooks/deploy.md) for:
- How to rotate `RAZORPAY_KEY_SECRET`, `WC_WEBHOOK_SECRET`
- How to deploy edge functions that consume these secrets
- How webhook URLs reference the backend domain

**Supabase credentials** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are **shared** across both repos. Update both `.env` files if the Supabase project changes.

## Troubleshooting

**Variables not taking effect after deploy?**
- Clear browser cache: DevTools → Storage → Clear All
- Wait 5min for Vercel CDN to refresh
- Check **Deployments** in Vercel dashboard for latest build date

**Build fails with "undefined VITE_*"?**
- Verify all `VITE_*` vars from `.env.example` are set in Vercel dashboard
- Check spelling (case-sensitive)
- Restart build in Vercel UI

**Sentry not capturing errors?**
- Verify `VITE_SENTRY_DSN` is set and not empty
- Check Sentry project settings: https://sentry.io
