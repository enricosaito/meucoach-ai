import type { Logger } from '@mycoach/core/shared'
import type { AppDeps } from './deps'

export interface AppEnv {
  Variables: {
    deps: AppDeps
    requestId: string
    logger: Logger
    /** Set by the auth middleware from the verified token. The only valid source of a user ID. */
    userId: string
  }
}

export interface ErrorBody {
  error: {
    code: string
    message: string
    requestId: string
    details?: unknown
  }
}
