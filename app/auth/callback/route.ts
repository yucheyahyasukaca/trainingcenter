import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * OAuth callback route - redirects to client-side handler
 * This is necessary because PKCE code verifier is stored in localStorage
 * which is only accessible from client-side code
 */
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

  // Always redirect to client-side handler for PKCE
  // Client-side handler has access to localStorage where code verifier is stored
  console.log('🔄 Redirecting to client-side callback handler for PKCE')
  return NextResponse.redirect(
    new URL(`/auth/callback/client?code=${code}`, requestUrl.origin)
  )
}
