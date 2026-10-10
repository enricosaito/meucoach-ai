import type { MessageKey } from '@mycoach/i18n'

export function greetingKey(date = new Date()): MessageKey {
  const hour = date.getHours()
  if (hour < 5) return 'greeting.evening'
  if (hour < 12) return 'greeting.morning'
  if (hour < 18) return 'greeting.afternoon'
  return 'greeting.evening'
}

export const COACH_SUGGESTION_KEYS = [
  'coach.suggestion1',
  'coach.suggestion2',
  'coach.suggestion3',
] as const satisfies readonly MessageKey[]
