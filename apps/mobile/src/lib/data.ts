import { toDietPlanRecord, type DietPlanRecord } from '@mycoach/core/nutrition/contracts'
import {
  toWorkoutPlanRecord,
  toWorkoutSession,
  type WorkoutPlanRecord,
  type WorkoutSession,
} from '@mycoach/core/training/contracts'
import { supabase } from './supabase'

// Reads go straight to Supabase (RLS: own rows only). Every write goes through the API.
// Same queries as apps/web/src/lib/*-data.ts.

const PLAN_COLUMNS = 'id, status, plan, body_scan_id, created_at, completed_at'
const DIET_COLUMNS = 'id, status, plan, inputs, created_at, completed_at'

export async function fetchLatestReadyPlan(): Promise<WorkoutPlanRecord | null> {
  const { data, error } = await supabase
    .from('workout_plans')
    .select(PLAN_COLUMNS)
    .eq('status', 'ready')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ? toWorkoutPlanRecord(data) : null
}

export async function fetchLatestPlan(): Promise<WorkoutPlanRecord | null> {
  const { data, error } = await supabase
    .from('workout_plans')
    .select(PLAN_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ? toWorkoutPlanRecord(data) : null
}

/** Completed workouts from the last `days` days, newest first (any plan). */
export async function fetchRecentSessions(days = 35): Promise<WorkoutSession[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('id, plan_id, day_index, day_title, local_date, created_at')
    .gte('local_date', since)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return data.map(toWorkoutSession)
}

export async function fetchLatestReadyDietPlan(): Promise<DietPlanRecord | null> {
  const { data, error } = await supabase
    .from('diet_plans')
    .select(DIET_COLUMNS)
    .eq('status', 'ready')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ? toDietPlanRecord(data) : null
}

/** Local days ("YYYY-MM-DD") the user opened the app since `since`, oldest first. */
export async function fetchActivityDays(since: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('activity_days')
    .select('day')
    .gte('day', since)
    .order('day', { ascending: true })
  if (error) throw error
  return data.map((row) => row.day)
}
