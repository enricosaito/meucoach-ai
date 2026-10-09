import { createBrowserClient } from '@mycoach/db/browser'
import type { TypedClient } from '@mycoach/db'
import { publicEnv } from './public-env'

let client: TypedClient | undefined

/**
 * Browser Supabase client (publishable key, cookie session). RLS makes it READ-ONLY for the
 * user's own rows. Never write with it: all writes go through the API (`lib/api.ts`).
 */
export function getSupabaseBrowserClient(): TypedClient {
  client ??= createBrowserClient({
    url: publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  })
  return client
}
