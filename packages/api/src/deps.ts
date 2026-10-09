import {
  createAiCallRecorder,
  createAiGateway,
  createAiProvider,
  createCoachingService,
  type CoachingService,
} from '@mycoach/core/coaching'
import { createProfileService, type ProfileService } from '@mycoach/core/profile'
import type { Logger } from '@mycoach/core/shared'
import type { AdminClient } from '@mycoach/db'
import { createAdminClient } from '@mycoach/db/admin'
import { createSupabaseAuthVerifier, type AuthVerifier } from './auth/auth-verifier'
import type { ApiEnv } from './env'
import type { IdempotencyStore } from './idempotency/idempotency-store'
import { createSupabaseIdempotencyStore } from './idempotency/supabase-idempotency-store'
import { createLogger } from './logger'
import { createInMemoryRateLimiter, type RateLimiter } from './rate-limit/rate-limiter'

/** Everything the API needs. Tests and alternative hosts can supply their own implementations. */
export interface AppDeps {
  logger: Logger
  auth: AuthVerifier
  rateLimiter: RateLimiter
  idempotency: IdempotencyStore
  profile: ProfileService
  coaching: CoachingService
  limits: { perMinute: number; chatPerMinute: number }
}

export function createDefaultDeps(env: ApiEnv, overrides: Partial<AppDeps> = {}): AppDeps {
  const logger = overrides.logger ?? createLogger(env.LOG_LEVEL)
  const db: AdminClient = createAdminClient({
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    secretKey: env.SUPABASE_SECRET_KEY,
  })
  const profile = createProfileService({ db })
  const gateway = createAiGateway({
    provider: createAiProvider({
      provider: env.AI_PROVIDER,
      anthropicApiKey: env.ANTHROPIC_API_KEY,
      model: env.AI_MODEL,
      mockDelayMs: env.AI_MOCK_DELAY_MS,
    }),
    recordCall: createAiCallRecorder(db),
    logger: logger.child({ component: 'ai-gateway' }),
  })

  return {
    logger,
    auth: createSupabaseAuthVerifier({
      url: env.NEXT_PUBLIC_SUPABASE_URL,
      publishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }),
    rateLimiter: createInMemoryRateLimiter(),
    idempotency: createSupabaseIdempotencyStore(db),
    profile,
    coaching: createCoachingService({ db, gateway, profile }),
    limits: { perMinute: env.RATE_LIMIT_PER_MINUTE, chatPerMinute: env.CHAT_RATE_LIMIT_PER_MINUTE },
    ...overrides,
  }
}
