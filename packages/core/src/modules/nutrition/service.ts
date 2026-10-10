import type { AiGateway } from '../coaching'
import type { ProfileService } from '../profile'
import { AppError, noopLogger, type AdminClient, type Logger } from '../../shared'
import { targetsForMe } from './contracts'
import {
  countDietPlansSince,
  findDietPlan,
  requestDietPlanAtomically,
  updateDietPlan,
} from './data/diet-repository'
import { dietPlanIssues } from './domain/diet-validation'
import { buildTemplateDiet } from './domain/template-diet'
import { dietPlanPrompt } from './prompts'
import { dietPlanSchema, type RequestDietPlanInput } from './schemas'
import type { DietInputs } from './types'

export const DIET_PLAN_FEATURE = 'diet_plan'

/** Cost guard until freemium entitlements exist. */
export const MAX_DIET_PLANS_PER_DAY = 3
const DAY_MS = 24 * 60 * 60 * 1000

export function createNutritionService(deps: {
  db: AdminClient
  gateway: AiGateway
  profile: Pick<ProfileService, 'getMe'>
  logger?: Logger
  now?: () => Date
}) {
  const { db, gateway, profile } = deps
  const logger = deps.logger ?? noopLogger
  const now = deps.now ?? (() => new Date())

  /** Loads what the generation job needs. Returns null if the plan no longer needs work. */
  async function getDietPlanJob(
    userId: string,
    planId: string,
  ): Promise<{ inputs: DietInputs } | null> {
    const plan = await findDietPlan(db, userId, planId)
    if (!plan || plan.status === 'ready') return null
    return { inputs: plan.inputs as unknown as DietInputs }
  }

  return {
    getDietPlanJob,

    /**
     * Saves the questionnaire and queues diet generation. Needs the energy test: the plan is built
     * to hit the user's calorie and macro targets. Plan row and outbox event are one transaction.
     */
    async requestDietPlan(
      userId: string,
      input: RequestDietPlanInput,
      options: { requestId?: string } = {},
    ): Promise<{ planId: string }> {
      const me = await profile.getMe(userId)
      const targets = targetsForMe(me)
      const a = me.latestAssessment
      if (!targets || !a) {
        throw new AppError('energy_test_required', 'Take the energy test before creating a diet')
      }
      const recent = await countDietPlansSince(db, userId, new Date(now().getTime() - DAY_MS))
      if (recent >= MAX_DIET_PLANS_PER_DAY) {
        throw new AppError('rate_limited', 'Daily diet plan limit reached. Try again tomorrow.')
      }

      const inputs: DietInputs = {
        questionnaire: input.questionnaire,
        goal: me.profile.goals.primary,
        locale: me.profile.locale,
        units: me.profile.units,
        body: { sex: a.sex, ageYears: a.ageYears, heightCm: a.heightCm, weightKg: a.weightKg },
        targets,
      }
      const planId = await requestDietPlanAtomically(db, {
        userId,
        questionnaire: input.questionnaire,
        inputs,
        requestId: options.requestId ?? null,
      })
      return { planId }
    },

    /**
     * Background step: generates and stores the plan. Idempotent (a ready plan is left alone).
     * Throws on refusals or output that misses the targets, so the job retries.
     */
    async generateDietPlan(
      userId: string,
      planId: string,
      options: { requestId?: string } = {},
    ): Promise<void> {
      const job = await getDietPlanJob(userId, planId)
      if (!job) return
      const { inputs } = job
      await updateDietPlan(db, userId, planId, { status: 'generating' })

      const result = await gateway.structured({
        userId,
        feature: DIET_PLAN_FEATURE,
        promptVersion: dietPlanPrompt.version,
        requestId: options.requestId,
        tier: 'smart',
        effort: 'high',
        maxTokens: 16000,
        system: dietPlanPrompt.system,
        content: [{ type: 'text', text: dietPlanPrompt.buildUserText(inputs) }],
        schema: dietPlanSchema,
        mock: () => buildTemplateDiet(inputs),
      })

      if (!result.data) {
        throw new AppError(
          'ai_unavailable',
          result.refused ? 'Diet generation was refused' : 'Diet output was invalid',
        )
      }
      const issues = dietPlanIssues(result.data, inputs)
      if (issues.length > 0) {
        logger.warn({ planId, issues }, 'generated diet failed checks')
        throw new AppError('ai_unavailable', `Generated diet failed checks: ${issues.join('; ')}`)
      }

      await updateDietPlan(db, userId, planId, {
        status: 'ready',
        plan: result.data,
        model: result.model,
        prompt_version: dietPlanPrompt.version,
        ai_call_id: result.aiCallId,
        error: null,
        completed_at: now().toISOString(),
      })
    },

    /** Called once all retries are exhausted. */
    async markDietPlanFailed(userId: string, planId: string, message: string): Promise<void> {
      await updateDietPlan(db, userId, planId, {
        status: 'failed',
        error: message.slice(0, 1000),
        completed_at: now().toISOString(),
      })
    },
  }
}

export type NutritionService = ReturnType<typeof createNutritionService>
