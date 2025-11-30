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
  const errorCode = requestUrl.searchParams.get('error_code')

  console.log('📥 Auth Callback received:', {
    url: request.url,
    code: code ? 'Present' : 'Missing',
    error,
    errorDescription,
    errorCode
  })

  // Handle OAuth errors
  if (error) {
    console.error('❌ OAuth error in callback:', error, errorDescription)

    // Force HTTP for localhost to avoid SSL errors
    let origin = requestUrl.origin
    if (requestUrl.hostname === 'localhost') {
      console.log('⚠️ Detected localhost, forcing HTTP origin to http://localhost:3000')
      origin = 'http://localhost:3000' // Hardcode to ensure no SSL
    }

    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, origin)
    )
  }

  if (!code) {
    console.error('❌ No OAuth code provided in callback')

    // Force HTTP for localhost to avoid SSL errors
    let origin = requestUrl.origin
    if (requestUrl.hostname === 'localhost') {
      origin = 'http://localhost:3000'
    }

    return NextResponse.redirect(
      new URL('/login?error=no_code', origin)
    )
  }

  // Always redirect to client-side handler for PKCE
  // Client-side handler has access to localStorage where code verifier is stored
  console.log('🔄 Redirecting to client-side callback handler for PKCE exchange')

  // Force HTTP for localhost to avoid SSL errors
  let origin = requestUrl.origin
  if (requestUrl.hostname === 'localhost') {
    console.log('⚠️ Detected localhost, forcing HTTP for success redirect')
    origin = 'http://localhost:3000'
  }

  return NextResponse.redirect(
    new URL(`/auth/callback/client?code=${code}`, origin)
  )
}
