import type { Session } from '@supabase/supabase-js'

// TODO(sentry): implement once @sentry/react is wired by worker-3
export function initSentry(): void {}
export function setSentryUser(_session: Session | null): void {}
