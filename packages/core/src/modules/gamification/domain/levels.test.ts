import { describe, expect, it } from 'vitest'
import { levelProgress, xpForLevel, xpSource } from './levels'

describe('xpForLevel', () => {
  it('follows 50·n·(n−1)', () => {
    expect([1, 2, 3, 4, 5].map(xpForLevel)).toEqual([0, 100, 300, 600, 1000])
  })

  it('treats anything below 1 as level 1', () => {
    expect(xpForLevel(0)).toBe(0)
    expect(xpForLevel(-3)).toBe(0)
  })
})

describe('levelProgress', () => {
  it('starts at level 1 with no XP', () => {
    expect(levelProgress(0)).toEqual({ level: 1, totalXp: 0, levelXp: 0, levelSpan: 100 })
  })

  it('levels up exactly at the threshold', () => {
    expect(levelProgress(99).level).toBe(1)
    expect(levelProgress(100)).toEqual({ level: 2, totalXp: 100, levelXp: 0, levelSpan: 200 })
    expect(levelProgress(299).level).toBe(2)
    expect(levelProgress(300).level).toBe(3)
  })

  it('reports progress inside a level', () => {
    expect(levelProgress(450)).toEqual({ level: 3, totalXp: 450, levelXp: 150, levelSpan: 300 })
  })

  it('is consistent with xpForLevel for large totals', () => {
    for (let level = 1; level <= 200; level++) {
      expect(levelProgress(xpForLevel(level)).level).toBe(level)
      expect(levelProgress(xpForLevel(level) - 1).level).toBe(Math.max(1, level - 1))
    }
  })

  it('clamps negative and fractional totals', () => {
    expect(levelProgress(-10).totalXp).toBe(0)
    expect(levelProgress(150.9).totalXp).toBe(150)
  })
})

describe('xpSource', () => {
  it('caps daily rewards per day and the energy test per month', () => {
    expect(xpSource('workout_logged', '2026-10-10')).toBe('2026-10-10')
    expect(xpSource('daily_check_in', '2026-10-10')).toBe('2026-10-10')
    expect(xpSource('energy_test', '2026-10-10')).toBe('2026-10')
  })
})
