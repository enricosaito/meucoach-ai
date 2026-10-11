import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  adminClient,
  authHeaders,
  createTestUser,
  deleteTestUser,
  newKey,
  testApp,
  type TestUser,
} from './helpers'

const app = testApp()
let user: TestUser

beforeAll(async () => {
  user = await createTestUser()
})
afterAll(async () => {
  await deleteTestUser(user)
})

const assessment = {
  sex: 'male',
  ageYears: 30,
  heightCm: 180,
  weightKg: 80,
  activityLevel: 'moderate',
}

describe('platform', () => {
  it('GET /health is public and returns a request id', async () => {
    const res = await app.request('/api/v1/health')
    expect(res.status).toBe(200)
    expect(res.headers.get('x-request-id')).toBeTruthy()
  })

  it('GET /health/jobs is public and reports the pipeline from the database', async () => {
    const res = await app.request('/api/v1/health/jobs')
    const body = (await res.json()) as { status: string; problems: string[] }
    expect(res.status).toBe(body.status === 'ok' ? 200 : 503)
    expect(body).toMatchObject({
      pendingOutbox: expect.any(Number) as number,
      oldestPendingOutboxSeconds: expect.any(Number) as number,
      stuckWorkoutPlans: expect.any(Number) as number,
      stuckDietPlans: expect.any(Number) as number,
    })
  })

  it('GET /health/jobs returns 503 when jobs are stuck', async () => {
    const stuck = testApp({
      jobHealth: () =>
        Promise.resolve({
          status: 'degraded',
          problems: ['outbox not dispatched'],
          pendingOutbox: 3,
          oldestPendingOutboxSeconds: 900,
          lastDispatchedAt: null,
          stuckWorkoutPlans: 0,
          stuckDietPlans: 0,
        }),
    })
    const res = await stuck.request('/api/v1/health/jobs')
    expect(res.status).toBe(503)
    expect(await res.json()).toMatchObject({ status: 'degraded' })
  })

  it('the job health function is not callable by clients', async () => {
    const { error } = await user.client.rpc('ops_job_health', {})
    expect(error).not.toBeNull()
  })

  it('sends no CORS headers unless origins are configured', async () => {
    const res = await app.request('/api/v1/health', {
      headers: { origin: 'http://localhost:8081' },
    })
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('answers CORS preflights for configured origins only', async () => {
    const withCors = testApp({ corsOrigins: ['http://localhost:8081'] })
    const preflight = (origin: string) =>
      withCors.request('/api/v1/me', {
        method: 'OPTIONS',
        headers: {
          origin,
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'authorization,idempotency-key',
        },
      })
    const allowed = await preflight('http://localhost:8081')
    expect(allowed.status).toBe(204)
    expect(allowed.headers.get('access-control-allow-origin')).toBe('http://localhost:8081')
    expect(allowed.headers.get('access-control-allow-credentials')).toBeNull()
    const other = await preflight('https://evil.example')
    expect(other.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('propagates a caller-supplied request id', async () => {
    const res = await app.request('/api/v1/health', { headers: { 'x-request-id': 'trace-123' } })
    expect(res.headers.get('x-request-id')).toBe('trace-123')
  })

  it('rejects unauthenticated requests with the standard error shape', async () => {
    const res = await app.request('/api/v1/me', { headers: { 'x-request-id': 'req-401' } })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({
      error: { code: 'unauthorized', message: 'Sign in required', requestId: 'req-401' },
    })
  })

  it('rejects a forged bearer token', async () => {
    const res = await app.request('/api/v1/me', {
      headers: { authorization: `Bearer ${user.accessToken.slice(0, -4)}abcd` },
    })
    expect(res.status).toBe(401)
  })

  it('rate limits per user', async () => {
    const limited = testApp({ limits: { perMinute: 2, chatPerMinute: 1 } })
    const statuses = []
    for (let i = 0; i < 3; i++) {
      statuses.push((await limited.request('/api/v1/me', { headers: authHeaders(user) })).status)
    }
    expect(statuses).toEqual([200, 200, 429])
  })
})

describe('GET /me', () => {
  it('returns the profile created by the signup trigger', async () => {
    const res = await app.request('/api/v1/me', { headers: authHeaders(user) })
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      profile: { id: string; units: string; locale: string }
      targets: unknown
    }
    expect(body.profile.id).toBe(user.id)
    expect(body.profile.units).toBe('metric')
    expect(body.profile.locale).toBe('pt-BR') // default for the Brazilian market
    expect(body.targets).toBeNull() // no energy test yet
  })
})

describe('PATCH /me/profile', () => {
  it('updates the profile', async () => {
    const res = await app.request('/api/v1/me/profile', {
      method: 'PATCH',
      headers: authHeaders(user, { 'idempotency-key': newKey() }),
      body: JSON.stringify({ displayName: 'Test User', timezone: 'America/Sao_Paulo' }),
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { profile: { displayName: string; timezone: string } }
    expect(body.profile).toMatchObject({ displayName: 'Test User', timezone: 'America/Sao_Paulo' })
  })

  it('switches the language and rejects unsupported locales', async () => {
    const patch = (locale: string) =>
      app.request('/api/v1/me/profile', {
        method: 'PATCH',
        headers: authHeaders(user, { 'idempotency-key': newKey() }),
        body: JSON.stringify({ locale }),
      })
    const ok = await patch('en')
    expect(await ok.json()).toMatchObject({ profile: { locale: 'en' } })
    expect((await patch('fr')).status).toBe(400)
    await patch('pt-BR')
  })
})

describe('POST /me/assessments (Mifflin-St Jeor test)', () => {
  const post = (body: unknown, key: string | null = newKey()) =>
    app.request('/api/v1/me/assessments', {
      method: 'POST',
      headers: authHeaders(user, key ? { 'idempotency-key': key } : {}),
      body: JSON.stringify(body),
    })

  it('requires an Idempotency-Key header', async () => {
    const res = await post(assessment, null)
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: { code: 'idempotency_key_required' } })
  })

  it('computes and stores BMR and TDEE for the authenticated user', async () => {
    const res = await post(assessment)
    expect(res.status).toBe(201)
    const { assessment: saved } = (await res.json()) as {
      assessment: { id: string; bmrKcal: number; tdeeKcal: number; formulaVersion: number }
    }
    expect(saved).toMatchObject({ bmrKcal: 1780, tdeeKcal: 2759, formulaVersion: 1 })

    const { data } = await adminClient()
      .from('metabolic_assessments')
      .select('user_id')
      .eq('id', saved.id)
      .single()
    expect(data?.user_id).toBe(user.id)

    const me = await app.request('/api/v1/me', { headers: authHeaders(user) })
    expect(await me.json()).toMatchObject({
      latestAssessment: { id: saved.id },
      // No goal set → maintenance targets.
      targets: { kcal: 2760, proteinG: 144, fatG: 77, carbsG: 373, formulaVersion: 1 },
    })
  })

  it('replays the original response when retried with the same key', async () => {
    const key = newKey()
    const first = await post(assessment, key)
    const second = await post(assessment, key)
    expect(second.status).toBe(201)
    expect(second.headers.get('idempotent-replayed')).toBe('true')
    expect(await second.json()).toEqual(await first.json())

    const { count } = await adminClient()
      .from('metabolic_assessments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    expect(count).toBe(2) // one from the previous test + one here, not three
  })

  it('rejects reusing a key with a different body', async () => {
    const key = newKey()
    await post(assessment, key)
    const res = await post({ ...assessment, weightKg: 81 }, key)
    expect(res.status).toBe(422)
  })

  it('validates input and never accepts a user id from the body', async () => {
    const res = await post({ ...assessment, userId: crypto.randomUUID(), ageYears: 5 })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: { code: string; details: { path: string }[] } }
    expect(body.error.code).toBe('validation_failed')
    expect(body.error.details.map((d) => d.path)).toEqual(expect.arrayContaining(['ageYears']))
  })
})

describe('POST /chat/messages', () => {
  it('answers with the AI coach, stores the exchange and logs the AI call', async () => {
    const res = await app.request('/api/v1/chat/messages', {
      method: 'POST',
      headers: authHeaders(user, { 'idempotency-key': newKey(), 'x-request-id': 'chat-req-1' }),
      body: JSON.stringify({ content: 'How many calories should I eat?' }),
    })
    expect(res.status).toBe(201)
    const body = (await res.json()) as {
      question: { role: string; content: string }
      reply: { id: string; role: string; content: string }
    }
    expect(body.question).toMatchObject({
      role: 'user',
      content: 'How many calories should I eat?',
    })
    expect(body.reply.role).toBe('assistant')
    // The mock provider sees the targets and the user's language (pt-BR) through the prompt.
    expect(body.reply.content).toContain('Suas metas diárias são cerca de **2760 kcal** e **144 g')

    const { data: calls } = await adminClient()
      .from('ai_calls')
      .select('*')
      .eq('user_id', user.id)
      .eq('request_id', 'chat-req-1')
    expect(calls).toHaveLength(1)
    expect(calls?.[0]).toMatchObject({
      feature: 'coach_chat',
      provider: 'mock',
      prompt_version: 'coach-chat@4',
      status: 'succeeded',
    })

    // The client can read its own history directly (RLS), oldest first.
    const { data: history } = await user.client
      .from('chat_messages')
      .select('role, content')
      .order('created_at')
    expect(history?.map((m) => m.role)).toEqual(['user', 'assistant'])
  })
})

describe('POST /chat/check-in', () => {
  const checkIn = (key = newKey()) =>
    app.request('/api/v1/chat/check-in', {
      method: 'POST',
      headers: authHeaders(user, { 'idempotency-key': key, 'x-request-id': `check-in-${key}` }),
    })

  it('writes today’s check-in once, into the chat thread, with quick replies', async () => {
    const first = await checkIn()
    expect(first.status).toBe(200)
    const body = (await first.json()) as {
      message: { id: string; role: string; content: string }
      quickReplies: string[]
    }
    expect(body.message.role).toBe('assistant')
    // No plan yet: the coach (mock = the template) offers to build one, in pt-BR, by first name.
    expect(body.message.content).toContain('Oi, Test!')
    expect(body.message.content).toContain('plano de treino')
    expect(body.quickReplies).toHaveLength(3)

    // Same local day: the same message comes back, and no second AI call is made.
    const again = (await (await checkIn()).json()) as { message: { id: string } }
    expect(again.message.id).toBe(body.message.id)
    const { data: calls } = await adminClient()
      .from('ai_calls')
      .select('feature, prompt_version, status')
      .eq('user_id', user.id)
      .eq('feature', 'coach_check_in')
    expect(calls).toEqual([
      { feature: 'coach_check_in', prompt_version: 'coach-checkin@1', status: 'succeeded' },
    ])

    // It is part of the conversation the user reads (RLS) and replies to.
    const { data: history } = await user.client
      .from('chat_messages')
      .select('role, kind')
      .order('created_at')
    expect(history?.at(-1)).toEqual({ role: 'assistant', kind: 'check_in' })
  })
})

describe('POST /chat/messages with a photo', () => {
  // A tiny valid JPEG; the mock coach only notes that a photo arrived.
  const TINY_JPEG =
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='

  const send = (body: unknown) =>
    app.request('/api/v1/chat/messages', {
      method: 'POST',
      headers: authHeaders(user, { 'idempotency-key': newKey() }),
      body: JSON.stringify(body),
    })

  it('answers a photo-only message and stores only that a photo was sent', async () => {
    const res = await send({ image: { mediaType: 'image/jpeg', base64: TINY_JPEG } })
    expect(res.status).toBe(201)
    const body = (await res.json()) as {
      question: { id: string; content: string; hasImage: boolean }
      reply: { content: string }
    }
    expect(body.question).toMatchObject({ content: '', hasImage: true })
    expect(body.reply.content).toContain('[foto]')

    // The image itself is not kept anywhere in the row.
    const { data: row } = await adminClient()
      .from('chat_messages')
      .select('*')
      .eq('id', body.question.id)
      .single()
    expect(JSON.stringify(row)).not.toContain(TINY_JPEG.slice(0, 40))
  })

  it('rejects a message with neither text nor photo', async () => {
    const res = await send({ content: '   ' })
    expect(res.status).toBe(400)
  })
})
