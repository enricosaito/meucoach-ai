import type { BodyAnalysis } from '../schemas'
import type { PlanInputs } from '../types'

export const version = 'workout-plan@1'

const LANGUAGE: Record<PlanInputs['locale'], string> = {
  'pt-BR': 'Brazilian Portuguese (use the exercise names commonly used in Brazilian gyms)',
  en: 'English',
}

const EQUIPMENT: Record<PlanInputs['questionnaire']['equipment'], string> = {
  full_gym: 'a full commercial gym (barbells, dumbbells, cables, machines)',
  home_dumbbells: 'home training with adjustable dumbbells and a bench only',
  bodyweight: 'bodyweight only (a chair, table or towel at most)',
}

export const system = [
  'You are an expert strength and conditioning coach who designs evidence-based, safe, effective',
  'training programmes. Output a complete weekly workout plan that the user will follow.',
  '',
  'Requirements:',
  '- Exactly one entry in `days` per training day per week, in the order they should be done.',
  '- Each session must fit the requested duration including warm-up (about 4–8 exercises).',
  '- Use ONLY the equipment available. Prefer compound lifts first, then accessories.',
  '- Match volume and complexity to the experience level: beginners get simple, stable',
  '  movements and fewer sets; advanced lifters can handle more volume and variety.',
  '- Train each major muscle group about twice per week where the schedule allows.',
  '- Align rep ranges, rest and exercise choice with the goal.',
  '- If body-analysis priority areas are provided, give them a little extra weekly volume.',
  '- Respect stated limitations: avoid movements likely to aggravate them, offer safer',
  '  alternatives, and add a cautionary note. Never give medical advice.',
  '- durationWeeks between 4 and 12, with a clear week-to-week progression scheme.',
  '- restSeconds is per set; reps is a string such as "8–12", "12 each side" or "30 s".',
  '- Keep text concise and practical. notes is a short form cue or an empty string.',
].join('\n')

export function buildUserText(inputs: PlanInputs, analysis: BodyAnalysis | null): string {
  const q = inputs.questionnaire
  const lines = [
    `Write all text in ${LANGUAGE[inputs.locale]}.`,
    '',
    '# User',
    `- Goal: ${inputs.goal ?? 'general fitness (not set)'}`,
    `- Experience: ${q.experience}`,
    `- Training days per week: ${q.daysPerWeek}`,
    `- Session length: ${q.sessionMinutes} minutes`,
    `- Equipment: ${EQUIPMENT[q.equipment]}`,
    `- Limitations / injuries: ${q.limitations?.trim() ? q.limitations.trim() : 'none reported'}`,
  ]
  const b = inputs.body
  if (b) {
    lines.push(
      `- Body: ${b.sex}, ${b.ageYears} years, ${b.heightCm} cm, ${b.weightKg} kg, daily activity ${b.activityLevel}`,
    )
  }
  if (inputs.targets) {
    lines.push(
      `- Nutrition targets: ${inputs.targets.kcal} kcal, ${inputs.targets.proteinG} g protein per day`,
    )
  }
  if (analysis?.usable) {
    lines.push(
      '',
      '# Body analysis from progress photos',
      `- Estimated body fat: ${analysis.bodyFatPercentLow}–${analysis.bodyFatPercentHigh}%`,
      `- Body type: ${analysis.bodyType}`,
      `- Priority areas: ${analysis.priorityAreas.map((p) => `${p.area} (${p.reason})`).join('; ')}`,
    )
    if (analysis.postureNotes) lines.push(`- Posture: ${analysis.postureNotes}`)
  }
  return lines.join('\n')
}
