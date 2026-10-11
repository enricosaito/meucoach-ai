import type { AiGateway } from '../coaching'
import { localDay } from '../gamification'
import { targetsForMe } from '../nutrition/contracts'
import type { ProfileService } from '../profile'
import { AppError, noopLogger, type Logger, type AdminClient } from '../../shared'
import {
  assertPhotosUploaded,
  createSignedUploads,
  downloadPhotoBase64,
  photoPath,
  removeAllUserPhotos,
  removePhotos,
  type SignedUpload,
} from './data/photo-storage'
import {
  countPlansSince,
  deleteScanRows,
  findLatestReadyPlan,
  findLimitations,
  findPlan,
  findScan,
  insertWorkoutSession,
  listScanRows,
  listSessionsSince,
  requestPlanAtomically,
  updatePlan,
  updateScan,
} from './data/training-repository'
import { scanPhotos } from './domain/mappers'
import { toWorkoutSession, type WorkoutSession } from './domain/workout-log'
import { normalizeAnalysis, planIssues } from './domain/plan-validation'
import { buildMockBodyAnalysis, buildTemplatePlan } from './domain/template-plan'
import { bodyAnalysisPrompt, workoutPlanPrompt } from './prompts'
import {
  bodyAnalysisSchema,
  workoutPlanSchema,
  type BodyAnalysis,
  type LogWorkoutInput,
  type PhotoContentType,
  type PhotoUploadRequest,
  type RequestPlanInput,
} from './schemas'
import type { CoachSnapshot, PlanInputs } from './types'

export const BODY_ANALYSIS_FEATURE = 'body_analysis'
export const WORKOUT_PLAN_FEATURE = 'workout_plan'

/** Cost guard until freemium entitlements exist. */
export const MAX_PLANS_PER_DAY = 3
const DAY_MS = 24 * 60 * 60 * 1000

const MEDIA_TYPES: Record<string, PhotoContentType> = {
  jpg: 'image/jpeg',
  webp: 'image/webp',
  png: 'image/png',
}

