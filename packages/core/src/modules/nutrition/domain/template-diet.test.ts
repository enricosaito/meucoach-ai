import { describe, expect, it } from 'vitest'
import { DIET_STYLES, dietPlanSchema, MEALS_PER_DAY } from '../schemas'
import type { DietInputs } from '../types'
import { dietPlanIssues } from './diet-validation'
import { planTotals } from './meals'
import { buildTemplateDiet } from './template-diet'
import { computeDailyTargets } from './targets'

function inputs(overrides: Partial<DietInputs> = {}, body = { weightKg: 80, heightCm: 178 }) {
  const base: DietInputs = {
    questionnaire: {
      mealsPerDay: 4,
      dietStyle: 'omnivore',
      budget: 'moderate',
      cookingTime: 'some',
    },
    goal: 'maintain',
    locale: 'pt-BR',
    units: 'metric',
    body: { sex: 'male', ageYears: 30, ...body },
    targets: { kcal: 2500, proteinG: 150, carbsG: 300, fatG: 70, formulaVersion: 1 },
  }
  return { ...base, ...overrides }
}

// Realistic targets from the real formula: small/large, cutting/bulking.
const PROFILES = [
  { sex: 'female', weightKg: 55, heightCm: 160, bmr: 1300, tdee: 1800, goal: 'lose_fat' },
  { sex: 'female', weightKg: 70, heightCm: 168, bmr: 1450, tdee: 2200, goal: 'build_muscle' },
  { sex: 'male', weightKg: 80, heightCm: 178, bmr: 1800, tdee: 2700, goal: 'maintain' },
  { sex: 'male', weightKg: 100, heightCm: 185, bmr: 2050, tdee: 3300, goal: 'lose_fat' },
  { sex: 'male', weightKg: 75, heightCm: 180, bmr: 1780, tdee: 3000, goal: 'build_muscle' },
] as const

describe('buildTemplateDiet', () => {
  for (const profile of PROFILES) {
    for (const dietStyle of DIET_STYLES) {
      for (const mealsPerDay of MEALS_PER_DAY) {
        it(`hits the targets: ${profile.goal} ${String(profile.weightKg)} kg, ${dietStyle}, ${String(mealsPerDay)} meals`, () => {
          const targets = computeDailyTargets({
            goal: profile.goal,
            sex: profile.sex,
            weightKg: profile.weightKg,
            heightCm: profile.heightCm,
            bmrKcal: profile.bmr,
            tdeeKcal: profile.tdee,
          })
          const i = inputs(
            {
              goal: profile.goal,
              targets,
              questionnaire: { mealsPerDay, dietStyle, budget: 'economic', cookingTime: 'minimal' },
            },
            { weightKg: profile.weightKg, heightCm: profile.heightCm },
          )
          const plan = buildTemplateDiet(i)
          expect(dietPlanSchema.parse(plan)).toEqual(plan)
          expect(dietPlanIssues(plan, i)).toEqual([])
        })
      }
    }
  }

  it('keeps animal products out of vegan plans', () => {
    const plan = buildTemplateDiet(
      inputs({
        questionnaire: {
          mealsPerDay: 6,
          dietStyle: 'vegan',
          budget: 'moderate',
          cookingTime: 'some',
        },
      }),
    )
    const names = plan.meals.flatMap((m) => m.options.flatMap((o) => o.foods.map((f) => f.name)))
    for (const banned of [
      'frango',
      'patinho',
      'tilápia',
      'atum',
      'ovo',
      'iogurte',
      'queijo',
      'leite',
    ]) {
      expect(names.join(' ').toLowerCase()).not.toContain(banned)
    }
  })

  it('writes in the user’s language', () => {
    const plan = buildTemplateDiet(inputs({ locale: 'en' }))
    expect(plan.meals[0]?.options[0]?.foods.map((f) => f.name)).toContain('Papaya')
    expect(plan.hydration).toMatch(/water/)
  })

  it('reports totals derived from macros', () => {
    const plan = buildTemplateDiet(inputs())
    const totals = planTotals(plan)
    // kcal is computed before rounding the parts, so it may differ by a few kcal.
    expect(
      Math.abs(totals.kcal - (totals.proteinG * 4 + totals.carbsG * 4 + totals.fatG * 9)),
    ).toBeLessThanOrEqual(10)
    expect(Math.abs(totals.kcal - 2500)).toBeLessThan(2500 * 0.12)
  })
})

describe('dietPlanIssues', () => {
  it('flags the wrong number of meals and missed targets', () => {
    const i = inputs()
    const plan = buildTemplateDiet(i)
    const issues = dietPlanIssues({ ...plan, meals: plan.meals.slice(0, 2) }, i)
    expect(issues).toContain('expected 4 meals, got 2')
    expect(issues.some((s) => s.startsWith('lightest day'))).toBe(true)
  })

  it('flags options that are not interchangeable', () => {
    const i = inputs()
    const plan = buildTemplateDiet(i)
    const [first, ...rest] = plan.meals
    if (!first) throw new Error('no meals')
    const huge = {
      title: 'x',
      preparation: '',
      foods: [{ name: 'Oil', quantity: '200 ml', proteinG: 0, carbsG: 0, fatG: 200 }],
    }
    const issues = dietPlanIssues(
      { ...plan, meals: [{ ...first, options: [...first.options, huge] }, ...rest] },
      i,
    )
    expect(issues.some((s) => s.includes('options differ too much'))).toBe(true)
  })

  it('flags negative macros and empty names', () => {
    const i = inputs()
    const plan = buildTemplateDiet(i)
    const [first, ...rest] = plan.meals
    if (!first) throw new Error('no meals')
    const bad = {
      title: 'x',
      preparation: '',
      foods: [{ name: ' ', quantity: '1', proteinG: -1, carbsG: 0, fatG: 0 }],
    }
    const issues = dietPlanIssues({ ...plan, meals: [{ ...first, options: [bad] }, ...rest] }, i)
    expect(issues).toContain('meal 1 option 1 food 1: no name')
    expect(issues).toContain('meal 1 option 1 food 1: invalid macros')
  })
})
