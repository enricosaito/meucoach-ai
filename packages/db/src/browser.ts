import { createBrowserClient as createSsrBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'
import type { TypedClient } from './index'

/** Read-only (by RLS) client for browsers. Uses the publishable key and the cookie session. */
export function createBrowserClient(options: { url: string; publishableKey: string }): TypedClient {
  return createSsrBrowserClient<Database>(options.url, options.publishableKey)
}
