import { z } from 'zod'
import type { CoachingContext } from '../../profile/contracts'
import { describeFacts, type CheckInFacts } from '../domain/check-in'
import { buildSystemPrompt as buildCoachPrompt } from './coach-chat.v3'

// v1: the daily check-in, the first message the user sees on opening the app each day. Built on
// coach-chat@3 (voice, user context, safety) plus today's facts; returns the message and three
// one-tap replies as structured output.
export const version = 'coach-checkin@1'

// Kept loose for structured outputs (no length constraints in the JSON schema); the service
// trims and caps the values.
export const checkInOutputSchema = z.object({
  message: z.string(),
  quickReplies: z.array(z.string()),
})

export type CheckInOutput = z.infer<typeof checkInOutputSchema>

export function buildSystemPrompt(context: CoachingContext, options: { now?: Date } = {}): string {
  return [
    buildCoachPrompt(context, options),
    '',
    '# Task: today’s check-in',
    'Write the first message the user sees when they open the app today, as their coach checking in. It should make them feel remembered and looked after.',
    '- Two or three short sentences, at most about 50 words, ending with ONE question that is easy to answer.',
    '- Be specific: build on one or two of the facts you are given (how yesterday’s workout felt, an injury or limitation they mentioned, something from the recent conversation, getting back after a break, today’s workout). Prefer what is most personal and recent.',
    '- Never invent facts: no weights, records, events or feelings that are not in the facts.',
    '- No bold, lists or emoji walls here; one emoji at most.',
    '- Also write exactly three quick replies the user could tap to answer you: in their language, first person, at most four words each, and different in tone (one positive, one honest or neutral, one asking for help).',
  ].join('\n')
}

/** The user-turn content: today's facts. */
export function buildUserContent(facts: CheckInFacts): string {
  return ['Facts about the user for today’s check-in:', describeFacts(facts)].join('\n')
}
