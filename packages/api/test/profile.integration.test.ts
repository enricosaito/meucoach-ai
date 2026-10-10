import { localDay, addDays } from '@mycoach/core/gamification'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  adminClient,
  authHeaders,
  createTestUser,
  deleteTestUser,
  env,
  newKey,
  testApp,
  type TestUser,
} from './helpers'

// Smallest valid JPEG (1×1 px).
const TINY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  'base64',
)

const app = testApp()
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

interface ProfileBody {
  profile: { username: string; displayName: string | null; avatarPath: string | null }
}

describe('username and display name', () => {
  it('gives new users a valid username and no display name', async () => {
    const res = await call('GET', '/me')
    const { profile } = (await res.json()) as ProfileBody
    expect(profile.username).toMatch(/^[a-z0-9_.]{3,20}$/)
    expect(profile.displayName).toBeNull()
  })

  it('updates the username (normalised) and the display name separately', async () => {
    const username = `ana_${Date.now().toString().slice(-8)}`
    const res = await call('PATCH', '/me/profile', {
      username: username.toUpperCase(),
      displayName: 'Ana Paula',
    })
    expect(res.status).toBe(200)
    const { profile } = (await res.json()) as ProfileBody
    expect(profile).toMatchObject({ username, displayName: 'Ana Paula' })
  })

  it('rejects a username someone else has', async () => {
    const { profile } = (await (await call('GET', '/me')).json()) as ProfileBody
    const res = await call('PATCH', '/me/profile', { username: profile.username }, other)
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ error: { code: 'username_taken' } })
  })

  it('rejects invalid usernames', async () => {
    expect((await call('PATCH', '/me/profile', { username: 'a b' })).status).toBe(400)
  })
})

describe('avatar', () => {
  async function upload(who: TestUser = user) {
    const res = await call('POST', '/me/avatar/upload-url', undefined, who)
    expect(res.status).toBe(201)
    const { path, token } = (await res.json()) as { path: string; token: string }
    const { error } = await who.client.storage
      .from('avatars')
      .uploadToSignedUrl(path, token, TINY_JPEG, { contentType: 'image/jpeg' })
    expect(error).toBeNull()
    return path
  }

  it('uploads via a signed URL, sets it on the profile and serves it publicly', async () => {
    const path = await upload()
    const res = await call('PUT', '/me/avatar', { path })
    const { profile } = (await res.json()) as ProfileBody
    expect(profile.avatarPath).toBe(path)
    const publicUrl = `${env().NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`
    expect((await fetch(publicUrl)).status).toBe(200)
  })

  it('deletes the previous file when the avatar changes', async () => {
    const second = await upload()
    await call('PUT', '/me/avatar', { path: second })
    const { data } = await adminClient().storage.from('avatars').list(user.id)
    expect(data?.map((f) => `${user.id}/${f.name}`)).toEqual([second])
  })

  it('refuses another user’s file and files that were never uploaded', async () => {
    const foreign = await upload(other)
    expect((await call('PUT', '/me/avatar', { path: foreign })).status).toBe(403)
    const missing = `${user.id}/${crypto.randomUUID()}.jpg`
    expect((await call('PUT', '/me/avatar', { path: missing })).status).toBe(400)
  })

  it('removes the avatar and its files', async () => {
    const res = await call('DELETE', '/me/avatar')
    expect(((await res.json()) as ProfileBody).profile.avatarPath).toBeNull()
    const { data } = await adminClient().storage.from('avatars').list(user.id)
    expect(data).toEqual([])
  })
})

describe('login streak', () => {
  it('starts at zero', async () => {
    const res = await call('GET', '/me', undefined, other)
    expect(await res.json()).toMatchObject({ streak: { current: 0, longest: 0 } })
  })

  it('check-in logs today once, no matter how often the app opens', async () => {
    const first = await call('POST', '/me/check-in', undefined, other)
    const second = await call('POST', '/me/check-in', undefined, other)
    expect(await first.json()).toMatchObject({ streak: { current: 1, activeToday: true } })
    expect(await second.json()).toMatchObject({ streak: { current: 1 } })
    const { count } = await adminClient()
      .from('activity_days')
      .select('day', { count: 'exact', head: true })
      .eq('user_id', other.id)
    expect(count).toBe(1)
  })

  it('counts consecutive days in the user’s time zone', async () => {
    const { profile } = (await (await call('GET', '/me', undefined, other)).json()) as {
      profile: { timezone: string }
    }
    const today = localDay(new Date(), profile.timezone)
    await adminClient()
      .from('activity_days')
      .insert([
        { user_id: other.id, day: addDays(today, -1) },
        { user_id: other.id, day: addDays(today, -2) },
        { user_id: other.id, day: addDays(today, -5) },
      ])
    const res = await call('GET', '/me', undefined, other)
    expect(await res.json()).toMatchObject({ streak: { current: 3, longest: 3 } })
  })

  it('lets users read only their own activity log', async () => {
    const { data } = await user.client.from('activity_days').select('day').eq('user_id', other.id)
    expect(data).toEqual([])
  })
})
