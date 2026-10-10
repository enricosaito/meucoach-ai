import { dietPlanSchema, dietQuestionnaireSchema, type DietQuestionnaire } from '../schemas'
import { DIET_PLAN_STATUSES, type DietPlanRecord, type DietPlanStatus } from '../types'
import type { DailyTargets } from './targets'

/**
 * Pure mappers from database rows (snake_case, as returned by Supabase to both the API and to
 * clients reading directly under RLS) to domain types. Shared by web and mobile.
 */

export interface DietPlanRowLike {
  id: string
  status: string
  plan: unknown
  inputs: unknown
  created_at: string
  completed_at: string | null
}

export interface DietProfileRowLike {
  meals_per_day: number
  diet_style: string
  budget: string
  cooking_time: string
  allergies: string | null
  dislikes: string | null
}

function targetsOf(inputs: unknown): DailyTargets | null {
  if (typeof inputs !== 'object' || inputs === null || !('targets' in inputs)) return null
  const t = inputs.targets
  if (typeof t !== 'object' || t === null) return null
  const { kcal, proteinG, carbsG, fatG, formulaVersion } = t as Record<string, unknown>
  return [kcal, proteinG, carbsG, fatG, formulaVersion].every((n) => typeof n === 'number')
    ? (t as DailyTargets)
    : null
}

export function toDietPlanRecord(row: DietPlanRowLike): DietPlanRecord {
  const plan = dietPlanSchema.safeParse(row.plan)
  return {
    id: row.id,
    status: (DIET_PLAN_STATUSES as readonly string[]).includes(row.status)
      ? (row.status as DietPlanStatus)
      : 'failed',
    plan: plan.success ? plan.data : null,
    targets: targetsOf(row.inputs),
    createdAt: row.created_at,
    completedAt: row.completed_at,
  }
}

export function toDietQuestionnaire(row: DietProfileRowLike): DietQuestionnaire | null {
  const parsed = dietQuestionnaireSchema.safeParse({
    mealsPerDay: row.meals_per_day,
    dietStyle: row.diet_style,
    budget: row.budget,
    cookingTime: row.cooking_time,
    ...(row.allergies && { allergies: row.allergies }),
    ...(row.dislikes && { dislikes: row.dislikes }),
  })
  return parsed.success ? parsed.data : null
}
