import type { Json, Tables, TablesUpdate } from '@mycoach/db'
import { dbError, type AdminClient } from '../../../shared'
import type { DietQuestionnaire } from '../schemas'
import type { DietInputs } from '../types'

export type DietPlanRow = Tables<'diet_plans'>

// Every query is scoped by userId: the admin client bypasses RLS.

export async function requestDietPlanAtomically(
  db: AdminClient,
  args: {
    userId: string
    questionnaire: DietQuestionnaire
    inputs: DietInputs
    requestId: string | null
  },
): Promise<string> {
  const { data, error } = await db.rpc('nutrition_request_diet_plan', {
    p_user_id: args.userId,
    p_diet_profile: args.questionnaire as unknown as Json,
    p_inputs: args.inputs as unknown as Json,
    p_request_id: args.requestId ?? '',
  })
  if (error) throw dbError('requestDietPlan', error)
  return data
}

export async function countDietPlansSince(
  db: AdminClient,
  userId: string,
  since: Date,
): Promise<number> {
  const { count, error } = await db
    .from('diet_plans')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', since.toISOString())
  if (error) throw dbError('countDietPlansSince', error)
  return count ?? 0
}

export async function findDietPlan(
  db: AdminClient,
  userId: string,
  planId: string,
): Promise<DietPlanRow | null> {
  const { data, error } = await db
    .from('diet_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('id', planId)
    .maybeSingle()
  if (error) throw dbError('findDietPlan', error)
  return data
}

export async function updateDietPlan(
  db: AdminClient,
  userId: string,
  planId: string,
  patch: TablesUpdate<'diet_plans'>,
): Promise<void> {
  const { error } = await db.from('diet_plans').update(patch).eq('user_id', userId).eq('id', planId)
  if (error) throw dbError('updateDietPlan', error)
}
