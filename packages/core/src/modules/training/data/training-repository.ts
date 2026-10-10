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
