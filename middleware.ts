import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Daftar routes yang tidak memerlukan authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/certificate/verify',
  '/programs',
  '/about',
  '/contact',
  '/unauthorized',
  '/trainers'
]

// Daftar routes yang PASTI memerlukan authentication
const protectedRoutes = [
  '/dashboard',
  '/participants',
  '/enrollments',
  '/statistics',
  '/admin',
  '/profile',
  '/settings',
  '/my-enrollments',
  '/my-certificates',
  '/my-webinars',
  '/my-referral',
  '/trainer',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes, static files, etc
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') // Skip files with extensions
  ) {
    return NextResponse.next()
  }

  try {
    // Create Supabase client
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          },
        },
      }
    )

    // Refresh session if expired - required for Server Components
    const { data: { session } } = await supabase.auth.getSession()

    // SAFE ROLLOUT STRATEGY:
    // 1. Check if route is explicitly protected
    // Use exact match or sub-path match to avoid partial matches (e.g. /trainer matching /trainers)
    const isProtectedRoute = protectedRoutes.some(route =>
      pathname === route || pathname.startsWith(`${route}/`)
    )

    // 2. If it is protected and no session, redirect to login
    if (isProtectedRoute && !session) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // 3. Admin check for /admin routes
    if (pathname.startsWith('/admin') && session) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    // 4. For all other routes (public or unknown), allow access
    return response

  } catch (e) {
    // IF MIDDLEWARE FAILS (e.g. Cookie too large, Supabase down), 
    // PREVENT 502 BY REDIRECTING TO LOGIN OR RETURNING PLAIN RESPONSE
    console.error('Middleware Error:', e)

    // If we are already on login/register/public, just let it pass to avoid infinite redirect loop
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }

    // Otherwise redirect to login to force clean state
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|api/).*)',
  ],
}

