import { describe, expect, it } from 'vitest'
import { DEFAULT_MODELS } from './registry'
import { supportsServerFallback } from './model-features'

describe('supportsServerFallback', () => {
  it('is on for the default chat and plan models', () => {
    expect(supportsServerFallback(DEFAULT_MODELS.fast)).toBe(true)
    expect(supportsServerFallback(DEFAULT_MODELS.smart)).toBe(true)
  })

  it('is off for Haiku (no server-side fallback) and unknown models', () => {
    expect(supportsServerFallback('claude-haiku-5-5')).toBe(false)
    expect(supportsServerFallback('some-future-model')).toBe(false)
  })
})
