import { describe, expect, it } from 'vitest'
import { createInMemoryRateLimiter } from './rate-limiter'

describe('createInMemoryRateLimiter', () => {
  it('allows up to the limit within a window, then blocks', async () => {
    const limiter = createInMemoryRateLimiter({ now: () => 1_000 })
    const results = []
    for (let i = 0; i < 4; i++) results.push(await limiter.consume('k', 3, 60_000))
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false])
    expect(results.map((r) => r.remaining)).toEqual([2, 1, 0, 0])
  })

  it('resets after the window elapses', async () => {
    let time = 0
    const limiter = createInMemoryRateLimiter({ now: () => time })
    await limiter.consume('k', 1, 1_000)
    expect((await limiter.consume('k', 1, 1_000)).allowed).toBe(false)
    time = 1_000
    expect((await limiter.consume('k', 1, 1_000)).allowed).toBe(true)
  })

  it('tracks keys independently', async () => {
    const limiter = createInMemoryRateLimiter({ now: () => 0 })
    await limiter.consume('a', 1, 1_000)
    expect((await limiter.consume('b', 1, 1_000)).allowed).toBe(true)
  })
})
