import { createApiClient } from '@mycoach/api-client'
import { env } from './env'
import { supabase } from './supabase'

export { ApiError, newIdempotencyKey, unwrap, writeHeaders } from '@mycoach/api-client'

/** Typed API client. Sends the Supabase access token as `Authorization: Bearer`. */
export const api = createApiClient({
  baseUrl: env.apiUrl,
  getAccessToken: async () => (await supabase.auth.getSession()).data.session?.access_token,
}).api.v1
