import type { AdminClient } from '@mycoach/db'
import { AppError } from './errors'

export type { AdminClient }

export function dbError(operation: string, error: { message: string; code?: string }): AppError {
  return new AppError('internal', `Database error during ${operation}`, { cause: error })
}
