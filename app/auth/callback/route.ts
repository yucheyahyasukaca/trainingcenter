import { createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('❌ OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
    )
  }

  if (!code) {
    console.error('❌ No OAuth code provided')
    return NextResponse.redirect(
      new URL('/login?error=no_code', requestUrl.origin)
    )
  }

  try {
    const supabase = createServerClient()

    // Exchange code for session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('❌ Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
      )
    }

    if (!data.session) {
      console.error('❌ No session returned')
      return NextResponse.redirect(
        new URL('/login?error=no_session', requestUrl.origin)
      )
    }

    console.log('✅ OAuth callback successful for user:', data.user?.email)

    // Redirect to client-side callback page to handle redirects
    // The client-side page can access sessionStorage to get referral codes, etc.
    return NextResponse.redirect(new URL('/auth/callback/success', requestUrl.origin))
  } catch (err: any) {
    console.error('❌ Exception in OAuth callback:', err)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(err.message || 'unknown_error')}`, requestUrl.origin)
    )
  }
}
