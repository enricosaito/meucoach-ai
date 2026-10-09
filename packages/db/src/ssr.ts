import {
  createServerClient as createSsrServerClient,
  type CookieMethodsServer,
} from '@supabase/ssr'
import type { Database } from './database.types'
import type { TypedClient } from './index'

export { parseCookieHeader, serializeCookieHeader, type CookieMethodsServer } from '@supabase/ssr'

/**
 * Cookie-session client for server code (Next.js server components, proxy, API auth).
 * Uses the publishable key, so RLS applies.
 */
export function createServerClient(options: {
  url: string
  publishableKey: string
  cookies: CookieMethodsServer
}): TypedClient {
  return createSsrServerClient<Database>(options.url, options.publishableKey, {
    cookies: options.cookies,
  })
}
