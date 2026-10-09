import type { App } from '@mycoach/api'
import { hc, type ClientResponse } from 'hono/client'

// Type-only dependency on the API: route and response types flow from the Hono app.
export type ApiClient = ReturnType<typeof hc<App>>

export interface ApiClientOptions {
  /** Origin of the API, e.g. `https://app.example.com`, or `''` for same-origin in a browser. */
  baseUrl: string
  /**
   * Returns an access token to send as `Authorization: Bearer` (mobile). Web clients can omit it:
   * the session cookie is sent automatically on same-origin requests.
   */
  getAccessToken?: () => Promise<string | null | undefined>
  fetch?: typeof fetch
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const baseFetch = options.fetch ?? fetch
  return hc<App>(options.baseUrl, {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      const token = await options.getAccessToken?.()
      if (token) headers.set('authorization', `Bearer ${token}`)
      return baseFetch(input, { ...init, headers, credentials: 'same-origin' })
    },
  })
}

/** A new key for one logical write. Reuse the same key when retrying that write. */
export function newIdempotencyKey(): string {
  return crypto.randomUUID()
}

/** Headers for a mutating request. */
export function writeHeaders(idempotencyKey: string = newIdempotencyKey()) {
  return { 'idempotency-key': idempotencyKey }
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly requestId?: string,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface ErrorPayload {
  error?: { code?: string; message?: string; requestId?: string; details?: unknown }
}

/** Returns the typed JSON body of a successful response, or throws an `ApiError`. */
export async function unwrap<T>(responsePromise: Promise<ClientResponse<T>>): Promise<T> {
  const res = await responsePromise
  if (res.ok) return (await res.json()) as T
  const payload = (await res.json().catch(() => ({}))) as ErrorPayload
  throw new ApiError(
    res.status,
    payload.error?.code ?? 'unknown',
    payload.error?.message ?? `Request failed with status ${res.status}`,
    payload.error?.requestId,
    payload.error?.details,
  )
}
