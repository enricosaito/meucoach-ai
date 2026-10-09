import type { ChatTurn } from '../ai/types'

export const MAX_HISTORY_TURNS = 20

/**
 * Builds the message list sent to the model: the most recent `maxTurns` history turns
 * (oldest first) followed by the new question. The list must start with a user turn,
 * so any leading assistant turns left after trimming are dropped.
 */
export function buildChatWindow(
  historyOldestFirst: readonly ChatTurn[],
  question: string,
  maxTurns: number = MAX_HISTORY_TURNS,
): ChatTurn[] {
  const recent = maxTurns > 0 ? historyOldestFirst.slice(-maxTurns) : []
  const firstUser = recent.findIndex((turn) => turn.role === 'user')
  const trimmed = firstUser === -1 ? [] : recent.slice(firstUser)
  return [...trimmed, { role: 'user', content: question }]
}
