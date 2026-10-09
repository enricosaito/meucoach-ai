/**
 * Mifflin-St Jeor resting energy expenditure (Mifflin et al., 1990):
 *   BMR = 10 × weight(kg) + 6.25 × height(cm) − 5 × age(y) + s
 *   s = +5 for males, −161 for females
 * TDEE = BMR × activity multiplier.
 *
 * Bump FORMULA_VERSION whenever the math or multipliers change; it is stored with every result.
 */
export const MIFFLIN_ST_JEOR_FORMULA_VERSION = 1

export const SEXES = ['male', 'female'] as const
export type Sex = (typeof SEXES)[number]

export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number]

export const ACTIVITY_MULTIPLIERS: Readonly<Record<ActivityLevel, number>> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

const SEX_CONSTANT: Readonly<Record<Sex, number>> = { male: 5, female: -161 }

export interface MifflinStJeorInput {
  sex: Sex
  ageYears: number
  heightCm: number
  weightKg: number
}

export interface EnergyEstimate {
  bmrKcal: number
  tdeeKcal: number
  formulaVersion: number
}

/** Unrounded basal metabolic rate in kcal/day. */
export function mifflinStJeorBmr({
  sex,
  ageYears,
  heightCm,
  weightKg,
}: MifflinStJeorInput): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + SEX_CONSTANT[sex]
}

/** BMR and TDEE rounded to whole kcal/day. TDEE is derived from the unrounded BMR. */
export function estimateEnergyExpenditure(
  input: MifflinStJeorInput & { activityLevel: ActivityLevel },
): EnergyEstimate {
  const bmr = mifflinStJeorBmr(input)
  return {
    bmrKcal: Math.round(bmr),
    tdeeKcal: Math.round(bmr * ACTIVITY_MULTIPLIERS[input.activityLevel]),
    formulaVersion: MIFFLIN_ST_JEOR_FORMULA_VERSION,
  }
}
