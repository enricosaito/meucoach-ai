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
