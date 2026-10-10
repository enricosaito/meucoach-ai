import { describe, expect, it } from 'vitest'
import { parseApiEnv } from './env'

const valid = {
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'pk',
  SUPABASE_SECRET_KEY: 'sk',
}

describe('parseApiEnv', () => {
  it('applies defaults (mock AI provider)', () => {
    const env = parseApiEnv(valid)
    expect(env.AI_PROVIDER).toBe('mock')
    expect(env.CHAT_RATE_LIMIT_PER_MINUTE).toBe(10)
  })

  it('requires an Anthropic key when the anthropic provider is selected', () => {
    expect(() => parseApiEnv({ ...valid, AI_PROVIDER: 'anthropic' })).toThrow(/ANTHROPIC_API_KEY/)
    expect(
      parseApiEnv({ ...valid, AI_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: 'k' }).AI_PROVIDER,
    ).toBe('anthropic')
  })

  it('treats empty optional values as unset', () => {
    expect(
      parseApiEnv({ ...valid, AI_MODEL_SMART: '', ANTHROPIC_API_KEY: '' }).AI_MODEL_SMART,
    ).toBeUndefined()
  })

  it('reports missing required variables', () => {
    expect(() => parseApiEnv({})).toThrow(/SUPABASE_SECRET_KEY/)
  })
})
