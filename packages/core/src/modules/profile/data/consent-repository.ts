import { dbError, type AdminClient } from '../../../shared'
import type { ConsentKind } from '../schemas'

const UNIQUE_VIOLATION = '23505'

export async function findActiveConsent(
  db: AdminClient,
  userId: string,
  kind: ConsentKind,
): Promise<{ id: string; version: number; granted_at: string } | null> {
  const { data, error } = await db
    .from('consents')
    .select('id, version, granted_at')
    .eq('user_id', userId)
    .eq('kind', kind)
    .is('revoked_at', null)
    .maybeSingle()
  if (error) throw dbError('findActiveConsent', error)
  return data
}

/** Grants consent. Idempotent: an existing active consent of the same kind is kept. */
export async function insertConsent(
  db: AdminClient,
  userId: string,
  kind: ConsentKind,
  version: number,
): Promise<void> {
  const { error } = await db.from('consents').insert({ user_id: userId, kind, version })
  if (error && error.code !== UNIQUE_VIOLATION) throw dbError('insertConsent', error)
}

export async function revokeActiveConsent(
  db: AdminClient,
  userId: string,
  kind: ConsentKind,
): Promise<void> {
  const { error } = await db
    .from('consents')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('kind', kind)
    .is('revoked_at', null)
  if (error) throw dbError('revokeActiveConsent', error)
}
