import { AppError, type AdminClient } from '../../shared'
import { estimateEnergyExpenditure, type ActivityLevel, type Sex } from './domain/mifflin-st-jeor'
import type { UnitSystem } from './domain/units'
import {
  findLatestAssessment,
  insertAssessment,
  type AssessmentRow,
} from './data/assessment-repository'
import { findProfile, updateProfileRow, type ProfileRow } from './data/profile-repository'
import { goalsSchema, type AssessmentInput, type Goals, type UpdateProfileInput } from './schemas'

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

function toProfile(row: ProfileRow): Profile {
  const goals = goalsSchema.safeParse(row.goals)
  return {
    id: row.id,
    displayName: row.display_name,
    goals: goals.success ? goals.data : {},
    units: row.units as UnitSystem,
    timezone: row.timezone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toAssessment(row: AssessmentRow): Assessment {
  return {
    id: row.id,
    formula: row.formula,
    formulaVersion: row.formula_version,
    sex: row.sex as Sex,
    ageYears: row.age_years,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    activityLevel: row.activity_level as ActivityLevel,
    bmrKcal: row.bmr_kcal,
    tdeeKcal: row.tdee_kcal,
    createdAt: row.created_at,
  }
}

export function createProfileService(deps: { db: AdminClient }) {
  const { db } = deps

  async function requireProfile(userId: string): Promise<ProfileRow> {
    const row = await findProfile(db, userId)
    if (!row) throw new AppError('not_found', 'Profile not found')
    return row
  }

  async function getMe(userId: string): Promise<Me> {
    const [profile, latest] = await Promise.all([
      requireProfile(userId),
      findLatestAssessment(db, userId),
    ])
    return { profile: toProfile(profile), latestAssessment: latest ? toAssessment(latest) : null }
  }

  return {
    getMe,

    async updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
      const row = await updateProfileRow(db, userId, {
        ...(input.displayName !== undefined && { display_name: input.displayName }),
        ...(input.units !== undefined && { units: input.units }),
        ...(input.timezone !== undefined && { timezone: input.timezone }),
        ...(input.goals !== undefined && { goals: input.goals }),
      })
      if (!row) throw new AppError('not_found', 'Profile not found')
      return toProfile(row)
    },

    async recordAssessment(userId: string, input: AssessmentInput): Promise<Assessment> {
      const estimate = estimateEnergyExpenditure(input)
      const row = await insertAssessment(db, {
        user_id: userId,
        formula: 'mifflin_st_jeor',
        formula_version: estimate.formulaVersion,
        sex: input.sex,
        age_years: input.ageYears,
        height_cm: input.heightCm,
        weight_kg: input.weightKg,
        activity_level: input.activityLevel,
        bmr_kcal: estimate.bmrKcal,
        tdee_kcal: estimate.tdeeKcal,
      })
      return toAssessment(row)
    },

    async getCoachingContext(userId: string): Promise<CoachingContext> {
      const { profile, latestAssessment } = await getMe(userId)
      return {
        displayName: profile.displayName,
        goals: profile.goals,
        units: profile.units,
        latestAssessment,
      }
    },
  }
}

export type ProfileService = ReturnType<typeof createProfileService>
