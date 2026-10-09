import 'server-only'
import { createServerClient } from '@mycoach/db/ssr'
import type { TypedClient } from '@mycoach/db'
import { cookies } from 'next/headers'
import { publicEnv } from './public-env'

/** Cookie-session Supabase client for Server Components and Route Handlers (RLS applies). */
export async function getSupabaseServerClient(): Promise<TypedClient> {
  const cookieStore = await cookies()
  return createServerClient({
    url: publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Safe to ignore: proxy.ts refreshes the session on every request.
        }
      },
    },
  })
}

/** The verified user ID for the current request, or null. */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase.auth.getClaims()
  return typeof data?.claims.sub === 'string' ? data.claims.sub : null
}
