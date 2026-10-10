import type { DietPlan, Food, Meal, MealOption, MealsPerDay, MealType } from '../schemas'

/**
 * Pure meal arithmetic shared by the prompt, the template generator, validation and the UI.
 * Calories are always derived from macros (4 kcal/g protein and carbs, 9 kcal/g fat).
 */

export interface MacroTotals {
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
}

export function foodKcal(food: Pick<Food, 'proteinG' | 'carbsG' | 'fatG'>): number {
  return food.proteinG * 4 + food.carbsG * 4 + food.fatG * 9
}

export function sumMacros(
  foods: readonly Pick<Food, 'proteinG' | 'carbsG' | 'fatG'>[],
): MacroTotals {
  const totals = foods.reduce(
    (acc, f) => ({
      proteinG: acc.proteinG + f.proteinG,
      carbsG: acc.carbsG + f.carbsG,
      fatG: acc.fatG + f.fatG,
    }),
    { proteinG: 0, carbsG: 0, fatG: 0 },
  )
  return {
    kcal: Math.round(foodKcal(totals)),
    proteinG: Math.round(totals.proteinG),
    carbsG: Math.round(totals.carbsG),
    fatG: Math.round(totals.fatG),
  }
}

export function optionTotals(option: Pick<MealOption, 'foods'>): MacroTotals {
  return sumMacros(option.foods)
}

/**
 * Totals for one day, picking option `choice[i]` for meal i (the first option by default).
 * Options of a meal are interchangeable, so any choice should land close to the targets.
 */
export function dayTotals(
  meals: readonly Pick<Meal, 'options'>[],
  choice: number[] = [],
): MacroTotals {
  return sumMacros(
    meals.flatMap((meal, i) => {
      const option = meal.options[choice[i] ?? 0] ?? meal.options[0]
      return option ? option.foods : []
    }),
  )
}

/** Which meals a day has, with their share of the daily calories. Shares add up to 1. */
export const MEAL_SPLITS: Record<MealsPerDay, { type: MealType; share: number; time: string }[]> = {
  3: [
    { type: 'breakfast', share: 0.3, time: '07:30' },
    { type: 'lunch', share: 0.4, time: '12:30' },
    { type: 'dinner', share: 0.3, time: '19:30' },
  ],
  4: [
    { type: 'breakfast', share: 0.25, time: '07:30' },
    { type: 'lunch', share: 0.35, time: '12:30' },
    { type: 'afternoon_snack', share: 0.15, time: '16:00' },
    { type: 'dinner', share: 0.25, time: '19:30' },
  ],
  5: [
    { type: 'breakfast', share: 0.2, time: '07:00' },
    { type: 'morning_snack', share: 0.1, time: '10:00' },
    { type: 'lunch', share: 0.3, time: '12:30' },
    { type: 'afternoon_snack', share: 0.15, time: '16:00' },
    { type: 'dinner', share: 0.25, time: '19:30' },
  ],
  6: [
    { type: 'breakfast', share: 0.2, time: '07:00' },
    { type: 'morning_snack', share: 0.1, time: '10:00' },
    { type: 'lunch', share: 0.25, time: '12:30' },
    { type: 'afternoon_snack', share: 0.15, time: '16:00' },
    { type: 'dinner', share: 0.2, time: '19:30' },
    { type: 'supper', share: 0.1, time: '22:00' },
  ],
}

/** Totals of a plan day with the first option of every meal. */
export function planTotals(plan: Pick<DietPlan, 'meals'>): MacroTotals {
  return dayTotals(plan.meals)
}
