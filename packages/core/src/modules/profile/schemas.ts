import { z } from 'zod'
import { ACTIVITY_LEVELS, SEXES } from './domain/mifflin-st-jeor'
import { UNIT_SYSTEMS } from './domain/units'
import { LOCALES } from '@mycoach/i18n'

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone })
    return true
  } catch {
    return false
  }
}

export const GOAL_TYPES = ['lose_fat', 'maintain', 'build_muscle', 'improve_health'] as const

export const goalsSchema = z.strictObject({
  primary: z.enum(GOAL_TYPES).optional(),
  notes: z.string().trim().max(500).optional(),
})
export type Goals = z.infer<typeof goalsSchema>

/** Same rule as the database constraint `profiles_username_format`. */
export const USERNAME_PATTERN = /^[a-z0-9_.]{3,20}$/
export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 20

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(USERNAME_PATTERN, 'Use 3–20 letters, numbers, dots or underscores')

export const updateProfileSchema = z
  .strictObject({
    username: usernameSchema.optional(),
    displayName: z.string().trim().min(1).max(40).nullable().optional(),
    units: z.enum(UNIT_SYSTEMS).optional(),
    locale: z.enum(LOCALES).optional(),
    timezone: z.string().refine(isValidTimeZone, 'Must be an IANA time zone').optional(),
    goals: goalsSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update')
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

/** Inputs for the Mifflin-St Jeor test, always in metric. Clients convert imperial first. */
export const assessmentInputSchema = z.strictObject({
  sex: z.enum(SEXES),
  ageYears: z.number().int().min(15).max(100),
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(30).max(350),
  activityLevel: z.enum(ACTIVITY_LEVELS),
})
export type AssessmentInput = z.infer<typeof assessmentInputSchema>

export const CONSENT_KINDS = ['body_photos'] as const
export type ConsentKind = (typeof CONSENT_KINDS)[number]

/** Bump when the consent text changes materially; users must then consent again. */
export const CONSENT_VERSIONS: Readonly<Record<ConsentKind, number>> = { body_photos: 1 }

export const grantConsentSchema = z.strictObject({
  version: z.number().int().positive(),
})

/** Confirms an avatar uploaded through a signed URL. The path must be inside the user's folder. */
export const setAvatarSchema = z.strictObject({
  path: z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/, 'Invalid avatar path'),
})

/** Public storage bucket for profile pictures. */
export const AVATARS_BUCKET = 'avatars'
