import type { Json, Tables, TablesUpdate } from '@mycoach/db'
import { dbError, type AdminClient } from '../../../shared'
import type { Questionnaire } from '../schemas'
import type { PlanInputs } from '../types'

export type PlanRow = Tables<'workout_plans'>
export type ScanRow = Tables<'body_scans'>

// Every query is scoped by userId: the admin client bypasses RLS.

export async function requestPlanAtomically(
  db: AdminClient,
  args: {
    userId: string
    questionnaire: Questionnaire
    scan: { id: string; frontPath?: string; sidePath?: string; backPath?: string } | null
    inputs: PlanInputs
    requestId: string | null
  },
): Promise<string> {
  const { data, error } = await db.rpc('training_request_plan', {
    p_user_id: args.userId,
    p_training_profile: args.questionnaire as unknown as Json,
    p_scan: args.scan as unknown as Json,
    p_inputs: args.inputs as unknown as Json,
    p_request_id: args.requestId ?? '',
  })
  if (error) throw dbError('requestPlan', error)
  return data
}

export async function countPlansSince(
  db: AdminClient,
  userId: string,
  since: Date,
): Promise<number> {
  const { count, error } = await db
    .from('workout_plans')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', since.toISOString())
  if (error) throw dbError('countPlansSince', error)
  return count ?? 0
}

export async function findPlan(
  db: AdminClient,
  userId: string,
  planId: string,
): Promise<PlanRow | null> {
  const { data, error } = await db
    .from('workout_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('id', planId)
    .maybeSingle()
  if (error) throw dbError('findPlan', error)
  return data
}

export async function updatePlan(
  db: AdminClient,
  userId: string,
  planId: string,
  patch: TablesUpdate<'workout_plans'>,
): Promise<void> {
  const { error } = await db
    .from('workout_plans')
    .update(patch)
    .eq('user_id', userId)
    .eq('id', planId)
  if (error) throw dbError('updatePlan', error)
}

export async function findScan(
  db: AdminClient,
  userId: string,
  scanId: string,
): Promise<ScanRow | null> {
  const { data, error } = await db
    .from('body_scans')
    .select('*')
    .eq('user_id', userId)
    .eq('id', scanId)
    .maybeSingle()
  if (error) throw dbError('findScan', error)
  return data
}

export async function updateScan(
  db: AdminClient,
  userId: string,
  scanId: string,
  patch: TablesUpdate<'body_scans'>,
): Promise<void> {
  const { error } = await db.from('body_scans').update(patch).eq('user_id', userId).eq('id', scanId)
  if (error) throw dbError('updateScan', error)
}

export async function listScanRows(db: AdminClient, userId: string): Promise<ScanRow[]> {
  const { data, error } = await db.from('body_scans').select('*').eq('user_id', userId)
  if (error) throw dbError('listScanRows', error)
  return data
}

export async function deleteScanRows(
  db: AdminClient,
  userId: string,
  scanIds: string[],
): Promise<void> {
  if (scanIds.length === 0) return
  const { error } = await db.from('body_scans').delete().eq('user_id', userId).in('id', scanIds)
  if (error) throw dbError('deleteScanRows', error)
}

export type WorkoutSessionRow = Tables<'workout_sessions'>

/**
 * Logs a completed plan day. Idempotent: the (user, plan, day, local date) unique key absorbs
 * repeats, and the existing row is returned. `created` is true only for the first call.
 */
export async function insertWorkoutSession(
  db: AdminClient,
  row: { userId: string; planId: string; dayIndex: number; dayTitle: string; localDate: string },
): Promise<{ row: WorkoutSessionRow; created: boolean }> {
  const { data, error } = await db
    .from('workout_sessions')
    .upsert(
      {
        user_id: row.userId,
        plan_id: row.planId,
        day_index: row.dayIndex,
        day_title: row.dayTitle,
        local_date: row.localDate,
      },
      { onConflict: 'user_id,plan_id,day_index,local_date', ignoreDuplicates: true },
    )
    .select('*')
  if (error) throw dbError('insertWorkoutSession', error)
  const inserted = data[0]
  if (inserted) return { row: inserted, created: true }

  const existing = await db
    .from('workout_sessions')
    .select('*')
    .eq('user_id', row.userId)
    .eq('plan_id', row.planId)
    .eq('day_index', row.dayIndex)
    .eq('local_date', row.localDate)
    .single()
  if (existing.error) throw dbError('insertWorkoutSession', existing.error)
  return { row: existing.data, created: false }
}

/** The newest plan that finished generating, if any. */
export async function findLatestReadyPlan(
  db: AdminClient,
  userId: string,
): Promise<PlanRow | null> {
  const { data, error } = await db
    .from('workout_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'ready')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw dbError('findLatestReadyPlan', error)
  return data
}

/** Logged workouts on or after a local date ("YYYY-MM-DD"), newest first. */
export async function listSessionsSince(
  db: AdminClient,
  userId: string,
  sinceLocalDate: string,
): Promise<WorkoutSessionRow[]> {
  const { data, error } = await db
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('local_date', sinceLocalDate)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw dbError('listSessionsSince', error)
  return data
}

/** Injuries or limitations from the last questionnaire, if the user wrote any. */
export async function findLimitations(db: AdminClient, userId: string): Promise<string | null> {
  const { data, error } = await db
    .from('training_profiles')
    .select('limitations')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw dbError('findLimitations', error)
  return data?.limitations?.trim() || null
}
