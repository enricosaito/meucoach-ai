import { getSupabaseServerClient } from '@/lib/supabase-server'
import { NextResponse, type NextRequest } from 'next/server'

/** Magic-link landing: exchanges the PKCE code for a session cookie, then continues to the app. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  // Only allow relative redirects to avoid open-redirects.
  const destination = next?.startsWith('/') && !next.startsWith('//') ? next : '/app'

  if (code) {
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(destination, origin))
  }
  return NextResponse.redirect(new URL('/login?error=link', origin))
}
