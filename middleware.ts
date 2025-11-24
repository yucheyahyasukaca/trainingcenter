import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Daftar routes yang tidak memerlukan authentication
const publicRoutes = ['/', '/login', '/register', '/certificate/verify', '/certificate']

// Daftar routes yang memerlukan authentication
const protectedRoutes = [
  '/dashboard',
  '/trainers',
  '/participants',
  '/programs',
  '/enrollments',
  '/statistics',
  '/admin', // Admin routes harus protected
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
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return NextResponse.next()
  }

  // IMPORTANT: Supabase uses localStorage (client-side), not cookies
  // So middleware cannot detect auth state. Let client-side handle all auth checks.
  // This prevents redirect loops and allows proper session detection.
  
  // For now, disable middleware redirects and let client-side handle auth
  // Admin layout and other protected pages will handle their own auth checks
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - api routes that handle their own auth
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|api/).*)',
  ],
}

