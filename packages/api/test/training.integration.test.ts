import { dispatchOutbox, type OutboxEvent } from '@mycoach/jobs'
import { noopLogger } from '@mycoach/core/shared'
import { toBodyScan, toWorkoutPlanRecord, workoutPlanSchema } from '@mycoach/core/training'
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

// Smallest valid JPEG (1×1 px). The mock AI never decodes it; real providers would.
const TINY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  'base64',
)

function must<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('expected a value')
  return value
}

const questionnaire = {
  experience: 'intermediate',
  daysPerWeek: 4,
  sessionMinutes: 60,
  equipment: 'full_gym',
  limitations: 'Mild knee pain on deep squats',
} as const

const deps = testDeps()
const app = createApp(deps)
let user: TestUser
let other: TestUser

beforeAll(async () => {
  ;[user, other] = await Promise.all([createTestUser(), createTestUser()])
})
afterAll(async () => {
  await Promise.all([deleteTestUser(user), deleteTestUser(other)])
})

function call(method: string, path: string, body?: unknown, who: TestUser = user) {
  return app.request(`/api/v1${path}`, {
    method,
    headers: authHeaders(who, method === 'GET' ? {} : { 'idempotency-key': newKey() }),
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
  for (const event of sent.filter((e) => e.name === 'training/plan.requested')) {
    const { userId, planId, requestId } = event.data as {
      userId: string
      planId: string
      requestId: string
    }
    const job = await deps.training.getPlanJob(userId, planId)
    if (!job) continue
    const analysis = job.bodyScanId
      ? await deps.training.analyzeBodyScan(userId, job.bodyScanId, job.inputs, { requestId })
      : null
    await deps.training.generatePlan(userId, planId, analysis, { requestId })
  }
  return sent
}

async function uploadScan(views: ('front' | 'side' | 'back')[]) {
  const res = await call('POST', '/training/photos/upload-urls', {
    views,
    contentType: 'image/jpeg',
  })
  expect(res.status).toBe(201)
  const body = (await res.json()) as {
    scanId: string
    uploads: { view: string; path: string; token: string }[]
  }
  for (const upload of body.uploads) {
    // Clients upload straight to storage with the signed token (no service key involved).
    const { error } = await user.client.storage
      .from('body-photos')
      .uploadToSignedUrl(upload.path, upload.token, TINY_JPEG, { contentType: 'image/jpeg' })
    expect(error).toBeNull()
  }
  return body
}

describe('body photo consent', () => {
  it('blocks photo uploads until the user consents', async () => {
    const res = await call('POST', '/training/photos/upload-urls', {
      views: ['front'],
      contentType: 'image/jpeg',
    })
    expect(res.status).toBe(403)
  })

  it('rejects an outdated consent version', async () => {
    expect((await call('PUT', '/me/consents/body_photos', { version: 0 })).status).toBe(400)
    expect((await call('PUT', '/me/consents/body_photos', { version: 99 })).status).toBe(409)
  })

  it('records consent (idempotently) and the user can read it', async () => {
    expect((await call('PUT', '/me/consents/body_photos', { version: 1 })).status).toBe(200)
    expect((await call('PUT', '/me/consents/body_photos', { version: 1 })).status).toBe(200)
    const { data } = await user.client.from('consents').select('kind, version, revoked_at')
    expect(data).toEqual([{ kind: 'body_photos', version: 1, revoked_at: null }])
  })
})

describe('plan generation with photos', () => {
  let planId: string
  let scanId: string

  it('uploads photos via signed URLs and queues a plan in one transaction', async () => {
    const scan = await uploadScan(['front', 'back'])
    scanId = scan.scanId
    const res = await call('POST', '/training/plans', {
      questionnaire,
      bodyScan: { scanId, views: ['front', 'back'], contentType: 'image/jpeg' },
    })
    expect(res.status).toBe(202)
    ;({ planId } = (await res.json()) as { planId: string })

    const { data: outbox } = await adminClient()
      .from('outbox_events')
      .select('type, payload, dispatched_at')
      .eq('payload->>planId', planId)
    expect(outbox).toEqual([
      expect.objectContaining({ type: 'training/plan.requested', dispatched_at: null }),
    ])
    const { data: plan } = await user.client
      .from('workout_plans')
      .select('status')
      .eq('id', planId)
      .single()
    expect(plan?.status).toBe('pending')
  })

  it('runs the background job: dispatch, analyse photos, generate a valid plan', async () => {
    const sent = await runJobs()
    expect(sent.map((e) => e.id)).toHaveLength(new Set(sent.map((e) => e.id)).size)

    const { data: planRow } = await user.client
      .from('workout_plans')
      .select('*')
      .eq('id', planId)
      .single()
    const plan = toWorkoutPlanRecord(must(planRow))
    expect(plan.status).toBe('ready')
    expect(workoutPlanSchema.parse(plan.plan)).toBeTruthy()
    expect(plan.plan?.days).toHaveLength(4)
    expect(planRow?.prompt_version).toBe('workout-plan@1')

    const { data: scanRow } = await user.client
      .from('body_scans')
      .select('*')
      .eq('id', scanId)
      .single()
    const scan = toBodyScan(must(scanRow))
    expect(scan.status).toBe('completed')
    expect(scan.photos.map((p) => p.view)).toEqual(['front', 'back'])
    expect(scan.analysis?.priorityAreas.length).toBeGreaterThan(0)

    // Both AI calls were logged with their feature.
    const { data: calls } = await adminClient()
      .from('ai_calls')
      .select('feature')
      .eq('user_id', user.id)
    expect(calls?.map((c) => c.feature).sort()).toEqual(['body_analysis', 'workout_plan'])
  })

  it('is idempotent: re-running the job does not call the AI again', async () => {
    const job = await deps.training.getPlanJob(user.id, planId)
    expect(job).toBeNull()
    await deps.training.generatePlan(user.id, planId, null)
    const { count } = await adminClient()
      .from('ai_calls')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    expect(count).toBe(2)
  })

  it('lets users view only their own photos', async () => {
    const path = `${user.id}/${scanId}/front.jpg`
    const own = await user.client.storage.from('body-photos').createSignedUrl(path, 60)
    expect(own.error).toBeNull()
    const foreign = await other.client.storage.from('body-photos').createSignedUrl(path, 60)
    expect(foreign.error).not.toBeNull()
    const { data } = await other.client.from('body_scans').select('id')
    expect(data).toEqual([])
  })

  it('never lets clients write plans or scans directly', async () => {
    const { error } = await user.client
      .from('workout_plans')
      .update({ status: 'ready' })
      .eq('id', planId)
      .select()
    expect(error).not.toBeNull()
  })

  it('deletes a scan and its photos; the plan keeps working', async () => {
    expect((await call('DELETE', `/training/body-scans/${scanId}`)).status).toBe(200)
    const { data: files } = await adminClient()
      .storage.from('body-photos')
      .list(`${user.id}/${scanId}`)
    expect(files).toEqual([])
    const { data: plan } = await user.client
      .from('workout_plans')
      .select('status, body_scan_id')
      .eq('id', planId)
      .single()
    expect(plan).toEqual({ status: 'ready', body_scan_id: null })
  })
})

describe('plan generation without photos', () => {
  it('works with the questionnaire only', async () => {
    const res = await call('POST', '/training/plans', {
      questionnaire: { ...questionnaire, daysPerWeek: 3, equipment: 'bodyweight' },
    })
    expect(res.status).toBe(202)
    const { planId } = (await res.json()) as { planId: string }
    await runJobs()
    const { data } = await user.client.from('workout_plans').select('*').eq('id', planId).single()
    expect(toWorkoutPlanRecord(must(data)).plan?.days).toHaveLength(3)
    const { data: tp } = await user.client
      .from('training_profiles')
      .select('days_per_week, equipment')
      .single()
    expect(tp).toEqual({ days_per_week: 3, equipment: 'bodyweight' })
  })

  it('rejects a scan whose photos were never uploaded', async () => {
    const res = await call('POST', '/training/plans', {
      questionnaire,
      bodyScan: { scanId: crypto.randomUUID(), views: ['front'], contentType: 'image/jpeg' },
    })
    expect(res.status).toBe(400)
  })

  it('validates the questionnaire', async () => {
    const res = await call('POST', '/training/plans', {
      questionnaire: { ...questionnaire, daysPerWeek: 9, sessionMinutes: 50 },
    })
    expect(res.status).toBe(400)
  })

  it('caps plan requests per day', async () => {
    // Two plans already today; the third is allowed, the fourth is not.
    expect((await call('POST', '/training/plans', { questionnaire })).status).toBe(202)
    expect((await call('POST', '/training/plans', { questionnaire })).status).toBe(429)
    await runJobs()
  })
})

describe('revoking photo consent', () => {
  it('deletes every scan and photo', async () => {
    await uploadScan(['side'])
    const res = await call('DELETE', '/me/consents/body_photos')
    expect(await res.json()).toMatchObject({ granted: false })
    const { data: scans } = await adminClient()
      .from('body_scans')
      .select('id')
      .eq('user_id', user.id)
    expect(scans).toEqual([])
    const { data: consents } = await user.client.from('consents').select('revoked_at')
    expect(consents?.[0]?.revoked_at).not.toBeNull()
    expect(
      (
        await call('POST', '/training/photos/upload-urls', {
          views: ['front'],
          contentType: 'image/jpeg',
        })
      ).status,
    ).toBe(403)
  })
})
