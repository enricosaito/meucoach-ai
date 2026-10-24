import type { NutritionService } from '@mycoach/core/nutrition'
import type { TrainingService } from '@mycoach/core/training'
import type { Logger } from '@mycoach/core/shared'
import type { AdminClient } from '@mycoach/db'
import { inngest } from '../client'
import {
  dietPlanRequested,
  dietPlanRequestedSchema,
  outboxDispatchRequested,
  planRequested,
  planRequestedSchema,
} from '../events'
import { dispatchOutbox } from '../outbox'

export interface JobDeps {
  db: AdminClient
  training: TrainingService
  nutrition: NutritionService
  logger: Logger
}

/**
 * All background functions. Every step is idempotent: Inngest retries failed steps, and a step
 * that already succeeded is not re-run.
 */
export function createJobFunctions(deps: JobDeps) {
  const outboxDispatcher = inngest.createFunction(
    {
      id: 'outbox-dispatcher',
      // Only the API's nudge triggers it: the every-minute safety-net cron is off while the project
      // is paused (~43k Inngest runs/month). A missed nudge is delivered by the next write's nudge.
      // Re-add a cron (e.g. `{ cron: '*/15 * * * *' }`) when the project resumes.
      triggers: [outboxDispatchRequested],
      concurrency: { limit: 1 },
    },
    async ({ step }) => {
      const count = await step.run('dispatch', () =>
        dispatchOutbox(
          deps.db,
          async (events) => {
            await inngest.send(events)
          },
          deps.logger.child({ job: 'outbox-dispatcher' }),
        ),
      )
      return { dispatched: count }
    },
  )

  const generateWorkoutPlan = inngest.createFunction(
    {
      id: 'generate-workout-plan',
      triggers: [planRequested],
      retries: 3,
      // One generation at a time per user; plans for different users run in parallel.
      concurrency: { key: 'event.data.userId', limit: 1 },
      onFailure: async ({ event, error }) => {
        const { userId, planId, requestId } = planRequestedSchema.parse(event.data.event.data)
        deps.logger.error({ err: error, planId, requestId }, 'workout plan generation failed')
        await deps.training.markPlanFailed(userId, planId, error.message)
      },
    },
    async ({ event, step }) => {
      const { userId, planId, requestId } = event.data
      const logger = deps.logger.child({ job: 'generate-workout-plan', planId, requestId })

      const job = await step.run('load', () => deps.training.getPlanJob(userId, planId))
      if (!job) {
        logger.info({}, 'plan already generated, nothing to do')
        return { status: 'skipped' }
      }

      const analysis = job.bodyScanId
        ? await step.run('analyze-body-scan', () =>
            deps.training.analyzeBodyScan(userId, job.bodyScanId ?? '', job.inputs, { requestId }),
          )
        : null

      await step.run('generate-plan', () =>
        deps.training.generatePlan(userId, planId, analysis, { requestId }),
      )
      logger.info({ withAnalysis: analysis !== null }, 'workout plan ready')
      return { status: 'ready' }
    },
  )

  const generateDietPlan = inngest.createFunction(
    {
      id: 'generate-diet-plan',
      triggers: [dietPlanRequested],
      retries: 3,
      concurrency: { key: 'event.data.userId', limit: 1 },
      onFailure: async ({ event, error }) => {
        const { userId, planId, requestId } = dietPlanRequestedSchema.parse(event.data.event.data)
        deps.logger.error({ err: error, planId, requestId }, 'diet plan generation failed')
        await deps.nutrition.markDietPlanFailed(userId, planId, error.message)
      },
    },
    async ({ event, step }) => {
      const { userId, planId, requestId } = event.data
      const logger = deps.logger.child({ job: 'generate-diet-plan', planId, requestId })
      // One step: the service skips plans that are already ready, so a retry never calls the AI
      // for a finished plan.
      await step.run('generate-diet', () =>
        deps.nutrition.generateDietPlan(userId, planId, { requestId }),
      )
      logger.info({}, 'diet plan ready')
      return { status: 'ready' }
    },
  )

  return [outboxDispatcher, generateWorkoutPlan, generateDietPlan]
}
