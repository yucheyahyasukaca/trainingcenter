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
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if it's a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Get auth token from cookies
  const authToken = request.cookies.get('sb-access-token')?.value ||
                    request.cookies.get('sb-refresh-token')?.value

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !authToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect /dashboard to /dashboard (same route, but ensure it uses the layout)
  if (pathname === '/dashboard') {
    return NextResponse.next()
  }

  // Redirect to home if accessing public route with auth
  if (isPublicRoute && authToken && pathname !== '/register') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Temporarily disable middleware for testing
    // '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

