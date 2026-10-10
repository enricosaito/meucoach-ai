import { dbError, type AdminClient } from '../../../shared'
import type { XpReason } from '../domain/levels'

/**
 * Appends an XP award. Idempotent: the (user_id, reason, source) unique key absorbs repeats.
 * Returns true only when this call created the row.
 */
export async function insertXpEvent(
  db: AdminClient,
  event: { userId: string; reason: XpReason; source: string; amount: number },
): Promise<boolean> {
  const { data, error } = await db
    .from('xp_events')
    .upsert(
      {
        user_id: event.userId,
        reason: event.reason,
        source: event.source,
        amount: event.amount,
      },
      { onConflict: 'user_id,reason,source', ignoreDuplicates: true },
    )
    .select('id')
  if (error) throw dbError('insertXpEvent', error)
  return data.length > 0
}

export async function getXpTotal(db: AdminClient, userId: string): Promise<number> {
  const { data, error } = await db.rpc('gamification_xp_total', { p_user_id: userId })
  if (error) throw dbError('getXpTotal', error)
  return data
}
