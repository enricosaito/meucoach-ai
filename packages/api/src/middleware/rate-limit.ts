import { AppError } from '@mycoach/core/shared'
import { createMiddleware } from 'hono/factory'
import type { AppDeps } from '../deps'
import type { AppEnv } from '../types'

const WINDOW_MS = 60_000

/** Per-user rate limit. Must run after `requireAuth`. */
export function rateLimit(bucket: string, limit: (deps: AppDeps) => number) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const max = limit(c.var.deps)
    const result = await c.var.deps.rateLimiter.consume(`${bucket}:${c.var.userId}`, max, WINDOW_MS)
    c.header('ratelimit-limit', String(result.limit))
    c.header('ratelimit-remaining', String(result.remaining))
    if (!result.allowed) {
      const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))
      c.header('retry-after', String(retryAfter))
      throw new AppError('rate_limited', 'Too many requests. Slow down and try again shortly.')
    }
    await next()
  })
}
