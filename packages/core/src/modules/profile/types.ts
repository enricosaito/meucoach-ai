import type { ActivityLevel, Sex } from './domain/mifflin-st-jeor'
import type { UnitSystem } from './domain/units'
import type { Locale } from '@mycoach/i18n'
import type { Goals } from './schemas'

export interface Profile {
  id: string
  /** Unique public handle (@username). Always set. */
  username: string
  /** Name used in greetings. Optional: fall back to the username (see `greetingName`). */
  displayName: string | null
  /** Path in the public `avatars` bucket, or null. */
  avatarPath: string | null
  goals: Goals
  units: UnitSystem
  locale: Locale
  timezone: string
  createdAt: string
  updatedAt: string
}

export interface Assessment {
  id: string
  formula: string
  formulaVersion: number
  sex: Sex
  ageYears: number
  heightCm: number
  weightKg: number
  activityLevel: ActivityLevel
  bmrKcal: number
  tdeeKcal: number
  createdAt: string
}

export interface Me {
  profile: Profile
  latestAssessment: Assessment | null
}

/** What the coaching module is allowed to know about a user. */
export interface CoachingContext {
  displayName: string | null
  goals: Goals
  units: UnitSystem
  locale: Locale
  timezone: string
  latestAssessment: Assessment | null
}
