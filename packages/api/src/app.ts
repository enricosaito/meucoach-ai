import { Hono } from 'hono'
import type { AppDeps } from './deps'
import { requireAuth } from './middleware/auth'
import { handleError, handleNotFound } from './middleware/error-handler'
import { idempotency } from './middleware/idempotency'
import { rateLimit } from './middleware/rate-limit'
import { requestId } from './middleware/request-id'
import { chatRoutes } from './routes/chat'
import { meRoutes } from './routes/me'
import type { AppEnv } from './types'

/** Authenticated routes: auth → per-user rate limit → idempotency (for mutations). */
function protectedRoutes() {
  return new Hono<AppEnv>()
    .use(
      requireAuth,
      rateLimit('global', (deps) => deps.limits.perMinute),
      idempotency,
    )
    .route('/me', meRoutes)
    .route('/chat', chatRoutes)
}

function v1Routes() {
  return new Hono<AppEnv>()
    .get('/health', (c) => c.json({ status: 'ok' as const, time: new Date().toISOString() }))
    .route('/', protectedRoutes())
}

/**
 * Builds the API. Framework-agnostic: mounted in Next.js via a catch-all route today, and can be
 * served standalone (e.g. `@hono/node-server`) later with `serve({ fetch: app.fetch })`.
 */
export function createApp(deps: AppDeps) {
  const app = new Hono<AppEnv>().basePath('/api')
  app.use(async (c, next) => {
    c.set('deps', deps)
    c.set('logger', deps.logger)
    await next()
  })
  app.use(requestId)
  app.onError(handleError)
  app.notFound(handleNotFound)
  return app.route('/v1', v1Routes())
}

export type App = ReturnType<typeof createApp>
