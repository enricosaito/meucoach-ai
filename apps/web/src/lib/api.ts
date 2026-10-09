import { createApiClient, type ApiClient } from '@mycoach/api-client'

export { ApiError, newIdempotencyKey, unwrap, writeHeaders } from '@mycoach/api-client'

let client: ApiClient | undefined

/** Typed API client for client components. Same-origin, so the session cookie authenticates. */
export function getApi(): ApiClient {
  client ??= createApiClient({ baseUrl: window.location.origin })
  return client
}
