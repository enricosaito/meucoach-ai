import { DEFAULT_LOCALE, isLocale } from '@mycoach/i18n'
import { AppError, type AdminClient } from '../../shared'
import { estimateEnergyExpenditure, type ActivityLevel, type Sex } from './domain/mifflin-st-jeor'
import type { UnitSystem } from './domain/units'
import {
  findLatestAssessment,
  insertAssessment,
  type AssessmentRow,
} from './data/assessment-repository'
import { findProfile, updateProfileRow, type ProfileRow } from './data/profile-repository'
import { findActiveConsent, insertConsent, revokeActiveConsent } from './data/consent-repository'
import {
  CONSENT_VERSIONS,
  goalsSchema,
  type AssessmentInput,
  type ConsentKind,
  type UpdateProfileInput,
} from './schemas'
import type { Assessment, CoachingContext, Me, Profile } from './types'
import { greetingName } from './domain/names'
import { assertAvatarUploaded, createAvatarUpload, removeAvatars } from './data/avatar-storage'

function toProfile(row: ProfileRow): Profile {
  const goals = goalsSchema.safeParse(row.goals)
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarPath: row.avatar_path,
    goals: goals.success ? goals.data : {},
    units: row.units as UnitSystem,
    locale: isLocale(row.locale) ? row.locale : DEFAULT_LOCALE,
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
        ...(input.username !== undefined && { username: input.username }),
        ...(input.displayName !== undefined && { display_name: input.displayName }),
        ...(input.units !== undefined && { units: input.units }),
        ...(input.locale !== undefined && { locale: input.locale }),
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
        displayName: greetingName(profile),
        goals: profile.goals,
        units: profile.units,
        locale: profile.locale,
        timezone: profile.timezone,
        latestAssessment,
      }
    },

    /** Step 1 of an avatar change: a signed upload URL for a new file in the user's folder. */
    createAvatarUpload(userId: string) {
      return createAvatarUpload(db, userId)
    },

    /** Step 2: points the profile at the uploaded file and deletes older avatar files. */
    async setAvatar(userId: string, path: string): Promise<Profile> {
      if (!path.startsWith(`${userId}/`)) throw new AppError('forbidden', 'Not your avatar')
      await assertAvatarUploaded(db, userId, path)
      const row = await updateProfileRow(db, userId, { avatar_path: path })
      if (!row) throw new AppError('not_found', 'Profile not found')
      await removeAvatars(db, userId, path)
      return toProfile(row)
    },

    async removeAvatar(userId: string): Promise<Profile> {
      const row = await updateProfileRow(db, userId, { avatar_path: null })
      if (!row) throw new AppError('not_found', 'Profile not found')
      await removeAvatars(db, userId)
      return toProfile(row)
    },

    async hasActiveConsent(userId: string, kind: ConsentKind): Promise<boolean> {
      const consent = await findActiveConsent(db, userId, kind)
      return consent !== null && consent.version >= CONSENT_VERSIONS[kind]
    },

    /** Records explicit consent for the current version of the consent text. */
    async grantConsent(userId: string, kind: ConsentKind, version: number): Promise<void> {
      if (version !== CONSENT_VERSIONS[kind]) {
        throw new AppError('conflict', 'Consent text has changed. Review it and try again.')
      }
      const existing = await findActiveConsent(db, userId, kind)
      if (existing && existing.version < version) await revokeActiveConsent(db, userId, kind)
      await insertConsent(db, userId, kind, version)
    },

    async revokeConsent(userId: string, kind: ConsentKind): Promise<void> {
      await revokeActiveConsent(db, userId, kind)
    },
  }
}

export type ProfileService = ReturnType<typeof createProfileService>
