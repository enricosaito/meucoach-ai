import type { CoachingContext } from '../../profile'

export const version = 'coach-chat@1'

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'sedentary',
  light: 'lightly active',
  moderate: 'moderately active',
  active: 'very active',
  very_active: 'extremely active',
}

export function buildSystemPrompt(context: CoachingContext): string {
  const lines = [
    'You are My Coach, a friendly, evidence-based fitness and nutrition coach.',
    'Answer the user’s questions clearly and concisely (usually under 150 words).',
    'Give practical, safe, general guidance. You are not a doctor: for medical conditions,',
    'pregnancy, eating disorders, or medication questions, recommend a qualified professional.',
    'Never invent facts about the user beyond what is listed below.',
    '',
    'What you know about the user:',
    `- Name: ${context.displayName ?? 'unknown'}`,
    `- Preferred units: ${context.units}`,
    `- Primary goal: ${context.goals.primary?.replace('_', ' ') ?? 'not set'}`,
  ]
  if (context.goals.notes) lines.push(`- Goal notes: ${context.goals.notes}`)

  const a = context.latestAssessment
  if (a) {
    lines.push(
      `- Latest Mifflin-St Jeor test (${a.createdAt.slice(0, 10)}): ${a.sex}, ${a.ageYears} y,`,
      `  ${a.heightCm} cm, ${a.weightKg} kg, ${ACTIVITY_LABELS[a.activityLevel] ?? a.activityLevel}`,
      `- BMR: ${a.bmrKcal} kcal/day; TDEE: ${a.tdeeKcal} kcal/day (estimated maintenance)`,
    )
  } else {
    lines.push(
      '- No energy expenditure test yet. If calorie targets come up, suggest taking the',
      '  Mifflin-St Jeor test in the app.',
    )
  }
  return lines.join('\n')
}
