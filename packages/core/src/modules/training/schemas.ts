import { z } from 'zod'

// ---------------------------------------------------------------------------
// Questionnaire
// ---------------------------------------------------------------------------

export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]

export const EQUIPMENT_OPTIONS = ['full_gym', 'home_dumbbells', 'bodyweight'] as const
export type Equipment = (typeof EQUIPMENT_OPTIONS)[number]

export const SESSION_MINUTES = [30, 45, 60, 75, 90] as const
export type SessionMinutes = (typeof SESSION_MINUTES)[number]

export const MIN_DAYS_PER_WEEK = 2
export const MAX_DAYS_PER_WEEK = 6

export const questionnaireSchema = z.strictObject({
  experience: z.enum(EXPERIENCE_LEVELS),
  daysPerWeek: z.number().int().min(MIN_DAYS_PER_WEEK).max(MAX_DAYS_PER_WEEK),
  sessionMinutes: z.union(SESSION_MINUTES.map((m) => z.literal(m))),
  equipment: z.enum(EQUIPMENT_OPTIONS),
  limitations: z.string().trim().max(500).optional(),
})
export type Questionnaire = z.infer<typeof questionnaireSchema>

// ---------------------------------------------------------------------------
// Body photos
// ---------------------------------------------------------------------------

export const BODY_VIEWS = ['front', 'side', 'back'] as const
export type BodyView = (typeof BODY_VIEWS)[number]

export const PHOTO_CONTENT_TYPES = ['image/jpeg', 'image/webp', 'image/png'] as const
export type PhotoContentType = (typeof PHOTO_CONTENT_TYPES)[number]

const viewsSchema = z
  .array(z.enum(BODY_VIEWS))
  .min(1)
  .max(3)
  .refine((views) => new Set(views).size === views.length, 'Views must be unique')

export const photoUploadRequestSchema = z.strictObject({
  views: viewsSchema,
  contentType: z.enum(PHOTO_CONTENT_TYPES),
})
export type PhotoUploadRequest = z.infer<typeof photoUploadRequestSchema>

export const requestPlanSchema = z.strictObject({
  questionnaire: questionnaireSchema,
  /** Optional: plans can be generated without photos, but photos personalise them. */
  bodyScan: z
    .strictObject({
      scanId: z.uuid(),
      views: viewsSchema,
      contentType: z.enum(PHOTO_CONTENT_TYPES),
    })
    .nullable()
    .optional(),
})
export type RequestPlanInput = z.infer<typeof requestPlanSchema>

// ---------------------------------------------------------------------------
// AI outputs. Kept simple (no numeric bounds) so they translate cleanly to the structured-output
// JSON schema; business bounds are checked afterwards in domain/plan-validation.ts.
// ---------------------------------------------------------------------------

export const BODY_TYPES = ['ectomorph', 'mesomorph', 'endomorph'] as const
export type BodyType = (typeof BODY_TYPES)[number]

export const BODY_AREAS = [
  'chest',
  'back',
  'shoulders',
  'arms',
  'core',
  'glutes',
  'legs',
  'calves',
  'posture',
] as const
export type BodyArea = (typeof BODY_AREAS)[number]

export const bodyAnalysisSchema = z.object({
  usable: z
    .boolean()
    .describe('False if the photos do not clearly show one adult body (too dark, cropped, etc.)'),
  bodyFatPercentLow: z.number().describe('Lower bound of the estimated body fat percentage'),
  bodyFatPercentHigh: z.number().describe('Upper bound of the estimated body fat percentage'),
  bodyType: z.enum(BODY_TYPES),
  priorityAreas: z
    .array(
      z.object({
        area: z.enum(BODY_AREAS),
        reason: z.string().describe('One short, encouraging sentence in the user’s language'),
      }),
    )
    .describe('2–4 areas to prioritise, most important first'),
  postureNotes: z.string().describe('Short posture observations, or an empty string'),
  summary: z.string().describe('2–3 encouraging sentences in the user’s language'),
  confidence: z.enum(['low', 'medium', 'high']),
})
export type BodyAnalysis = z.infer<typeof bodyAnalysisSchema>

export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'core',
  'glutes',
  'quads',
  'hamstrings',
  'calves',
  'full_body',
  'cardio',
] as const
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

export const exerciseSchema = z.object({
  name: z.string().describe('Common exercise name in the user’s language'),
  muscleGroup: z.enum(MUSCLE_GROUPS),
  sets: z.number().int(),
  reps: z.string().describe('Reps per set, e.g. "8–12", "12 each side" or "30 s"'),
  restSeconds: z.number().int(),
  notes: z.string().describe('One short form cue or tip, or an empty string'),
})
export type Exercise = z.infer<typeof exerciseSchema>

export const workoutDaySchema = z.object({
  title: z.string().describe('e.g. "Day 1 · Upper body"'),
  focus: z.string().describe('Short description of the session focus'),
  estimatedMinutes: z.number().int(),
  warmup: z.string(),
  exercises: z.array(exerciseSchema),
  cooldown: z.string(),
})
export type WorkoutDay = z.infer<typeof workoutDaySchema>

export const workoutPlanSchema = z.object({
  name: z.string().describe('Short, motivating plan name'),
  summary: z.string().describe('2–3 sentences: who this plan is for and how it works'),
  durationWeeks: z.number().int(),
  progression: z.string().describe('How to progress week to week'),
  days: z.array(workoutDaySchema),
  tips: z.array(z.string()).describe('3–5 short practical tips'),
})
export type WorkoutPlan = z.infer<typeof workoutPlanSchema>

// ---------------------------------------------------------------------------
// Workout log
// ---------------------------------------------------------------------------

export const logWorkoutSchema = z.strictObject({
  planId: z.uuid(),
  dayIndex: z.number().int().min(0).max(13),
})
export type LogWorkoutInput = z.infer<typeof logWorkoutSchema>
