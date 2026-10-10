import type { Locale } from '@mycoach/i18n'
import type { Goals, Sex, UnitSystem } from '../profile/contracts'
import type { DailyTargets } from './domain/targets'
import type { DietPlan, DietQuestionnaire } from './schemas'

/** Everything a diet plan is generated from. Snapshotted on the plan row, so plans are reproducible. */
export interface DietInputs {
  questionnaire: DietQuestionnaire
  goal?: Goals['primary']
  locale: Locale
  units: UnitSystem
  body: { sex: Sex; ageYears: number; heightCm: number; weightKg: number }
  targets: DailyTargets
}

export const DIET_PLAN_STATUSES = ['pending', 'generating', 'ready', 'failed'] as const
export type DietPlanStatus = (typeof DIET_PLAN_STATUSES)[number]

export interface DietPlanRecord {
  id: string
  status: DietPlanStatus
  plan: DietPlan | null
  /** The targets the plan was built for (they may have changed since). */
  targets: DailyTargets | null
  createdAt: string
  completedAt: string | null
}
