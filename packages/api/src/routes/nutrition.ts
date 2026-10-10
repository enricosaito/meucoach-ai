import { requestDietPlanSchema } from '@mycoach/core/nutrition'
import { Hono } from 'hono'
import { rateLimit } from '../middleware/rate-limit'
import type { AppEnv } from '../types'
import { jsonBody } from '../validation'

export const nutritionRoutes = new Hono<AppEnv>()
  // Saves the diet questionnaire and queues AI generation; poll the plan row for progress.
  .post(
    '/diet-plans',
    rateLimit('diet-plans', (deps) => Math.max(1, Math.floor(deps.limits.chatPerMinute / 2))),
    jsonBody(requestDietPlanSchema),
    async (c) => {
      const { planId } = await c.var.deps.nutrition.requestDietPlan(
        c.var.userId,
        c.req.valid('json'),
        { requestId: c.var.requestId },
      )
      await c.var.deps.nudgeOutbox()
      return c.json({ planId, status: 'pending' as const }, 202)
    },
  )
