import type { ChatTurn } from '../ai/types'

export const MAX_HISTORY_TURNS = 20

/** Stands in for the user before a thread that the coach started (the daily check-in). */
export const OPENED_APP_TURN = '[The user opened the app.]'

/**
 * Builds the message list sent to the model: the most recent `maxTurns` history turns
 * (oldest first) followed by the new question. The list must start with a user turn:
 * - when the window holds the whole thread and the coach spoke first (a check-in), that turn is
 *   kept, preceded by a short note that the user opened the app, so the coach remembers what it
 *   asked;
 * - when trimming left a reply whose question was cut off, that reply is dropped.
 */
export function buildChatWindow(
  historyOldestFirst: readonly ChatTurn[],
  question: string,
  maxTurns: number = MAX_HISTORY_TURNS,
): ChatTurn[] {
  const recent = maxTurns > 0 ? historyOldestFirst.slice(-maxTurns) : []
  const wholeThread = recent.length === historyOldestFirst.length
  if (wholeThread && recent[0]?.role === 'assistant') {
    return [
      { role: 'user', content: OPENED_APP_TURN },
      ...recent,
      { role: 'user', content: question },
    ]
  }
  const firstUser = recent.findIndex((turn) => turn.role === 'user')
  const trimmed = firstUser === -1 ? [] : recent.slice(firstUser)
  return [...trimmed, { role: 'user', content: question }]
}
