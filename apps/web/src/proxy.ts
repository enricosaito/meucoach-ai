import { createServerClient } from '@mycoach/db/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { publicEnv } from './lib/public-env'

const PUBLIC_PATHS = ['/login', '/auth']

/**
 * Refreshes the Supabase session cookie on every page request and redirects signed-out users
 * to /login. The API (/api/*) is excluded: it authenticates each request itself.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient({
    url: publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
        for (const [name, value] of Object.entries(headers)) response.headers.set(name, value)
      },
    },
  })

  // Do not remove: getClaims() validates and refreshes the session.
  const { data } = await supabase.auth.getClaims()
  const signedIn = Boolean(data?.claims.sub)
  const { pathname } = request.nextUrl

  if (!signedIn && !PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    return NextResponse.redirect(url)
  }
  if (signedIn && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/app'
    return NextResponse.redirect(url)
  }
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
