import { zValidator } from '@hono/zod-validator'
import { AppError } from '@mycoach/core/shared'
import type { ZodType } from 'zod'

/** JSON body validation using the Zod schemas from packages/core. Errors use the API error shape. */
export function jsonBody<T extends ZodType>(schema: T) {
  return zValidator('json', schema, (result) => {
    if (!result.success) {
      throw new AppError('validation_failed', 'Request body is invalid', {
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      })
    }
  })
}
