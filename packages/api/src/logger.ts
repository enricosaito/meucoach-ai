import type { Logger } from '@mycoach/core/shared'
import { pino } from 'pino'

/** JSON structured logs to stdout. Every request gets a child logger bound to its request ID. */
export function createLogger(level: string): Logger {
  return pino({
    level,
    base: { service: 'api' },
    redact: ['req.headers.authorization', 'req.headers.cookie', '*.apiKey', '*.secretKey'],
  })
}
