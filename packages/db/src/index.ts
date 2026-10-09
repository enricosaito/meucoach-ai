import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export type { Database, Json, Tables, TablesInsert, TablesUpdate } from './database.types'

/** A Supabase client typed against the generated schema. */
export type TypedClient = SupabaseClient<Database>

/**
 * Service-role client. Bypasses RLS: every query made with it MUST be scoped by the verified
 * user ID. Only ever constructed on the server (see `@mycoach/db/admin`).
 */
export type AdminClient = TypedClient
