import { sendChatMessageSchema, sendVoiceMessageSchema } from '@mycoach/core/coaching'
import { Hono } from 'hono'
import { rateLimit } from '../middleware/rate-limit'
import type { AppEnv } from '../types'
import { jsonBody } from '../validation'

export const chatRoutes = new Hono<AppEnv>()
  .post(
    '/messages',
    // AI calls cost money: a tighter per-user limit on top of the global one.
    rateLimit('chat', (deps) => deps.limits.chatPerMinute),
    jsonBody(sendChatMessageSchema),
    async (c) => {
      const { content, image } = c.req.valid('json')
      const exchange = await c.var.deps.coaching.sendMessage(
        c.var.userId,
        { content, image },
        {
          requestId: c.var.requestId,
        },
      )
      return c.json(exchange, 201)
    },
  )
  // A voice note: transcribed (audio discarded), then answered like a text message.
  .post(
    '/voice',
    rateLimit('chat', (deps) => deps.limits.chatPerMinute),
    jsonBody(sendVoiceMessageSchema),
    async (c) => {
      const exchange = await c.var.deps.coaching.sendVoiceMessage(
        c.var.userId,
        c.req.valid('json'),
        { requestId: c.var.requestId },
      )
      return c.json(exchange, 201)
    },
  )
  // Today's coach check-in (written on the first call of the user's local day, then reused).
  // A POST because the first call creates it; like every write it needs an Idempotency-Key.
  .post(
    '/check-in',
    rateLimit('chat', (deps) => deps.limits.chatPerMinute),
    async (c) => {
      const checkIn = await c.var.deps.coaching.getDailyCheckIn(c.var.userId, {
        requestId: c.var.requestId,
      })
      return c.json(checkIn)
    },
  )
