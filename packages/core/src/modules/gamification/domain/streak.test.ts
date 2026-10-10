import { describe, expect, it } from 'vitest'
import { addDays, computeStreak, isStreakMilestone, localDay, nextStreakMilestone } from './streak'

describe('computeStreak', () => {
  const today = '2026-10-11'

  it('is zero with no activity', () => {
    expect(computeStreak([], today)).toEqual({
      current: 0,
      longest: 0,
      activeToday: false,
      lastActiveDay: null,
    })
  })

  it('counts consecutive days ending today', () => {
    expect(computeStreak(['2026-10-09', '2026-10-10', '2026-10-11'], today)).toMatchObject({
      current: 3,
      longest: 3,
      activeToday: true,
    })
  })

  it('keeps the streak alive when the last activity was yesterday', () => {
    expect(computeStreak(['2026-10-09', '2026-10-10'], today)).toMatchObject({
      current: 2,
      activeToday: false,
      lastActiveDay: '2026-10-10',
    })
  })

  it('resets after a missed day but remembers the longest streak', () => {
    const days = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-09']
    expect(computeStreak(days, today)).toMatchObject({ current: 0, longest: 4 })
    expect(computeStreak([...days, '2026-10-11'], today)).toMatchObject({ current: 1, longest: 4 })
  })

  it('ignores duplicates, order and invalid or future days', () => {
    const days = ['2026-10-11', '2026-10-10', '2026-10-11', 'nope', '2026-10-12']
    expect(computeStreak(days, today)).toMatchObject({ current: 2, longest: 2 })
  })

  it('handles month and year boundaries', () => {
    expect(computeStreak(['2026-09-30', '2026-10-01'], '2026-10-01').current).toBe(2)
    expect(computeStreak(['2025-12-31', '2026-01-01'], '2026-01-01').current).toBe(2)
    expect(computeStreak(['2028-02-28', '2028-02-29', '2028-03-01'], '2028-03-01').current).toBe(3)
  })
})

describe('localDay', () => {
  it('uses the user’s time zone, not UTC', () => {
    // 01:30 UTC on Oct 11 is still Oct 10 in São Paulo (UTC−3).
    const instant = new Date('2026-10-11T01:30:00Z')
    expect(localDay(instant, 'America/Sao_Paulo')).toBe('2026-10-10')
    expect(localDay(instant, 'UTC')).toBe('2026-10-11')
    expect(localDay(instant, 'Asia/Tokyo')).toBe('2026-10-11')
  })

  it('handles the exact local midnight boundary', () => {
    expect(localDay(new Date('2026-10-11T02:59:59Z'), 'America/Sao_Paulo')).toBe('2026-10-10')
    expect(localDay(new Date('2026-10-11T03:00:00Z'), 'America/Sao_Paulo')).toBe('2026-10-11')
  })

  it('respects daylight saving time', () => {
    // New York is UTC−4 in July and UTC−5 in January.
    expect(localDay(new Date('2026-07-01T03:30:00Z'), 'America/New_York')).toBe('2026-06-30')
    expect(localDay(new Date('2026-01-01T04:30:00Z'), 'America/New_York')).toBe('2025-12-31')
  })

  it('falls back to UTC for an invalid time zone', () => {
    expect(localDay(new Date('2026-10-11T01:30:00Z'), 'Nope/Nowhere')).toBe('2026-10-11')
  })
})

describe('addDays', () => {
  it('moves across months and years', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('streak milestones', () => {
  it('celebrates the early days and the habit marks', () => {
    expect([1, 2, 3, 4, 7, 14, 30, 31].map(isStreakMilestone)).toEqual([
      true,
      false,
      true,
      false,
      true,
      true,
      true,
      false,
    ])
  })

  it('points at the next milestone', () => {
    expect(nextStreakMilestone(0)).toBe(1)
    expect(nextStreakMilestone(1)).toBe(3)
    expect(nextStreakMilestone(3)).toBe(7)
    expect(nextStreakMilestone(29)).toBe(30)
    expect(nextStreakMilestone(365)).toBeNull()
  })
})
