import type { DietPlan } from '../schemas'
import type { DietInputs } from '../types'
import { dayTotals, MEAL_SPLITS, optionTotals } from './meals'

/** How far a day may drift from the calorie target (either way). */
export const KCAL_TOLERANCE = 0.12
/** A day must reach at least this share of the protein target. */
export const MIN_PROTEIN_SHARE = 0.85
/** Options of one meal must be within this share of each other's calories… */
const OPTION_KCAL_TOLERANCE = 0.3
/** …or this many kcal, whichever is larger (small snacks). */
const OPTION_KCAL_SLACK = 80

/**
 * Business checks on AI output, applied after schema validation. The schema guarantees shape;
 * these guarantee the plan hits the user's targets with every combination of options.
 */
export function dietPlanIssues(plan: DietPlan, inputs: DietInputs): string[] {
  const issues: string[] = []
  const expected = MEAL_SPLITS[inputs.questionnaire.mealsPerDay]
  const { kcal: targetKcal, proteinG: targetProtein } = inputs.targets

  if (plan.meals.length !== expected.length) {
    issues.push(`expected ${expected.length} meals, got ${plan.meals.length}`)
  }

  plan.meals.forEach((meal, m) => {
    if (meal.options.length < 1 || meal.options.length > 3) {
      issues.push(`meal ${m + 1}: ${meal.options.length} options`)
    }
    const kcals = meal.options.map((o) => optionTotals(o).kcal)
    const low = Math.min(...kcals)
    const high = Math.max(...kcals)
    if (
      kcals.length > 1 &&
      high - low > Math.max(OPTION_KCAL_SLACK, high * OPTION_KCAL_TOLERANCE)
    ) {
      issues.push(`meal ${m + 1}: options differ too much (${low}–${high} kcal)`)
    }
    meal.options.forEach((option, o) => {
      if (option.foods.length < 1 || option.foods.length > 10) {
        issues.push(`meal ${m + 1} option ${o + 1}: ${option.foods.length} foods`)
      }
      option.foods.forEach((food, f) => {
        if (!food.name.trim()) issues.push(`meal ${m + 1} option ${o + 1} food ${f + 1}: no name`)
        if ([food.proteinG, food.carbsG, food.fatG].some((n) => !Number.isFinite(n) || n < 0)) {
          issues.push(`meal ${m + 1} option ${o + 1} food ${f + 1}: invalid macros`)
        }
      })
    })
  })

  // Check the lightest and the heaviest day the options allow.
  const lightest = plan.meals.map((meal) => indexOfExtreme(meal.options.map(kcalOf), 'min'))
  const heaviest = plan.meals.map((meal) => indexOfExtreme(meal.options.map(kcalOf), 'max'))
  for (const [label, choice] of [
    ['lightest', lightest],
    ['heaviest', heaviest],
  ] as const) {
    const totals = dayTotals(plan.meals, choice)
    if (Math.abs(totals.kcal - targetKcal) > targetKcal * KCAL_TOLERANCE) {
      issues.push(`${label} day: ${totals.kcal} kcal vs target ${targetKcal}`)
    }
    if (totals.proteinG < targetProtein * MIN_PROTEIN_SHARE) {
      issues.push(`${label} day: ${totals.proteinG} g protein vs target ${targetProtein}`)
    }
  }
  return issues
}

function kcalOf(option: DietPlan['meals'][number]['options'][number]): number {
  return optionTotals(option).kcal
}

function indexOfExtreme(values: number[], kind: 'min' | 'max'): number {
  let best = 0
  values.forEach((v, i) => {
    const current = values[best] ?? v
    if (kind === 'min' ? v < current : v > current) best = i
  })
  return best
}
