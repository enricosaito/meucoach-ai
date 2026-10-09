import { describe, expect, it } from 'vitest'
import { estimateCostUsd } from './pricing'

describe('estimateCostUsd', () => {
  it('prices input and output tokens separately', () => {
    // 1000 * $4/M + 500 * $20/M = 0.004 + 0.01
    expect(estimateCostUsd('claude-opus-5-5', 1000, 500)).toBe(0.014)
  })

  it('costs the mock provider and unknown models at zero', () => {
    expect(estimateCostUsd('mock', 1000, 1000)).toBe(0)
    expect(estimateCostUsd('some-unknown-model', 1000, 1000)).toBe(0)
  })
})
