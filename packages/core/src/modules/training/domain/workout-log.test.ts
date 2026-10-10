import { describe, expect, it } from 'vitest'
import { todayWorkout, type WorkoutSession } from './workout-log'

const PLAN = 'plan-1'

function session(
  dayIndex: number,
  localDate: string,
  overrides: Partial<WorkoutSession> = {},
): WorkoutSession {
  return {
    id: `${PLAN}-${dayIndex}-${localDate}`,
    planId: PLAN,
    dayIndex,
    dayTitle: `Day ${dayIndex + 1}`,
    localDate,
    createdAt: `${localDate}T12:00:00Z`,
    ...overrides,
  }
}

describe('todayWorkout', () => {
  it('starts at the first day', () => {
    expect(todayWorkout(PLAN, 4, [], '2026-10-10')).toEqual({
      dayIndex: 0,
      doneToday: false,
      thisWeek: 0,
    })
  })

  it('moves to the next day after the latest session', () => {
    const sessions = [session(0, '2026-10-07'), session(1, '2026-10-08')]
    expect(todayWorkout(PLAN, 4, sessions, '2026-10-10')).toMatchObject({
      dayIndex: 2,
      doneToday: false,
    })
  })

  it('wraps around to the first day', () => {
    expect(todayWorkout(PLAN, 3, [session(2, '2026-10-09')], '2026-10-10').dayIndex).toBe(0)
  })

  it('shows the day done today as done', () => {
    const sessions = [session(0, '2026-10-09'), session(1, '2026-10-10')]
    expect(todayWorkout(PLAN, 4, sessions, '2026-10-10')).toMatchObject({
      dayIndex: 1,
      doneToday: true,
    })
  })

  it('uses the latest session when several happen on one day', () => {
    const sessions = [
      session(0, '2026-10-10', { createdAt: '2026-10-10T08:00:00Z' }),
      session(1, '2026-10-10', { createdAt: '2026-10-10T18:00:00Z' }),
    ]
    expect(todayWorkout(PLAN, 4, sessions, '2026-10-10').dayIndex).toBe(1)
  })

  it('ignores sessions of other plans for the rotation, but counts them this week', () => {
    const sessions = [session(2, '2026-10-09', { planId: 'old-plan' })]
    expect(todayWorkout(PLAN, 4, sessions, '2026-10-10')).toEqual({
      dayIndex: 0,
      doneToday: false,
      thisWeek: 1,
    })
  })

  it('counts the last 7 local days only', () => {
    const sessions = [
      session(0, '2026-10-03'), // 7 days ago: outside
      session(1, '2026-10-04'), // 6 days ago: inside
      session(2, '2026-10-10'),
    ]
    expect(todayWorkout(PLAN, 4, sessions, '2026-10-10').thisWeek).toBe(2)
  })

  it('ignores days that no longer exist in the plan', () => {
    expect(todayWorkout(PLAN, 3, [session(5, '2026-10-09')], '2026-10-10').dayIndex).toBe(0)
  })
})
