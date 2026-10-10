import { inngest } from '@mycoach/jobs'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from 'inngest/hono'
import type { AppDeps } from './deps'
import { requireAuth } from './middleware/auth'
import { handleError, handleNotFound } from './middleware/error-handler'
import { idempotency } from './middleware/idempotency'
import { rateLimit } from './middleware/rate-limit'
import { requestId } from './middleware/request-id'
import { chatRoutes } from './routes/chat'
import { meRoutes } from './routes/me'
import { nutritionRoutes } from './routes/nutrition'
import { trainingRoutes } from './routes/training'
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
    .route('/training', trainingRoutes)
    .route('/nutrition', nutritionRoutes)
}

function v1Routes() {
  return (
    new Hono<AppEnv>()
      .get('/health', (c) => c.json({ status: 'ok' as const, time: new Date().toISOString() }))
      // Background pipeline health for uptime monitors: 503 when jobs are stuck. Aggregates only.
      .get('/health/jobs', async (c) => {
        const health = await c.var.deps.jobHealth()
        return c.json(health, health.status === 'ok' ? 200 : 503)
      })
      .route('/', protectedRoutes())
  )
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
  // Opt-in CORS for browser clients on other origins (dev only). Auth is a bearer token, never a
  // cookie, for those clients, so no credentials are allowed.
  if (deps.corsOrigins.length > 0) {
    app.use(
      '/v1/*',
      cors({
        origin: deps.corsOrigins,
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['authorization', 'content-type', 'idempotency-key', 'x-request-id'],
        exposeHeaders: ['x-request-id'],
        maxAge: 600,
      }),
    )
  }
  app.onError(handleError)
  app.notFound(handleNotFound)
  // Inngest calls this endpoint to run background functions. Requests are verified with the
  // signing key (not user auth); in local dev the Inngest Dev Server calls it.
  app.on(
    ['GET', 'PUT', 'POST'],
    '/inngest',
    serve({ client: inngest, functions: deps.jobFunctions }),
  )
  return app.route('/v1', v1Routes())
}

export type App = ReturnType<typeof createApp>
