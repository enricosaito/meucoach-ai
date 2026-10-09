import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { adminClient, createTestUser, deleteTestUser, type TestUser } from './helpers'

// Clients may only READ their own rows. Every direct write must fail.
let alice: TestUser
let bob: TestUser

beforeAll(async () => {
  ;[alice, bob] = await Promise.all([createTestUser(), createTestUser()])
  const admin = adminClient()
  await admin.from('chat_messages').insert({ user_id: bob.id, role: 'user', content: 'bob secret' })
  await admin.from('metabolic_assessments').insert({
    user_id: bob.id,
    formula_version: 1,
    sex: 'male',
    age_years: 40,
    height_cm: 175,
    weight_kg: 90,
    activity_level: 'light',
    bmr_kcal: 1800,
    tdee_kcal: 2475,
  })
})
afterAll(async () => {
  await Promise.all([deleteTestUser(alice), deleteTestUser(bob)])
})

describe('row level security', () => {
  it('lets a user read their own profile only', async () => {
    const { data } = await alice.client.from('profiles').select('id')
    expect(data?.map((p) => p.id)).toEqual([alice.id])
  })

  it("hides other users' chat messages and assessments", async () => {
    const chat = await alice.client.from('chat_messages').select('*').eq('user_id', bob.id)
    const tests = await alice.client.from('metabolic_assessments').select('*').eq('user_id', bob.id)
    expect(chat.data).toEqual([])
    expect(tests.data).toEqual([])
  })

  it('blocks direct inserts', async () => {
    const chat = await alice.client
      .from('chat_messages')
      .insert({ user_id: alice.id, role: 'assistant', content: 'forged reply' })
    const test = await alice.client.from('metabolic_assessments').insert({
      user_id: alice.id,
      formula_version: 1,
      sex: 'female',
      age_years: 30,
      height_cm: 160,
      weight_kg: 55,
      activity_level: 'light',
      bmr_kcal: 9999,
      tdee_kcal: 9999,
    })
    expect(chat.error).not.toBeNull()
    expect(test.error).not.toBeNull()
  })

  it('blocks direct updates and deletes', async () => {
    const update = await alice.client
      .from('profiles')
      .update({ display_name: 'hacked' })
      .eq('id', alice.id)
      .select()
    const del = await alice.client.from('profiles').delete().eq('id', alice.id).select()
    expect(update.error).not.toBeNull()
    expect(del.error).not.toBeNull()

    const { data } = await adminClient()
      .from('profiles')
      .select('display_name')
      .eq('id', alice.id)
      .single()
    expect(data?.display_name).not.toBe('hacked')
  })

  it('denies any client access to internal tables', async () => {
    const calls = await alice.client.from('ai_calls').select('*')
    const keys = await alice.client.from('idempotency_keys').select('*')
    expect(calls.error).not.toBeNull()
    expect(keys.error).not.toBeNull()
  })
})
