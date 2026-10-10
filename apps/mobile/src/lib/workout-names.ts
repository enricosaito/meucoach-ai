import type { Translator } from '@mycoach/i18n'

// Plan days are shown as lettered workouts (A, B, C…), the way gyms in Brazil name a split.
// The AI titles days like "Dia 1 · Superiores"; we keep only the part after the dot.

export function dayLetter(dayIndex: number): string {
  return String.fromCharCode(65 + dayIndex)
}

/** "Treino A · Superiores", or "Treino A" when the title has no name part. */
export function workoutTitle(t: Translator['t'], dayIndex: number, title: string): string {
  const label = t('training.workoutLetter', { letter: dayLetter(dayIndex) })
  const parts = title.split('·')
  const name = parts.length > 1 ? parts.slice(1).join('·').trim() : ''
  return name ? `${label} · ${name}` : label
}
