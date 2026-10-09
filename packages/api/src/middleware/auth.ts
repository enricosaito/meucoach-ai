import { AppError } from '@mycoach/core/shared'
import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types'

/** Rejects unauthenticated requests and exposes the verified user ID as `c.var.userId`. */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const user = await c.var.deps.auth.verify({
    headers: c.req.raw.headers,
    setResponseHeader: (name, value, options) => {
      c.header(name, value, options)
    },
  })
  if (!user) throw new AppError('unauthorized', 'Sign in required')
  c.set('userId', user.userId)
  c.set('logger', c.var.logger.child({ userId: user.userId }))
  await next()
})
