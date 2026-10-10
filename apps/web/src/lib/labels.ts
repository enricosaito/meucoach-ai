import type { ActivityLevel, GOAL_TYPES } from '@mycoach/core/profile/contracts'

type GoalType = (typeof GOAL_TYPES)[number]

export const GOAL_LABELS: Record<GoalType, { label: string; description: string }> = {
  lose_fat: { label: 'Lose fat', description: 'Lean out while keeping muscle' },
  maintain: { label: 'Maintain', description: 'Stay where you are, feel better' },
  build_muscle: { label: 'Build muscle', description: 'Get stronger and add size' },
  improve_health: { label: 'Improve health', description: 'Energy, sleep and habits' },
}

export const ACTIVITY_LABELS: Record<ActivityLevel, { label: string; description: string }> = {
  sedentary: { label: 'Sedentary', description: 'Desk job, little or no exercise' },
  light: { label: 'Lightly active', description: 'Exercise 1–3 days a week' },
  moderate: { label: 'Moderately active', description: 'Exercise 3–5 days a week' },
  active: { label: 'Very active', description: 'Hard exercise 6–7 days a week' },
  very_active: { label: 'Extremely active', description: 'Physical job or training twice a day' },
}

export function formatKcal(value: number): string {
  return value.toLocaleString('en-US')
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function greeting(date = new Date()): string {
  const hour = date.getHours()
  if (hour < 5) return 'Good evening'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export const COACH_SUGGESTIONS = [
  'How much protein should I eat each day?',
  'How many calories should I eat to reach my goal?',
  'What’s a simple weekly workout plan for me?',
]