export function createTrainingService(deps: {
  db: AdminClient
  gateway: AiGateway
  profile: Pick<ProfileService, 'getMe' | 'hasActiveConsent'>
  logger?: Logger
  now?: () => Date
}) {
  const { db, gateway, profile } = deps
  const logger = deps.logger ?? noopLogger
  const now = deps.now ?? (() => new Date())

  async function requirePhotoConsent(userId: string): Promise<void> {
    if (!(await profile.hasActiveConsent(userId, 'body_photos'))) {
      throw new AppError('forbidden', 'Consent to store and analyse body photos is required')
    }
  }

  async function buildInputs(userId: string, questionnaire: RequestPlanInput['questionnaire']) {
    const me = await profile.getMe(userId)
    const a = me.latestAssessment
    const inputs: PlanInputs = {
      questionnaire,
      goal: me.profile.goals.primary,
      locale: me.profile.locale,
      units: me.profile.units,
      body: a
        ? {
            sex: a.sex,
            ageYears: a.ageYears,
            heightCm: a.heightCm,
            weightKg: a.weightKg,
            activityLevel: a.activityLevel,
          }
        : null,
      targets: targetsForMe(me),
    }
    return inputs
  }

  /** Loads what the generation job needs. Returns null if the plan no longer needs work. */
  async function getPlanJob(
    userId: string,
    planId: string,
  ): Promise<{ inputs: PlanInputs; bodyScanId: string | null } | null> {
    const plan = await findPlan(db, userId, planId)
    if (!plan || plan.status === 'ready') return null
    return { inputs: plan.inputs as unknown as PlanInputs, bodyScanId: plan.body_scan_id }
  }

  return {
    getPlanJob,

    /** Step 1 of a photo scan: consent check, then signed upload URLs for each requested view. */
    async createPhotoUploads(
      userId: string,
      input: PhotoUploadRequest,
    ): Promise<{ scanId: string; uploads: SignedUpload[] }> {
      await requirePhotoConsent(userId)
      const me = await profile.getMe(userId)
      if (me.latestAssessment && me.latestAssessment.ageYears < 18) {
        throw new AppError('forbidden', 'Body photo analysis is only available for adults')
      }
      const scanId = crypto.randomUUID()
      const uploads = await createSignedUploads(db, userId, scanId, input.views, input.contentType)
      return { scanId, uploads }
    },

    /**
     * Saves the questionnaire (and the scan, if photos were uploaded) and queues plan generation.
     * The plan row and its outbox event are written in one transaction.
     */
    async requestPlan(
      userId: string,
      input: RequestPlanInput,
      options: { requestId?: string } = {},
    ): Promise<{ planId: string }> {
      const recent = await countPlansSince(db, userId, new Date(now().getTime() - DAY_MS))
      if (recent >= MAX_PLANS_PER_DAY) {
        throw new AppError('rate_limited', 'Daily plan limit reached. Try again tomorrow.')
      }

      let scan: Parameters<typeof requestPlanAtomically>[1]['scan'] = null
      if (input.bodyScan) {
        const { scanId, views, contentType } = input.bodyScan
        await requirePhotoConsent(userId)
        const paths = Object.fromEntries(
          views.map((view) => [view, photoPath(userId, scanId, view, contentType)]),
        )
        await assertPhotosUploaded(db, userId, scanId, Object.values(paths))
        scan = {
          id: scanId,
          ...(paths.front && { frontPath: paths.front }),
          ...(paths.side && { sidePath: paths.side }),
          ...(paths.back && { backPath: paths.back }),
        }
      }

      const planId = await requestPlanAtomically(db, {
        userId,
        questionnaire: input.questionnaire,
        scan,
        inputs: await buildInputs(userId, input.questionnaire),
        requestId: options.requestId ?? null,
      })
      return { planId }
    },

    /**
     * Background step: AI analysis of a body scan. Idempotent: a finished scan returns its stored
     * result without calling the AI again. Returns null when the photos are unusable.
     */
    async analyzeBodyScan(
      userId: string,
      scanId: string,
      inputs: PlanInputs,
      options: { requestId?: string } = {},
    ): Promise<BodyAnalysis | null> {
      const row = await findScan(db, userId, scanId)
      if (!row) return null
      if (row.status === 'completed') {
        const stored = bodyAnalysisSchema.safeParse(row.analysis)
        return stored.success ? stored.data : null
      }
      if (row.status !== 'pending') return null

      const photos = scanPhotos(row)
      const images = await Promise.all(
        photos.map(async (photo) => ({
          type: 'image' as const,
          mediaType: MEDIA_TYPES[photo.path.split('.').pop() ?? ''] ?? 'image/jpeg',
          base64: await downloadPhotoBase64(db, photo.path),
        })),
      )

      const result = await gateway.structured({
        userId,
        feature: BODY_ANALYSIS_FEATURE,
        promptVersion: bodyAnalysisPrompt.version,
        requestId: options.requestId,
        tier: 'smart',
        effort: 'medium',
        maxTokens: 4000,
        system: bodyAnalysisPrompt.system,
        content: [
          ...images,
          {
            type: 'text',
            text: bodyAnalysisPrompt.buildUserText(
              inputs,
              photos.map((p) => p.view),
            ),
          },
        ],
        schema: bodyAnalysisSchema,
        mock: () => buildMockBodyAnalysis(inputs),
      })

      const base = {
        model: result.model,
        prompt_version: bodyAnalysisPrompt.version,
        ai_call_id: result.aiCallId,
        completed_at: now().toISOString(),
      }
      if (!result.data?.usable) {
        logger.warn({ scanId, refused: result.refused }, 'body scan unusable')
        await updateScan(db, userId, scanId, { ...base, status: 'unusable' })
        return null
      }
      const analysis = normalizeAnalysis(result.data)
      await updateScan(db, userId, scanId, { ...base, status: 'completed', analysis })
      return analysis
    },

    /**
     * Background step: generates and stores the plan. Idempotent (a ready plan is left alone).
     * Throws on refusals or invalid output so the job retries.
     */
    async generatePlan(
      userId: string,
      planId: string,
      analysis: BodyAnalysis | null,
      options: { requestId?: string } = {},
    ): Promise<void> {
      const job = await getPlanJob(userId, planId)
      if (!job) return
      const { inputs } = job
      await updatePlan(db, userId, planId, { status: 'generating' })

      const result = await gateway.structured({
        userId,
        feature: WORKOUT_PLAN_FEATURE,
        promptVersion: workoutPlanPrompt.version,
        requestId: options.requestId,
        tier: 'smart',
        effort: 'high',
        maxTokens: 16000,
        system: workoutPlanPrompt.system,
        content: [{ type: 'text', text: workoutPlanPrompt.buildUserText(inputs, analysis) }],
        schema: workoutPlanSchema,
        mock: () => buildTemplatePlan(inputs, analysis),
      })

      if (!result.data) {
        throw new AppError(
          'ai_unavailable',
          result.refused ? 'Plan generation was refused' : 'Plan output was invalid',
        )
      }
      const issues = planIssues(result.data, inputs)
      if (issues.length > 0) {
        throw new AppError('ai_unavailable', `Generated plan failed checks: ${issues.join('; ')}`)
      }

      await updatePlan(db, userId, planId, {
        status: 'ready',
        plan: result.data,
        model: result.model,
        prompt_version: workoutPlanPrompt.version,
        ai_call_id: result.aiCallId,
        error: null,
        completed_at: now().toISOString(),
      })
    },

    /** Called once all retries are exhausted. */
    async markPlanFailed(userId: string, planId: string, message: string): Promise<void> {
      await updatePlan(db, userId, planId, {
        status: 'failed',
        error: message.slice(0, 1000),
        completed_at: now().toISOString(),
      })
    },

    /** Deletes one scan: its photos first, then the row (plans keep working without it). */
    async deleteBodyScan(userId: string, scanId: string): Promise<void> {
      const row = await findScan(db, userId, scanId)
      if (!row) throw new AppError('not_found', 'Scan not found')
      await removePhotos(
        db,
        scanPhotos(row).map((p) => p.path),
      )
      await deleteScanRows(db, userId, [scanId])
    },

    /** Deletes every scan and photo for the user (consent revoked or account cleanup). */
    async deleteAllBodyScans(userId: string): Promise<number> {
      const rows = await listScanRows(db, userId)
      await removeAllUserPhotos(db, userId)
      await deleteScanRows(
        db,
        userId,
        rows.map((r) => r.id),
      )
      return rows.length
    },

    /**
     * What the coach may know about training, for the daily check-in: the current plan (titles and
     * focus only), workouts logged since `sinceLocalDate` and the user's written limitations.
     */
    async getCoachSnapshot(userId: string, sinceLocalDate: string): Promise<CoachSnapshot> {
      const [planRow, sessions, limitations] = await Promise.all([
        findLatestReadyPlan(db, userId),
        listSessionsSince(db, userId, sinceLocalDate),
        findLimitations(db, userId),
      ])
      const plan = planRow ? workoutPlanSchema.safeParse(planRow.plan) : null
      return {
        plan:
          planRow && plan?.success
            ? {
                id: planRow.id,
                days: plan.data.days.map((d) => ({ title: d.title, focus: d.focus })),
              }
            : null,
        sessions: sessions.map(toWorkoutSession),
        limitations,
      }
    },

    /**
     * Marks a day of a ready plan as done today (in the user's time zone). Idempotent: logging the
     * same day twice on one date returns the existing session with `created: false`.
     */
    async logWorkout(
      userId: string,
      input: LogWorkoutInput,
      timeZone: string,
    ): Promise<{ session: WorkoutSession; created: boolean }> {
      const row = await findPlan(db, userId, input.planId)
      const plan = row?.status === 'ready' ? workoutPlanSchema.safeParse(row.plan) : null
      if (!plan?.success) throw new AppError('not_found', 'Plan not found')
      const day = plan.data.days[input.dayIndex]
      if (!day) throw new AppError('validation_failed', 'This plan has no such day')

      const result = await insertWorkoutSession(db, {
        userId,
        planId: input.planId,
        dayIndex: input.dayIndex,
        dayTitle: day.title.slice(0, 200),
        localDate: localDay(now(), timeZone),
      })
      return { session: toWorkoutSession(result.row), created: result.created }
    },
  }
}

export type TrainingService = ReturnType<typeof createTrainingService>
