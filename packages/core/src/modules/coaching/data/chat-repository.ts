import { dbError, type AdminClient } from '../../../shared'
import type { Tables, TablesInsert } from '@mycoach/db'

export type ChatMessageRow = Tables<'chat_messages'>

/** Most recent messages for a user, returned oldest first. */
export async function listRecentMessages(
  db: AdminClient,
  userId: string,
  limit: number,
): Promise<ChatMessageRow[]> {
  const { data, error } = await db
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw dbError('listRecentMessages', error)
  return data.reverse()
}

/** Inserts the user question and the assistant reply in one statement (atomic). */
export async function insertExchange(
  db: AdminClient,
  rows: [TablesInsert<'chat_messages'>, TablesInsert<'chat_messages'>],
): Promise<[ChatMessageRow, ChatMessageRow]> {
  const { data, error } = await db.from('chat_messages').insert(rows).select('*')
  if (error) throw dbError('insertExchange', error)
  const sorted = [...data].sort((x, y) => x.created_at.localeCompare(y.created_at))
  const [question, reply] = sorted
  if (!question || !reply) throw dbError('insertExchange', { message: 'missing inserted rows' })
  return [question, reply]
}

/** The user's check-in for a local day, if it was already written. */
export async function findCheckIn(
  db: AdminClient,
  userId: string,
  localDate: string,
): Promise<ChatMessageRow | null> {
  const { data, error } = await db
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .eq('kind', 'check_in')
    .eq('local_date', localDate)
    .maybeSingle()
  if (error) throw dbError('findCheckIn', error)
  return data
}

/**
 * Stores a check-in. If another request already stored today's (the unique index on user and
 * local date), returns that one instead, so concurrent opens agree on a single message.
 */
export async function insertCheckIn(
  db: AdminClient,
  row: TablesInsert<'chat_messages'> & { local_date: string },
): Promise<ChatMessageRow> {
  const { data, error } = await db
    .from('chat_messages')
    .insert({ ...row, kind: 'check_in' })
    .select('*')
    .single()
  if (!error) return data
  if (error.code === '23505') {
    const existing = await findCheckIn(db, row.user_id, row.local_date)
    if (existing) return existing
  }
  throw dbError('insertCheckIn', error)
}
