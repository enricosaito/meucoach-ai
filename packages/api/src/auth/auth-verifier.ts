import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@mycoach/db/ssr'

export interface VerifiedUser {
  userId: string
}

export interface AuthRequest {
  headers: Headers
  /** Lets the verifier write refreshed session cookies (and cache headers) to the response. */
  setResponseHeader(name: string, value: string, options?: { append?: boolean }): void
}

/**
 * Verifies the caller. The user ID ALWAYS comes from a verified JWT, never from the request body.
 * Accepts `Authorization: Bearer <access token>` (mobile, scripts) or the web session cookie.
 */
export interface AuthVerifier {
  verify(request: AuthRequest): Promise<VerifiedUser | null>
}

interface Claims {
  sub?: unknown
  role?: unknown
}

function toVerifiedUser(claims: Claims | null | undefined): VerifiedUser | null {
  if (!claims || typeof claims.sub !== 'string' || claims.role !== 'authenticated') return null
  return { userId: claims.sub }
}

export function createSupabaseAuthVerifier(options: {
  url: string
  publishableKey: string
}): AuthVerifier {
  return {
    async verify(request) {
      const authorization = request.headers.get('authorization')

      if (authorization) {
        const token = /^Bearer\s+(\S+)$/i.exec(authorization)?.[1]
        if (!token) return null
        const client = createServerClient({
          ...options,
          cookies: { getAll: () => [], setAll: () => undefined },
        })
        // getClaims verifies the JWT signature (via JWKS for asymmetric keys, otherwise the server).
        const { data, error } = await client.auth.getClaims(token)
        return error ? null : toVerifiedUser(data?.claims)
      }

      const cookieHeader = request.headers.get('cookie')
      if (!cookieHeader) return null
      const client = createServerClient({
        ...options,
        cookies: {
          getAll: () => parseCookieHeader(cookieHeader),
          setAll: (cookiesToSet, headers) => {
            for (const { name, value, options: cookieOptions } of cookiesToSet) {
              request.setResponseHeader(
                'set-cookie',
                serializeCookieHeader(name, value, cookieOptions),
                { append: true },
              )
            }
            for (const [name, value] of Object.entries(headers)) {
              request.setResponseHeader(name, value)
            }
          },
        },
      })
      const { data, error } = await client.auth.getClaims()
      return error ? null : toVerifiedUser(data?.claims)
    },
  }
}
