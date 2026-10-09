import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@mycoach/db'
import { createApp, createDefaultDeps, parseApiEnv, type AppDeps } from '../src'

export const env = () => parseApiEnv(process.env)

export function adminClient(): SupabaseClient<Database> {
  const e = env()
  return createClient<Database>(e.NEXT_PUBLIC_SUPABASE_URL, e.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export interface TestUser {
  id: string
  email: string
  accessToken: string
  /** A publishable-key client signed in as this user: what a web/mobile client can do directly. */
  client: SupabaseClient<Database>
}

/** Creates a confirmed user (profile row is created by the signup trigger) and signs it in. */
export async function createTestUser(): Promise<TestUser> {
  const e = env()
  const email = `test-${crypto.randomUUID()}@example.test`
  const password = `pw-${crypto.randomUUID()}`
  const { data, error } = await adminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw error

  const client = createClient<Database>(
    e.NEXT_PUBLIC_SUPABASE_URL,
    e.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
  const signIn = await client.auth.signInWithPassword({ email, password })
  if (signIn.error) throw signIn.error
  return { id: data.user.id, email, accessToken: signIn.data.session.access_token, client }
}

export async function deleteTestUser(user: TestUser | undefined) {
  if (user) await adminClient().auth.admin.deleteUser(user.id)
}

export function testApp(overrides: Partial<AppDeps> = {}) {
  return createApp(createDefaultDeps(env(), overrides))
}

export function authHeaders(user: TestUser, extra: Record<string, string> = {}) {
  return {
    authorization: `Bearer ${user.accessToken}`,
    'content-type': 'application/json',
    ...extra,
  }
}

export const newKey = () => `test-${crypto.randomUUID()}`
