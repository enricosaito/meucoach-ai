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
  question: ChatTurn['content'],
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

/**
 * A stored message as the model sees it in history. Photos aren't kept, so an earlier photo is
 * a note; voice notes are marked so the coach reads them as speech (filler words, no typos).
 */
export function historyTurn(message: {
  role: 'user' | 'assistant'
  content: string
  hasImage: boolean
  viaVoice: boolean
}): ChatTurn {
  const notes = [
    message.hasImage ? '[The user sent a photo here; it is no longer available.]' : '',
    message.viaVoice ? '[Voice note, transcribed]' : '',
  ].filter(Boolean)
  return {
    role: message.role,
    content: [...notes, message.content].filter(Boolean).join(' '),
  }
}
