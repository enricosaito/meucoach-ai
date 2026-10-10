import { describe, expect, it } from 'vitest'
import { assessJobHealth } from './health'

const healthy = {
  pendingOutbox: 0,
  oldestPendingOutboxSeconds: 0,
  lastDispatchedAt: null,
  stuckWorkoutPlans: 0,
  stuckDietPlans: 0,
}

describe('assessJobHealth', () => {
  it('is ok when nothing is waiting', () => {
    expect(assessJobHealth(healthy)).toMatchObject({ status: 'ok', problems: [] })
  })

  it('tolerates a briefly pending outbox', () => {
    expect(
      assessJobHealth({ ...healthy, pendingOutbox: 2, oldestPendingOutboxSeconds: 90 }).status,
    ).toBe('ok')
  })

  it('flags an outbox that is not being dispatched', () => {
    const result = assessJobHealth({
      ...healthy,
      pendingOutbox: 3,
      oldestPendingOutboxSeconds: 900,
    })
    expect(result.status).toBe('degraded')
    expect(result.problems[0]).toContain('outbox not dispatched for 900s (3 events)')
  })

  it('flags stuck plans', () => {
    const result = assessJobHealth({ ...healthy, stuckWorkoutPlans: 1, stuckDietPlans: 2 })
    expect(result.problems).toEqual([
      '1 workout plan(s) unfinished after 15 min',
      '2 diet plan(s) unfinished after 15 min',
    ])
  })
})
