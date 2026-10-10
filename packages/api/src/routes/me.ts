import { targetsForMe } from '@mycoach/core/nutrition'
import {
  CONSENT_KINDS,
  assessmentInputSchema,
  type ConsentKind,
  grantConsentSchema,
  updateProfileSchema,
} from '@mycoach/core/profile'
import { Hono } from 'hono'
import { z } from 'zod'
import type { AppDeps } from '../deps'
import type { AppEnv } from '../types'
import { jsonBody } from '../validation'

const consentParam = z.object({ kind: z.enum(CONSENT_KINDS) })

/** Data that must be deleted when a consent is revoked (LGPD). Returns how many items were removed. */
const ON_REVOKE: Record<ConsentKind, (deps: AppDeps, userId: string) => Promise<number>> = {
  body_photos: (deps, userId) => deps.training.deleteAllBodyScans(userId),
}

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
  // Explicit, versioned consent (LGPD). Granting is idempotent.
  .put('/consents/:kind', jsonBody(grantConsentSchema), async (c) => {
    const { kind } = consentParam.parse(c.req.param())
    await c.var.deps.profile.grantConsent(c.var.userId, kind, c.req.valid('json').version)
    return c.json({ kind, granted: true as const })
  })
  // Revoking photo consent also deletes every stored progress photo and analysis.
  .delete('/consents/:kind', async (c) => {
    const { kind } = consentParam.parse(c.req.param())
    await c.var.deps.profile.revokeConsent(c.var.userId, kind)
    const deletedItems = await ON_REVOKE[kind](c.var.deps, c.var.userId)
    return c.json({ kind, granted: false as const, deletedItems })
  })
