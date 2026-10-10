'use client'

import {
  questionnaireSchema,
  toBodyScan,
  toWorkoutPlanRecord,
  toWorkoutSession,
  type BodyScan,
  type Questionnaire,
  type WorkoutPlanRecord,
  type WorkoutSession,
} from '@mycoach/core/training/contracts'
import { getSupabaseBrowserClient } from './supabase-browser'

// Reads go straight to Supabase (RLS: own rows only). Every write goes through the API.

export async function fetchLatestPlan(): Promise<WorkoutPlanRecord | null> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('workout_plans')
    .select('id, status, plan, body_scan_id, created_at, completed_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ? toWorkoutPlanRecord(data) : null
}

/** The most recent plan that finished successfully (shown while a newer one is generating). */
export async function fetchLatestReadyPlan(): Promise<WorkoutPlanRecord | null> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('workout_plans')
    .select('id, status, plan, body_scan_id, created_at, completed_at')
    .eq('status', 'ready')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ? toWorkoutPlanRecord(data) : null
}

export async function fetchQuestionnaire(): Promise<Questionnaire | null> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('training_profiles')
    .select('experience, days_per_week, session_minutes, equipment, limitations')
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const parsed = questionnaireSchema.safeParse({
    experience: data.experience,
    daysPerWeek: data.days_per_week,
    sessionMinutes: data.session_minutes,
    equipment: data.equipment,
    ...(data.limitations && { limitations: data.limitations }),
  })
  return parsed.success ? parsed.data : null
}

export async function fetchScans(): Promise<BodyScan[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('body_scans')
    .select('id, status, front_path, side_path, back_path, analysis, created_at, completed_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(toBodyScan)
}

export async function fetchScan(id: string): Promise<BodyScan | null> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('body_scans')
    .select('id, status, front_path, side_path, back_path, analysis, created_at, completed_at')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? toBodyScan(data) : null
}

export async function hasPhotoConsent(): Promise<boolean> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('consents')
    .select('version')
    .eq('kind', 'body_photos')
    .is('revoked_at', null)
    .maybeSingle()
  if (error) throw error
  return data !== null
}

/** Short-lived URLs for displaying private photos (storage RLS: own folder only). */
export async function signedPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {}
  const { data, error } = await getSupabaseBrowserClient()
    .storage.from('body-photos')
    .createSignedUrls(paths, 60 * 60)
  if (error) throw error
  return Object.fromEntries(
    data.flatMap((item) => (item.path && item.signedUrl ? [[item.path, item.signedUrl]] : [])),
  )
}

export async function uploadToSignedUrl(path: string, token: string, blob: Blob): Promise<void> {
  const { error } = await getSupabaseBrowserClient()
    .storage.from('body-photos')
    .uploadToSignedUrl(path, token, blob, { contentType: 'image/jpeg' })
  if (error) throw error
}

/** Completed workouts from the last `days` days, newest first (any plan). */
export async function fetchRecentSessions(days = 35): Promise<WorkoutSession[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const { data, error } = await getSupabaseBrowserClient()
    .from('workout_sessions')
    .select('id, plan_id, day_index, day_title, local_date, created_at')
    .gte('local_date', since)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return data.map(toWorkoutSession)
}
