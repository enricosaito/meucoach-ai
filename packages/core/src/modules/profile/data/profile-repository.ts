import { dbError, type AdminClient } from '../../../shared'
import type { Tables, TablesUpdate } from '@mycoach/db'

export type ProfileRow = Tables<'profiles'>

// Every query is scoped by userId: the admin client bypasses RLS.

export async function findProfile(db: AdminClient, userId: string): Promise<ProfileRow | null> {
  const { data, error } = await db.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw dbError('findProfile', error)
  return data
}

export async function updateProfileRow(
  db: AdminClient,
  userId: string,
  patch: TablesUpdate<'profiles'>,
): Promise<ProfileRow | null> {
  const { data, error } = await db
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select('*')
    .maybeSingle()
  if (error) throw dbError('updateProfileRow', error)
  return data
}
