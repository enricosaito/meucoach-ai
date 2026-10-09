import type { ActivityLevel, Sex } from './domain/mifflin-st-jeor'
import type { UnitSystem } from './domain/units'
import type { Goals } from './schemas'

export interface Profile {
  id: string
  displayName: string | null
  goals: Goals
  units: UnitSystem
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
  latestAssessment: Assessment | null
}
