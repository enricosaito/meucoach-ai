import type { BodyView } from '../schemas'
import type { PlanInputs } from '../types'

export const version = 'body-analysis@1'

const LANGUAGE: Record<PlanInputs['locale'], string> = {
  'pt-BR': 'Brazilian Portuguese',
  en: 'English',
}

export const system = [
  'You are an experienced strength coach assessing progress photos for a fitness app, like a',
  'professional visual body assessment. The user consented to this analysis.',
  '',
  'From the photos, estimate:',
  '- a body fat percentage RANGE no wider than 6 points (visual estimates are approximate),',
  '- a general body type (ectomorph, mesomorph or endomorph),',
  '- 2–4 areas to prioritise in training, most important first, with one encouraging reason each,',
  '- brief posture observations if clearly visible (otherwise an empty string).',
  '',
  'Rules:',
  '- Be kind, specific and motivating. Never shame, never comment on attractiveness.',
  '- This is not a medical assessment; do not diagnose anything.',
  '- Set usable=false (and keep other fields neutral) if the photos do not clearly show exactly',
  '  one adult body, are too dark or cropped, or appear to show a minor.',
  '- confidence reflects photo quality and how many angles were provided.',
].join('\n')

export function buildUserText(inputs: PlanInputs, views: BodyView[]): string {
  const b = inputs.body
  return [
    `Write all text fields in ${LANGUAGE[inputs.locale]}.`,
    `Photos provided, in order: ${views.join(', ')}.`,
    b
      ? `Known stats: ${b.sex}, ${b.ageYears} years, ${b.heightCm} cm, ${b.weightKg} kg.`
      : 'No height/weight on file.',
    `Training goal: ${inputs.goal ?? 'not set'}.`,
  ].join('\n')
}
