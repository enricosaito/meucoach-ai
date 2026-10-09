import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import type { AdminClient } from './index'

/** Server-only. Never import this from client components or ship the secret key to a client. */
export function createAdminClient(options: { url: string; secretKey: string }): AdminClient {
  return createClient<Database>(options.url, options.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
