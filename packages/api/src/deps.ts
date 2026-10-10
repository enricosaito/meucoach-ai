import {
  createAiCallRecorder,
  createAiGateway,
  createAiProvider,
  createCoachingService,
  type CoachingService,
} from '@mycoach/core/coaching'
import { createGamificationService, type GamificationService } from '@mycoach/core/gamification'
import { createNutritionService, type NutritionService } from '@mycoach/core/nutrition'
import { createProfileService, type ProfileService } from '@mycoach/core/profile'
import type { Logger } from '@mycoach/core/shared'
import { createTrainingService, type TrainingService } from '@mycoach/core/training'
import type { AdminClient } from '@mycoach/db'
import { createAdminClient } from '@mycoach/db/admin'
import {
  createJobFunctions,
  getJobHealth,
  inngest,
  outboxDispatchRequested,
  type JobHealth,
} from '@mycoach/jobs'
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
  training: TrainingService
  nutrition: NutritionService
  gamification: GamificationService
  limits: { perMinute: number; chatPerMinute: number }
  /** Browser origins allowed to call the API cross-origin (see API_CORS_ORIGINS). */
  corsOrigins: string[]
  /** Background functions served at /api/inngest. */
  jobFunctions: ReturnType<typeof createJobFunctions>
  /**
   * Asks the outbox dispatcher to run now instead of waiting for its cron. Best effort: if this
   * fails, the cron still delivers the event within a minute.
   */
  nudgeOutbox: () => Promise<void>
  /** Health of the background pipeline (public, aggregates only). */
  jobHealth: () => Promise<JobHealth>
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
      mockDelayMs: env.AI_MOCK_DELAY_MS,
    }),
    models: {
      ...(env.AI_MODEL_FAST && { fast: env.AI_MODEL_FAST }),
      ...(env.AI_MODEL_SMART && { smart: env.AI_MODEL_SMART }),
    },
    recordCall: createAiCallRecorder(db),
    logger: logger.child({ component: 'ai-gateway' }),
  })
  const training = createTrainingService({
    db,
    gateway,
    profile,
    logger: logger.child({ module: 'training' }),
  })
  const nutrition = createNutritionService({
    db,
    gateway,
    profile,
    logger: logger.child({ module: 'nutrition' }),
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
    training,
    nutrition,
    gamification: createGamificationService({ db }),
    limits: { perMinute: env.RATE_LIMIT_PER_MINUTE, chatPerMinute: env.CHAT_RATE_LIMIT_PER_MINUTE },
    corsOrigins: env.API_CORS_ORIGINS,
    jobFunctions: createJobFunctions({ db, training, nutrition, logger }),
    nudgeOutbox: async () => {
      try {
        await inngest.send(outboxDispatchRequested.create({}))
      } catch (error) {
        logger.warn({ err: error }, 'outbox nudge failed; the cron will deliver the event')
      }
    },
    jobHealth: () => getJobHealth(db),
    ...overrides,
  }
}
