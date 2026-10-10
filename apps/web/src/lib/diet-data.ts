'use client'

import {
  toDietPlanRecord,
  toDietQuestionnaire,
  type DietPlanRecord,
  type DietQuestionnaire,
} from '@mycoach/core/nutrition/contracts'
import { getSupabaseBrowserClient } from './supabase-browser'

// Reads go straight to Supabase (RLS: own rows only). Every write goes through the API.

const PLAN_COLUMNS = 'id, status, plan, inputs, created_at, completed_at'

export async function fetchLatestDietPlan(): Promise<DietPlanRecord | null> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('diet_plans')
    .select(PLAN_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ? toDietPlanRecord(data) : null
}

/** The most recent diet that finished successfully (shown while a newer one is generating). */
export async function fetchLatestReadyDietPlan(): Promise<DietPlanRecord | null> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('diet_plans')
    .select(PLAN_COLUMNS)
    .eq('status', 'ready')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ? toDietPlanRecord(data) : null
}

export async function fetchDietQuestionnaire(): Promise<DietQuestionnaire | null> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('diet_profiles')
    .select('meals_per_day, diet_style, budget, cooking_time, allergies, dislikes')
    .maybeSingle()
  if (error) throw error
  return data ? toDietQuestionnaire(data) : null
}
