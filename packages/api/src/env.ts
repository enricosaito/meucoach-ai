import { AI_PROVIDER_NAMES, TRANSCRIPTION_PROVIDER_NAMES } from '@mycoach/core/coaching'
import { z } from 'zod'

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value)

export const apiEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    SUPABASE_SECRET_KEY: z.string().min(1),
    AI_PROVIDER: z.enum(AI_PROVIDER_NAMES).default('mock'),
    // Model overrides per tier (defaults: fast = claude-sonnet-5-5, smart = claude-opus-5-5).
    AI_MODEL_FAST: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    AI_MODEL_SMART: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    AI_MOCK_DELAY_MS: z.coerce.number().int().min(0).default(400),
    ANTHROPIC_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    // Voice notes: speech-to-text (mock by default; openai needs OPENAI_API_KEY).
    TRANSCRIPTION_PROVIDER: z.enum(TRANSCRIPTION_PROVIDER_NAMES).default('mock'),
    TRANSCRIPTION_MODEL: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    OPENAI_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    LOG_LEVEL: z
      .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
      .default('info'),
    RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(120),
    CHAT_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(10),
    // Comma-separated browser origins allowed to call the API cross-origin (e.g. the Expo web
    // dev server). Empty in production: native apps don't need CORS and the web app is
    // same-origin.
    API_CORS_ORIGINS: z
      .string()
      .default('')
      .transform((value) =>
        value
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean),
      ),
  })
  .refine((env) => env.AI_PROVIDER !== 'anthropic' || env.ANTHROPIC_API_KEY, {
    message: 'ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic',
    path: ['ANTHROPIC_API_KEY'],
  })
  .refine((env) => env.TRANSCRIPTION_PROVIDER !== 'openai' || env.OPENAI_API_KEY, {
    message: 'OPENAI_API_KEY is required when TRANSCRIPTION_PROVIDER=openai',
    path: ['OPENAI_API_KEY'],
  })

export type ApiEnv = z.infer<typeof apiEnvSchema>

/** Validates server environment variables; throws a readable error listing every problem. */
export function parseApiEnv(source: Record<string, string | undefined>): ApiEnv {
  const result = apiEnvSchema.safeParse(source)
  if (!result.success) {
    throw new Error(`Invalid API environment variables:\n${z.prettifyError(result.error)}`)
  }
  return result.data
}
