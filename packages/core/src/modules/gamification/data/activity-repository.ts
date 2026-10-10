import { dbError, type AdminClient } from '../../../shared'

/** Logs an active day. Idempotent: the (user_id, day) primary key absorbs repeats. */
export async function insertActivityDay(
  db: AdminClient,
  userId: string,
  day: string,
): Promise<void> {
  const { error } = await db
    .from('activity_days')
    .upsert({ user_id: userId, day }, { onConflict: 'user_id,day', ignoreDuplicates: true })
  if (error) throw dbError('insertActivityDay', error)
}

/** Active days on or after `since` (YYYY-MM-DD), oldest first. */
export async function listActivityDays(
  db: AdminClient,
  userId: string,
  since: string,
): Promise<string[]> {
  const { data, error } = await db
    .from('activity_days')
    .select('day')
    .eq('user_id', userId)
    .gte('day', since)
    .order('day', { ascending: true })
  if (error) throw dbError('listActivityDays', error)
  return data.map((row) => row.day)
}
