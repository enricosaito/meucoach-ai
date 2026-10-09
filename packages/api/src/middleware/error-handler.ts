import { AppError, isAppError, type ErrorCode } from '@mycoach/core/shared'
import type { Context, ErrorHandler, NotFoundHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { AppEnv, ErrorBody } from '../types'

function errorBody(c: Context<AppEnv>, error: AppError): ErrorBody {
  return {
    error: {
      code: error.code,
      message: error.message,
      requestId: c.var.requestId,
      ...(error.details !== undefined && { details: error.details }),
    },
  }
}

const CODE_BY_STATUS: Partial<Record<number, ErrorCode>> = {
  400: 'bad_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  429: 'rate_limited',
}

/** Every error leaves the API in the same JSON shape: `{ error: { code, message, requestId } }`. */
export const handleError: ErrorHandler<AppEnv> = (err, c) => {
  const logger = c.var.logger
  let error: AppError
  if (isAppError(err)) {
    error = err
  } else if (err instanceof HTTPException && err.status < 500) {
    error = new AppError(CODE_BY_STATUS[err.status] ?? 'bad_request', err.message)
  } else {
    logger.error({ err }, 'unhandled error')
    error = new AppError('internal', 'Something went wrong')
  }
  if (error.status >= 500 && isAppError(err)) logger.error({ err }, error.message)
  return c.json(errorBody(c, error), error.status as ContentfulStatusCode)
}

export const handleNotFound: NotFoundHandler<AppEnv> = (c) =>
  c.json(errorBody(c, new AppError('not_found', `No route for ${c.req.method} ${c.req.path}`)), 404)
