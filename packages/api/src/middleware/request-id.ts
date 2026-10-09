import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types'

export const REQUEST_ID_HEADER = 'x-request-id'
const VALID_REQUEST_ID = /^[\w.-]{1,128}$/

/** Accepts a caller-supplied request ID (for tracing across services) or generates one. */
export const requestId = createMiddleware<AppEnv>(async (c, next) => {
  const incoming = c.req.header(REQUEST_ID_HEADER)
  const id = incoming && VALID_REQUEST_ID.test(incoming) ? incoming : crypto.randomUUID()
  const logger = c.var.deps.logger.child({ requestId: id })
  c.set('requestId', id)
  c.set('logger', logger)
  c.header(REQUEST_ID_HEADER, id)

  const started = performance.now()
  await next()
  logger.info(
    {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: Math.round(performance.now() - started),
    },
    'request completed',
  )
})
