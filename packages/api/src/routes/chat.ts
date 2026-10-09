import { sendChatMessageSchema } from '@mycoach/core/coaching'
import { Hono } from 'hono'
import { rateLimit } from '../middleware/rate-limit'
import type { AppEnv } from '../types'
import { jsonBody } from '../validation'

export const chatRoutes = new Hono<AppEnv>().post(
  '/messages',
  // AI calls cost money: a tighter per-user limit on top of the global one.
  rateLimit('chat', (deps) => deps.limits.chatPerMinute),
  jsonBody(sendChatMessageSchema),
  async (c) => {
    const { content } = c.req.valid('json')
    const exchange = await c.var.deps.coaching.sendMessage(c.var.userId, content, {
      requestId: c.var.requestId,
    })
    return c.json(exchange, 201)
  },
)
