import { BODY_VIEWS, bodyAnalysisSchema, workoutPlanSchema } from '../schemas'
import {
  BODY_SCAN_STATUSES,
  PLAN_STATUSES,
  type BodyScan,
  type BodyScanPhoto,
  type BodyScanStatus,
  type PlanStatus,
  type WorkoutPlanRecord,
} from '../types'

/**
 * Pure mappers from database rows (snake_case, as returned by Supabase to both the API and to
 * clients reading directly under RLS) to domain types. Shared by web and mobile.
 */

export interface BodyScanRowLike {
  id: string
  status: string
  front_path: string | null
  side_path: string | null
  back_path: string | null
  analysis: unknown
  created_at: string
  completed_at: string | null
}

export interface WorkoutPlanRowLike {
  id: string
  status: string
  plan: unknown
  body_scan_id: string | null
  created_at: string
  completed_at: string | null
}

export function scanPhotos(
  row: Pick<BodyScanRowLike, 'front_path' | 'side_path' | 'back_path'>,
): BodyScanPhoto[] {
  const paths = { front: row.front_path, side: row.side_path, back: row.back_path }
  return BODY_VIEWS.flatMap((view) => (paths[view] ? [{ view, path: paths[view] }] : []))
}

export function toBodyScan(row: BodyScanRowLike): BodyScan {
  const analysis = bodyAnalysisSchema.safeParse(row.analysis)
  return {
    id: row.id,
    status: (BODY_SCAN_STATUSES as readonly string[]).includes(row.status)
      ? (row.status as BodyScanStatus)
      : 'failed',
    photos: scanPhotos(row),
    analysis: analysis.success ? analysis.data : null,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  }
}

export function toWorkoutPlanRecord(row: WorkoutPlanRowLike): WorkoutPlanRecord {
  const plan = workoutPlanSchema.safeParse(row.plan)
  return {
    id: row.id,
    status: (PLAN_STATUSES as readonly string[]).includes(row.status)
      ? (row.status as PlanStatus)
      : 'failed',
    plan: plan.success ? plan.data : null,
    bodyScanId: row.body_scan_id,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  }
}
