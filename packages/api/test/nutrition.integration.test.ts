import { dispatchOutbox, type OutboxEvent } from '@mycoach/jobs'
import { noopLogger } from '@mycoach/core/shared'
import { dietPlanSchema, planTotals, toDietPlanRecord } from '@mycoach/core/nutrition'
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

const questionnaire = {
  mealsPerDay: 5,
  dietStyle: 'vegetarian',
  budget: 'economic',
  cookingTime: 'minimal',
  allergies: 'Amendoim',
} as const

const assessment = {
  sex: 'female',
  ageYears: 30,
  heightCm: 165,
  weightKg: 68,
  activityLevel: 'moderate',
}

function call(method: string, path: string, body?: unknown, who: TestUser = user, key = newKey()) {
  return app.request(`/api/v1${path}`, {
    method,
    headers: authHeaders(who, method === 'GET' ? {} : { 'idempotency-key': key }),
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })
}

/** Runs the background pipeline exactly as the Inngest functions do, synchronously. */
async function runJobs(): Promise<OutboxEvent[]> {
  const sent: OutboxEvent[] = []
  await dispatchOutbox(
    adminClient(),
    (events) => {
      sent.push(...events)
      return Promise.resolve()
    },
    noopLogger,
  )
  for (const event of sent.filter((e) => e.name === 'nutrition/diet-plan.requested')) {
    const { userId, planId, requestId } = event.data as {
      userId: string
      planId: string
      requestId: string
    }
    await deps.nutrition.generateDietPlan(userId, planId, { requestId })
  }
  return sent
}

beforeAll(async () => {
  ;[user, other] = await Promise.all([createTestUser(), createTestUser()])
})
afterAll(async () => {
  await Promise.all([deleteTestUser(user), deleteTestUser(other)])
})

describe('POST /nutrition/diet-plans', () => {
  let planId: string

  it('requires the energy test first', async () => {
    const res = await call('POST', '/nutrition/diet-plans', { questionnaire })
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ error: { code: 'energy_test_required' } })
  })

  it('validates the questionnaire strictly', async () => {
    expect((await call('POST', '/me/assessments', assessment)).status).toBe(201)
    const bad = await call('POST', '/nutrition/diet-plans', {
      questionnaire: { ...questionnaire, mealsPerDay: 9 },
    })
    expect(bad.status).toBe(400)
    const extraKey = await call('POST', '/nutrition/diet-plans', {
      questionnaire,
      userId: other.id,
    })
    expect(extraKey.status).toBe(400)
  })

  it('saves the questionnaire and queues a plan with an outbox event in one transaction', async () => {
    const res = await call('POST', '/nutrition/diet-plans', { questionnaire })
    expect(res.status).toBe(202)
    ;({ planId } = (await res.json()) as { planId: string })

    const { data: outbox } = await adminClient()
      .from('outbox_events')
      .select('type, payload, dispatched_at')
      .eq('payload->>planId', planId)
    expect(outbox).toEqual([
      {
        type: 'nutrition/diet-plan.requested',
        payload: { planId, userId: user.id, requestId: expect.any(String) as string },
        dispatched_at: null,
      },
    ])

    const { data: profile } = await user.client
      .from('diet_profiles')
      .select('meals_per_day, diet_style, allergies')
      .single()
    expect(profile).toEqual({ meals_per_day: 5, diet_style: 'vegetarian', allergies: 'Amendoim' })
  })

  it('runs the background job and stores a valid plan that hits the targets', async () => {
    await runJobs()
    const { data } = await user.client.from('diet_plans').select('*').eq('id', planId).single()
    if (!data) throw new Error('plan not found')
    expect(data).toMatchObject({ status: 'ready', prompt_version: 'diet-plan@1', model: 'mock' })

    const record = toDietPlanRecord(data)
    const plan = dietPlanSchema.parse(record.plan)
    expect(plan.meals).toHaveLength(5)
    const targets = record.targets
    if (!targets) throw new Error('targets missing')
    const totals = planTotals(plan)
    expect(Math.abs(totals.kcal - targets.kcal)).toBeLessThan(targets.kcal * 0.12)
    expect(totals.proteinG).toBeGreaterThanOrEqual(targets.proteinG * 0.85)

    const { data: calls } = await adminClient()
      .from('ai_calls')
      .select('feature, status')
      .eq('user_id', user.id)
      .eq('feature', 'diet_plan')
    expect(calls).toEqual([{ feature: 'diet_plan', status: 'succeeded' }])
  })

  it('is idempotent: re-running the job does not call the AI again', async () => {
    await deps.nutrition.generateDietPlan(user.id, planId, {})
    const { count } = await adminClient()
      .from('ai_calls')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('feature', 'diet_plan')
    expect(count).toBe(1)
  })

  it('caps diet plan requests per day', async () => {
    // A fresh app with a generous per-minute limit, so only the daily cap can refuse.
    const relaxed = createApp(testDeps({ limits: { perMinute: 1000, chatPerMinute: 1000 } }))
    const post = () =>
      relaxed.request('/api/v1/nutrition/diet-plans', {
        method: 'POST',
        headers: authHeaders(user, { 'idempotency-key': newKey() }),
        body: JSON.stringify({ questionnaire }),
      })
    // One plan already today; two more are allowed, the fourth is not.
    expect((await post()).status).toBe(202)
    expect((await post()).status).toBe(202)
    const capped = await post()
    expect(capped.status).toBe(429)
    expect(await capped.json()).toMatchObject({
      error: { message: 'Daily diet plan limit reached. Try again tomorrow.' },
    })
    await runJobs()
  })
})

describe('RLS on diet tables', () => {
  it('users read only their own rows and cannot write', async () => {
    expect((await other.client.from('diet_plans').select('id')).data).toEqual([])
    expect((await other.client.from('diet_profiles').select('user_id')).data).toEqual([])

    const insert = await other.client
      .from('diet_plans')
      .insert({ user_id: other.id, inputs: {}, status: 'ready' })
    expect(insert.error).not.toBeNull()

    const rpc = await other.client.rpc('nutrition_request_diet_plan', {
      p_user_id: other.id,
      p_diet_profile: questionnaire,
      p_inputs: {},
      p_request_id: 'x',
    })
    expect(rpc.error).not.toBeNull()
  })
})
