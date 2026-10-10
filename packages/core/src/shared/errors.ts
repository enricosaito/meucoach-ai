export type ErrorCode =
  | 'bad_request'
  | 'validation_failed'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'username_taken'
  | 'idempotency_key_required'
  | 'idempotency_key_reused'
  | 'idempotency_in_progress'
  | 'rate_limited'
  | 'ai_unavailable'
  | 'internal'

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  bad_request: 400,
  validation_failed: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  username_taken: 409,
  idempotency_key_required: 400,
  idempotency_key_reused: 422,
  idempotency_in_progress: 409,
  rate_limited: 429,
  ai_unavailable: 502,
  internal: 500,
}

/** An expected, user-facing error. Anything else that is thrown is treated as an internal error. */
export class AppError extends Error {
  readonly code: ErrorCode
  readonly status: number
  readonly details: unknown

  constructor(code: ErrorCode, message: string, options?: { details?: unknown; cause?: unknown }) {
    super(message, { cause: options?.cause })
    this.name = 'AppError'
    this.code = code
    this.status = STATUS_BY_CODE[code]
    this.details = options?.details
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}
