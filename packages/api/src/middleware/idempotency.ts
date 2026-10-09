import { AppError } from '@mycoach/core/shared'
import { createMiddleware } from 'hono/factory'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { AppEnv } from '../types'

export const IDEMPOTENCY_HEADER = 'idempotency-key'
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const VALID_KEY = /^[\w.:-]{8,255}$/

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Every mutating request must carry an `Idempotency-Key` header. A retry with the same key and
 * body replays the stored response instead of performing the write twice. Must run after auth.
 */
export const idempotency = createMiddleware<AppEnv>(async (c, next) => {
  if (!MUTATING_METHODS.has(c.req.method)) return next()

  const key = c.req.header(IDEMPOTENCY_HEADER)
  if (!key) {
    throw new AppError('idempotency_key_required', 'Idempotency-Key header is required')
  }
  if (!VALID_KEY.test(key)) {
    throw new AppError('bad_request', 'Idempotency-Key must be 8-255 chars of [A-Za-z0-9_.:-]')
  }

  const { idempotency: store } = c.var.deps
  const userId = c.var.userId
  // Body is cached by Hono, so validators can still read it afterwards.
  const requestHash = await sha256Hex(`${c.req.method} ${c.req.path}\n${await c.req.text()}`)
  const claim = await store.claim(userId, key, requestHash)

  switch (claim.kind) {
    case 'mismatch':
      throw new AppError(
        'idempotency_key_reused',
        'This Idempotency-Key was already used with a different request',
      )
    case 'in_progress':
      throw new AppError('idempotency_in_progress', 'A request with this key is still in progress')
    case 'replay':
      c.header('idempotent-replayed', 'true')
      return c.json(claim.body, claim.status as ContentfulStatusCode)
    case 'claimed':
      break
  }

  try {
    await next()
  } catch (error) {
    await store.release(userId, key)
    throw error
  }

  // Hono's compose catches handler errors and routes them through onError, so check the status.
  if (c.res.status >= 500) {
    await store.release(userId, key)
    return
  }
  const body: unknown = await c.res
    .clone()
    .json()
    .catch(() => null)
  await store.complete(userId, key, c.res.status, body)
})
