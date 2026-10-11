import type { WorkoutSession } from './domain/workout-log'
import type { Locale } from '@mycoach/i18n'
import type { DailyTargets } from '../nutrition/contracts'
import type { ActivityLevel, Goals, Sex, UnitSystem } from '../profile/contracts'
import type { BodyAnalysis, BodyView, Questionnaire, WorkoutPlan } from './schemas'

/** Everything a plan is generated from. Snapshotted on the plan row, so plans are reproducible. */
export interface PlanInputs {
  questionnaire: Questionnaire
  goal?: Goals['primary']
  locale: Locale
  units: UnitSystem
  body: {
    sex: Sex
    ageYears: number
    heightCm: number
    weightKg: number
    activityLevel: ActivityLevel
  } | null
  targets: DailyTargets | null
}

export const BODY_SCAN_STATUSES = ['pending', 'completed', 'unusable', 'failed'] as const
export type BodyScanStatus = (typeof BODY_SCAN_STATUSES)[number]

export const PLAN_STATUSES = ['pending', 'generating', 'ready', 'failed'] as const
export type PlanStatus = (typeof PLAN_STATUSES)[number]

export interface BodyScanPhoto {
  view: BodyView
  /** Storage path in the private `body-photos` bucket. Clients create signed URLs to display it. */
  path: string
}

export interface BodyScan {
  id: string
  status: BodyScanStatus
  photos: BodyScanPhoto[]
  analysis: BodyAnalysis | null
  createdAt: string
  completedAt: string | null
}

export interface WorkoutPlanRecord {
  id: string
  status: PlanStatus
  plan: WorkoutPlan | null
  bodyScanId: string | null
  createdAt: string
  completedAt: string | null
}

/** What the coach may know about the user's training (for the daily check-in). */
export interface CoachSnapshot {
  /** The current ready plan: day titles and focus, in rotation order. */
  plan: { id: string; days: { title: string; focus: string }[] } | null
  /** Recent logged workouts, newest first. */
  sessions: WorkoutSession[]
  /** Injuries or limitations the user wrote in the questionnaire. */
  limitations: string | null
}
