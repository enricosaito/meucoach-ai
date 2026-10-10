import type { Goals, Sex } from '../../profile/contracts'

/**
 * Daily calorie and macro targets, derived (never stored) from the latest energy test and goal.
 * Bump TARGETS_FORMULA_VERSION whenever the rules below change.
 *
 * Rules:
 *  - Calories: lose fat = TDEE × 0.80, build muscle = TDEE × 1.10, otherwise TDEE.
 *    A deficit never goes below BMR or a sex-specific floor (1,200 / 1,500 kcal).
 *  - Protein: g per kg of reference weight (2.2 lose fat, 2.0 build muscle, 1.8 maintain,
 *    1.6 improve health). Reference weight is capped at a BMI of 27 so very high body weights
 *    don't produce unrealistic protein targets.
 *  - Fat: 25% of calories, at least 0.6 g per kg of reference weight.
 *  - Carbs: the remaining calories.
 */
export const TARGETS_FORMULA_VERSION = 1

type Goal = NonNullable<Goals['primary']>

const CALORIE_FACTOR: Record<Goal, number> = {
  lose_fat: 0.8,
  build_muscle: 1.1,
  maintain: 1,
  improve_health: 1,
}

const PROTEIN_G_PER_KG: Record<Goal, number> = {
  lose_fat: 2.2,
  build_muscle: 2.0,
  maintain: 1.8,
  improve_health: 1.6,
}

const MIN_KCAL: Record<Sex, number> = { female: 1200, male: 1500 }
const REFERENCE_BMI_CAP = 27
const FAT_SHARE = 0.25
const MIN_FAT_G_PER_KG = 0.6

export interface TargetsInput {
  goal: Goals['primary']
  sex: Sex
  weightKg: number
  heightCm: number
  bmrKcal: number
  tdeeKcal: number
}

export interface DailyTargets {
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  formulaVersion: number
}

/** Weight used for per-kg macros: actual weight, capped at the weight for a BMI of 27. */
export function referenceWeightKg(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100
  return Math.min(weightKg, REFERENCE_BMI_CAP * heightM * heightM)
}

export function computeDailyTargets(input: TargetsInput): DailyTargets {
  const goal: Goal = input.goal ?? 'maintain'
  let kcal = input.tdeeKcal * CALORIE_FACTOR[goal]
  if (kcal < input.tdeeKcal) {
    kcal = Math.max(kcal, input.bmrKcal, MIN_KCAL[input.sex])
  }
  kcal = Math.round(kcal / 10) * 10

  const refKg = referenceWeightKg(input.weightKg, input.heightCm)
  const proteinG = Math.round(refKg * PROTEIN_G_PER_KG[goal])
  const fatG = Math.round(Math.max((kcal * FAT_SHARE) / 9, refKg * MIN_FAT_G_PER_KG))
  const carbsG = Math.max(0, Math.round((kcal - proteinG * 4 - fatG * 9) / 4))

  return { kcal, proteinG, carbsG, fatG, formulaVersion: TARGETS_FORMULA_VERSION }
}
