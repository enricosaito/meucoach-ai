import { MEAL_SPLITS } from '../domain/meals'
import type { DietQuestionnaire } from '../schemas'
import type { DietInputs } from '../types'

export const version = 'diet-plan@1'

const LANGUAGE: Record<DietInputs['locale'], string> = {
  'pt-BR':
    'Brazilian Portuguese. Use foods, brands-free dish names and household measures common in Brazil (colher de sopa, concha, escumadeira, fatia, unidade)',
  en: 'English. Use common foods and household measures (tbsp, cup, slice, piece)',
}

const STYLE: Record<DietQuestionnaire['dietStyle'], string> = {
  omnivore: 'omnivore (eats everything)',
  pescatarian: 'pescatarian (fish and seafood, eggs and dairy; no other meat)',
  vegetarian: 'vegetarian (eggs and dairy allowed; no meat or fish)',
  vegan: 'vegan (no animal products at all)',
}

const BUDGET: Record<DietQuestionnaire['budget'], string> = {
  economic:
    'tight: favour cheap staples (rice, beans, eggs, chicken, seasonal fruit and vegetables)',
  moderate: 'moderate',
  flexible: 'flexible: any ingredients are fine',
}

const COOKING: Record<DietQuestionnaire['cookingTime'], string> = {
  minimal: 'minimal: little or no cooking, quick assembly, batch-cooking friendly',
  some: 'some: simple recipes up to about 30 minutes',
  enjoy: 'enjoys cooking: more elaborate recipes are welcome',
}

export const system = [
  'You are a registered sports dietitian who designs practical, evidence-based meal plans.',
  'Output one daily meal plan that the user will follow every day.',
  '',
  'Requirements:',
  '- Exactly the requested meals, in the given order, with their `type` and a suggested `time`.',
  '- Each meal has 2 interchangeable options with similar calories (within about 10%) and protein.',
  '- With ANY combination of options, the day must land within 5% of the calorie target and reach',
  '  the protein target. Distribute calories roughly by the given meal shares.',
  '- Give every food a realistic quantity (household measure plus grams or ml) and its protein,',
  '  carbs and fat in grams for that quantity, using standard food composition tables (TACO for',
  '  Brazilian foods). Do NOT state calories: they are computed from the macros.',
  '- NEVER include foods the user is allergic or intolerant to, or any ingredient containing them.',
  '  Avoid disliked foods. Respect the diet style strictly.',
  '- Prefer whole, minimally processed foods; include vegetables at lunch and dinner and fruit',
  '  daily. Match the budget and cooking time.',
  '- No supplements are required; if you include one (e.g. whey), it must be optional elsewhere.',
  '- This is general nutrition guidance, not medical treatment. Never give medical advice.',
  '- Keep text concise and practical. preparation is one short tip or an empty string.',
].join('\n')

export function buildUserText(inputs: DietInputs): string {
  const q = inputs.questionnaire
  const t = inputs.targets
  const b = inputs.body
  const split = MEAL_SPLITS[q.mealsPerDay]
  const meals = split
    .map((m) => `${m.type} (~${String(Math.round(t.kcal * m.share))} kcal, around ${m.time})`)
    .join('; ')
  return [
    `Write all text in ${LANGUAGE[inputs.locale]}.`,
    '',
    '# Daily targets',
    `- Calories: ${String(t.kcal)} kcal`,
    `- Protein: ${String(t.proteinG)} g · Carbs: ${String(t.carbsG)} g · Fat: ${String(t.fatG)} g`,
    '',
    '# User',
    `- Goal: ${inputs.goal ?? 'general health (not set)'}`,
    `- Body: ${b.sex}, ${String(b.ageYears)} years, ${String(b.heightCm)} cm, ${String(b.weightKg)} kg`,
    `- Diet style: ${STYLE[q.dietStyle]}`,
    `- Allergies / intolerances: ${q.allergies?.trim() ? q.allergies.trim() : 'none reported'}`,
    `- Dislikes: ${q.dislikes?.trim() ? q.dislikes.trim() : 'none reported'}`,
    `- Budget: ${BUDGET[q.budget]}`,
    `- Cooking time: ${COOKING[q.cookingTime]}`,
    '',
    `# Meals (${String(split.length)})`,
    meals,
  ].join('\n')
}
