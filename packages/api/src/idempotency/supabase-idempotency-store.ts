import type { AdminClient, Json } from '@mycoach/db'
import type { ClaimResult, IdempotencyStore } from './idempotency-store'

const UNIQUE_VIOLATION = '23505'

/** Keys older than this are treated as expired and may be reused. */
export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000

/** Platform table (not a domain module), so the API owns its data access directly. */
export function createSupabaseIdempotencyStore(
  db: AdminClient,
  options: { now?: () => number } = {},
): IdempotencyStore {
  const now = options.now ?? Date.now

  async function release(userId: string, key: string): Promise<void> {
    const { error } = await db
      .from('idempotency_keys')
      .delete()
      .eq('user_id', userId)
      .eq('key', key)
    if (error) throw new Error(`idempotency release failed: ${error.message}`)
  }

  async function claim(
    userId: string,
    key: string,
    requestHash: string,
    attempt = 0,
  ): Promise<ClaimResult> {
    const inserted = await db
      .from('idempotency_keys')
      .insert({ user_id: userId, key, request_hash: requestHash })
    if (!inserted.error) return { kind: 'claimed' }
    if (inserted.error.code !== UNIQUE_VIOLATION || attempt > 1) {
      throw new Error(`idempotency claim failed: ${inserted.error.message}`)
    }

    const { data: existing, error } = await db
      .from('idempotency_keys')
      .select('*')
      .eq('user_id', userId)
      .eq('key', key)
      .maybeSingle()
    if (error) throw new Error(`idempotency lookup failed: ${error.message}`)
    // Released between our insert and select: try again.
    if (!existing) return claim(userId, key, requestHash, attempt + 1)

    if (now() - Date.parse(existing.created_at) > IDEMPOTENCY_TTL_MS) {
      await release(userId, key)
      return claim(userId, key, requestHash, attempt + 1)
    }
    if (existing.request_hash !== requestHash) return { kind: 'mismatch' }
    if (existing.status === 'in_progress' || existing.response_status === null) {
      return { kind: 'in_progress' }
    }
    return { kind: 'replay', status: existing.response_status, body: existing.response_body }
  }

  return {
    claim: (userId, key, requestHash) => claim(userId, key, requestHash),

    async complete(userId, key, status, body) {
      const { error } = await db
        .from('idempotency_keys')
        .update({ status: 'completed', response_status: status, response_body: body as Json })
        .eq('user_id', userId)
        .eq('key', key)
      if (error) throw new Error(`idempotency complete failed: ${error.message}`)
    },

    release,
  }
}
