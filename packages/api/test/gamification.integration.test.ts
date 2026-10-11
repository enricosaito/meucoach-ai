import { localDay } from '@mycoach/core/gamification'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src'
import {
  adminClient,
  authHeaders,
  createTestUser,
  deleteTestUser,
  newKey,
  testDeps,
  type TestUser,
} from './helpers'

const deps = testDeps()
const app = createApp(deps)
let user: TestUser
let other: TestUser
let planId: string

const questionnaire = {
  experience: 'beginner',
  daysPerWeek: 3,
  sessionMinutes: 45,
  equipment: 'bodyweight',
} as const

function call(method: string, path: string, body?: unknown, who: TestUser = user, key = newKey()) {
  return app.request(`/api/v1${path}`, {
    method,
    headers: authHeaders(who, method === 'GET' ? {} : { 'idempotency-key': key }),
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })
}

interface XpBody {
  awarded: number
  leveledUp: boolean
  progress: { level: number; totalXp: number; levelXp: number; levelSpan: number }
}

beforeAll(async () => {
  ;[user, other] = await Promise.all([createTestUser(), createTestUser()])
  // A ready plan, generated synchronously the way the background job does it.
  const res = await call('POST', '/training/plans', { questionnaire })
  ;({ planId } = (await res.json()) as { planId: string })
  const job = await deps.training.getPlanJob(user.id, planId)
  if (!job) throw new Error('expected a pending plan')
  await deps.training.generatePlan(user.id, planId, null, {})
})
afterAll(async () => {
  await Promise.all([deleteTestUser(user), deleteTestUser(other)])
})

describe('XP and levels', () => {
  it('starts at level 1 with no XP', async () => {
    const res = await call('GET', '/me')
    expect(await res.json()).toMatchObject({
      level: { level: 1, totalXp: 0, levelXp: 0, levelSpan: 100 },
    })
  })

  it('grants the daily check-in XP once per day', async () => {
    const first = (await (await call('POST', '/me/check-in')).json()) as {
      level: XpBody['progress']
    }
    expect(first.level.totalXp).toBe(5)
    const again = (await (await call('POST', '/me/check-in')).json()) as {
      level: XpBody['progress']
    }
    expect(again.level.totalXp).toBe(5)
  })

  it('grants energy test XP once per month', async () => {
    const assessment = {
      sex: 'female',
      ageYears: 28,
      heightCm: 165,
      weightKg: 60,
      activityLevel: 'light',
    }
    const first = (await (await call('POST', '/me/assessments', assessment)).json()) as {
      xp: XpBody
    }
    expect(first.xp).toMatchObject({ awarded: 20, progress: { totalXp: 25 } })
    const again = (await (await call('POST', '/me/assessments', assessment)).json()) as {
      xp: XpBody
    }
    expect(again.xp).toMatchObject({ awarded: 0, progress: { totalXp: 25 } })
  })
})

describe('POST /training/workouts', () => {
  it('logs a plan day for today and grants workout XP', async () => {
    const res = await call('POST', '/training/workouts', { planId, dayIndex: 0 })
    expect(res.status).toBe(201)
    const body = (await res.json()) as {
      session: { planId: string; dayIndex: number; dayTitle: string; localDate: string }
      xp: XpBody
    }
    expect(body.session).toMatchObject({
      planId,
      dayIndex: 0,
      // The test user keeps the profile default time zone (UTC); São Paulo broke this test at night.
      localDate: localDay(new Date(), 'UTC'),
    })
    expect(body.session.dayTitle.length).toBeGreaterThan(0)
    expect(body.xp).toEqual({
      awarded: 50,
      leveledUp: false,
      progress: { level: 1, totalXp: 75, levelXp: 75, levelSpan: 100 },
    })
  })

  it('is idempotent: logging the same day again changes nothing', async () => {
    const res = await call('POST', '/training/workouts', { planId, dayIndex: 0 })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ xp: { awarded: 0, progress: { totalXp: 75 } } })
  })

  it('logs another day on the same date without granting XP twice', async () => {
    const res = await call('POST', '/training/workouts', { planId, dayIndex: 1 })
    expect(res.status).toBe(201)
    expect(await res.json()).toMatchObject({ xp: { awarded: 0 } })
    const { count } = await adminClient()
      .from('xp_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    expect(count).toBe(3) // check-in, energy test, one workout
  })

  it('rejects days the plan does not have', async () => {
    const res = await call('POST', '/training/workouts', { planId, dayIndex: 9 })
    expect(res.status).toBe(400)
  })

  it('rejects unknown keys such as userId', async () => {
    const res = await call('POST', '/training/workouts', { planId, dayIndex: 0, userId: other.id })
    expect(res.status).toBe(400)
  })

  it("does not let a user log another user's plan", async () => {
    const res = await call('POST', '/training/workouts', { planId, dayIndex: 0 }, other)
    expect(res.status).toBe(404)
  })
})

describe('RLS on workout_sessions and xp_events', () => {
  it('users read only their own rows', async () => {
    const own = await user.client.from('workout_sessions').select('day_index')
    expect(own.data).toHaveLength(2)
    const ownXp = await user.client.from('xp_events').select('reason')
    expect(ownXp.data).toHaveLength(3)

    expect((await other.client.from('workout_sessions').select('id')).data).toEqual([])
    expect((await other.client.from('xp_events').select('id')).data).toEqual([])
  })

  it('clients cannot write directly', async () => {
    const insertSession = await user.client.from('workout_sessions').insert({
      user_id: user.id,
      plan_id: planId,
      day_index: 2,
      day_title: 'x',
      local_date: '2026-01-01',
    })
    expect(insertSession.error).not.toBeNull()

    const insertXp = await user.client
      .from('xp_events')
      .insert({ user_id: user.id, reason: 'workout_logged', source: 'x', amount: 1000 })
    expect(insertXp.error).not.toBeNull()

    const total = await user.client.rpc('gamification_xp_total', { p_user_id: user.id })
    expect(total.error).not.toBeNull()
  })
})
