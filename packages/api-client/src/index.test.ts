import { describe, expect, it } from 'vitest'
import { ApiError, createApiClient, unwrap, writeHeaders } from './index'

function recordingFetch(response: Response) {
  const calls: { url: string; headers: Headers }[] = []
  const fetchFn = (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: input instanceof Request ? input.url : input.toString(),
      headers: new Headers(init?.headers),
    })
    return Promise.resolve(response)
  }
  return { calls, fetch: fetchFn }
}

describe('createApiClient', () => {
  it('builds typed URLs and attaches a bearer token when provided', async () => {
    const { calls, fetch } = recordingFetch(Response.json({ status: 'ok', time: 'now' }))
    const client = createApiClient({
      baseUrl: 'http://localhost:3000',
      getAccessToken: () => Promise.resolve('token-123'),
      fetch,
    })
    const body = await unwrap(client.api.v1.health.$get())
    expect(body.status).toBe('ok')
    expect(calls[0]?.url).toBe('http://localhost:3000/api/v1/health')
    expect(calls[0]?.headers.get('authorization')).toBe('Bearer token-123')
  })

  it('throws ApiError with the API error code', async () => {
    const { fetch } = recordingFetch(
      Response.json(
        { error: { code: 'unauthorized', message: 'Sign in required', requestId: 'r1' } },
        { status: 401 },
      ),
    )
    const client = createApiClient({ baseUrl: 'http://x', fetch })
    const promise = unwrap(client.api.v1.me.$get())
    await expect(promise).rejects.toBeInstanceOf(ApiError)
    await expect(promise).rejects.toMatchObject({
      status: 401,
      code: 'unauthorized',
      requestId: 'r1',
    })
  })

  it('creates idempotency headers', () => {
    expect(writeHeaders('fixed-key-1')).toEqual({ 'idempotency-key': 'fixed-key-1' })
    expect(writeHeaders()['idempotency-key']).toMatch(/^[0-9a-f-]{36}$/)
  })
})
