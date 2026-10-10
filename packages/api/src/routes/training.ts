import { photoUploadRequestSchema, requestPlanSchema } from '@mycoach/core/training'
import { Hono } from 'hono'
import { z } from 'zod'
import { rateLimit } from '../middleware/rate-limit'
import type { AppEnv } from '../types'
import { jsonBody } from '../validation'

const scanIdParam = z.object({ scanId: z.uuid() })

export const trainingRoutes = new Hono<AppEnv>()
  // Step 1 of a body scan: signed upload URLs (requires photo consent).
  .post('/photos/upload-urls', jsonBody(photoUploadRequestSchema), async (c) => {
    const result = await c.var.deps.training.createPhotoUploads(c.var.userId, c.req.valid('json'))
    return c.json(result, 201)
  })
  // Saves the questionnaire (+ scan) and queues AI generation; poll the plan row for progress.
  .post(
    '/plans',
    rateLimit('plans', (deps) => Math.max(1, Math.floor(deps.limits.chatPerMinute / 2))),
    jsonBody(requestPlanSchema),
    async (c) => {
      const { planId } = await c.var.deps.training.requestPlan(c.var.userId, c.req.valid('json'), {
        requestId: c.var.requestId,
      })
      await c.var.deps.nudgeOutbox()
      return c.json({ planId, status: 'pending' as const }, 202)
    },
  )
  .delete('/body-scans/:scanId', async (c) => {
    const { scanId } = scanIdParam.parse(c.req.param())
    await c.var.deps.training.deleteBodyScan(c.var.userId, scanId)
    return c.json({ deleted: true as const })
  })
