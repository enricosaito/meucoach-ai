import type { Logger } from '@mycoach/core/shared'
import type { AdminClient } from '@mycoach/db'

export interface OutboxEvent {
  id: string
  name: string
  data: Record<string, unknown>
}

/** Sends a batch of events. The event `id` lets the receiver de-duplicate re-sends. */
export type SendEvents = (events: OutboxEvent[]) => Promise<void>

export const OUTBOX_BATCH_SIZE = 100

/**
 * Moves undispatched outbox rows to the event bus, oldest first, then marks them dispatched.
 * At-least-once: if marking fails after sending, the rows are re-sent next time and the bus
 * drops the duplicates by event id. Platform table, so the jobs package owns this query.
 */
export async function dispatchOutbox(
  db: AdminClient,
  send: SendEvents,
  logger: Logger,
): Promise<number> {
  const { data: rows, error } = await db
    .from('outbox_events')
    .select('id, type, payload')
    .is('dispatched_at', null)
    .order('created_at', { ascending: true })
    .limit(OUTBOX_BATCH_SIZE)
  if (error) throw new Error(`outbox read failed: ${error.message}`)
  if (rows.length === 0) return 0

  await send(
    rows.map((row) => ({
      id: row.id,
      name: row.type,
      data: row.payload as Record<string, unknown>,
    })),
  )

  const { error: markError } = await db
    .from('outbox_events')
    .update({ dispatched_at: new Date().toISOString() })
    .in(
      'id',
      rows.map((row) => row.id),
    )
  if (markError) throw new Error(`outbox mark failed: ${markError.message}`)

  logger.info({ count: rows.length }, 'outbox dispatched')
  return rows.length
}
