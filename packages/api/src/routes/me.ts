import { targetsForMe } from '@mycoach/core/nutrition'
import { assessmentInputSchema, updateProfileSchema } from '@mycoach/core/profile'
import { Hono } from 'hono'
import type { AppEnv } from '../types'
import { jsonBody } from '../validation'

export const meRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const me = await c.var.deps.profile.getMe(c.var.userId)
    // Targets are derived on every read (never stored), so formula changes apply immediately.
    return c.json({ ...me, targets: targetsForMe(me) })
  })
  .patch('/profile', jsonBody(updateProfileSchema), async (c) => {
    const profile = await c.var.deps.profile.updateProfile(c.var.userId, c.req.valid('json'))
    return c.json({ profile })
  })
  // Mifflin-St Jeor test: computes BMR/TDEE server-side and stores the result.
  .post('/assessments', jsonBody(assessmentInputSchema), async (c) => {
    const assessment = await c.var.deps.profile.recordAssessment(c.var.userId, c.req.valid('json'))
    return c.json({ assessment }, 201)
  })
