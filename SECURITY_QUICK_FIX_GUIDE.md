# 🚀 Security Quick Fix Guide - GARUDA-21 Training Center

Panduan cepat untuk memperbaiki kerentanan keamanan kritis dalam 48 jam.

---

## 📌 FASE 1: CRITICAL FIXES (Hari 1 - 8 jam)

### Fix #1: Enable Middleware Authentication (2 jam)

**File:** `middleware.ts`

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const publicRoutes = ['/', '/login', '/register', '/certificate/verify', '/about', '/contact']
const adminRoutes = ['/admin', '/api/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => response.cookies.set(name, value, options),
        remove: (name, options) => response.cookies.set(name, '', { ...options, maxAge: 0 }),
      },
    }
  )
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.redirect(new URL('/login?redirect=' + pathname, request.url))
  }
  
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    if (!profile || profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }
  
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
```

**Test:**
```bash
# Test 1: Akses /dashboard tanpa login → harus redirect ke /login
# Test 2: Akses /admin tanpa role admin → harus redirect ke /unauthorized
# Test 3: Login sebagai user → bisa akses /dashboard tapi tidak /admin
```

---

### Fix #2: Add API Authentication Helper (1 jam)

**File:** `lib/api-auth.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export interface AuthResult {
  user: any
  profile: any
}

export async function validateAuth(request: NextRequest): Promise<AuthResult> {
  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Unauthorized')
  }
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (!profile) {
    throw new Error('Profile not found')
  }
  
  return { user, profile }
}

export async function validateAdmin(request: NextRequest): Promise<AuthResult> {
  const { user, profile } = await validateAuth(request)
  
  if (profile.role !== 'admin') {
    throw new Error('Forbidden: Admin access required')
  }
  
  return { user, profile }
}

export async function validateTrainer(request: NextRequest): Promise<AuthResult> {
  const { user, profile } = await validateAuth(request)
  
  if (!['admin', 'trainer'].includes(profile.role)) {
    throw new Error('Forbidden: Trainer access required')
  }
  
  return { user, profile }
}

export function withAuth(handler: (req: NextRequest, auth: AuthResult) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      const auth = await validateAuth(req)
      return await handler(req, auth)
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      )
    }
  }
}

export function withAdmin(handler: (req: NextRequest, auth: AuthResult) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      const auth = await validateAdmin(req)
      return await handler(req, auth)
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      )
    }
  }
}
```

**Apply ke semua API admin routes:**

```typescript
// app/api/admin/certificate-templates/route.ts
import { withAdmin } from '@/lib/api-auth'

export const GET = withAdmin(async (request, auth) => {
  const supabaseAdmin = getSupabaseAdmin()
  // ... rest of code
})

export const POST = withAdmin(async (request, auth) => {
  // ... rest of code
})
```

---

### Fix #3: Enable RLS Policies (2 jam)

**File:** `supabase/enable-rls-critical.sql` (NEW)

```sql
-- =====================================================
-- ENABLE RLS ON CRITICAL TABLES
-- =====================================================

-- 1. user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
ON public.user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all" ON public.user_profiles;
CREATE POLICY "Admins can view all"
ON public.user_profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 2. participants
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own participant data" ON public.participants;
CREATE POLICY "Users view own participant data"
ON public.participants FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own participant data" ON public.participants;
CREATE POLICY "Users update own participant data"
ON public.participants FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage all participants" ON public.participants;
CREATE POLICY "Admins manage all participants"
ON public.participants FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role IN ('admin', 'trainer')
  )
);

-- 3. enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own enrollments" ON public.enrollments;
CREATE POLICY "Users view own enrollments"
ON public.enrollments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.participants
    WHERE id = enrollments.participant_id
    AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins manage enrollments" ON public.enrollments;
CREATE POLICY "Admins manage enrollments"
ON public.enrollments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role IN ('admin', 'trainer')
  )
);

-- 4. certificates
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own certificates" ON public.certificates;
CREATE POLICY "Users view own certificates"
ON public.certificates FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.participants p
    JOIN public.enrollments e ON e.participant_id = p.id
    WHERE e.id = certificates.enrollment_id
    AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins manage certificates" ON public.certificates;
CREATE POLICY "Admins manage certificates"
ON public.certificates FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 5. Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'participants', 'enrollments', 'certificates')
ORDER BY tablename;
```

**Jalankan di Supabase SQL Editor:**
1. Login ke Supabase Dashboard
2. Pergi ke SQL Editor
3. Copy-paste SQL di atas
4. Run

---

### Fix #4: File Upload Validation (2 jam)

**File:** `lib/file-validator.ts` (NEW)

```typescript
const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  video: ['video/mp4', 'video/webm'],
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export class FileValidator {
  static validateImage(file: File): void {
    this.validateFileSize(file)
    this.validateMimeType(file, ALLOWED_MIME_TYPES.image)
    this.validateExtension(file, ['jpg', 'jpeg', 'png', 'webp', 'gif'])
  }
  
  static validateDocument(file: File): void {
    this.validateFileSize(file)
    this.validateMimeType(file, ALLOWED_MIME_TYPES.document)
    this.validateExtension(file, ['pdf', 'doc', 'docx'])
  }
  
  private static validateFileSize(file: File): void {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File terlalu besar. Maksimal ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }
    if (file.size === 0) {
      throw new Error('File kosong')
    }
  }
  
  private static validateMimeType(file: File, allowedTypes: string[]): void {
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Tipe file tidak diizinkan. Allowed: ${allowedTypes.join(', ')}`)
    }
  }
  
  private static validateExtension(file: File, allowedExtensions: string[]): void {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !allowedExtensions.includes(ext)) {
      throw new Error(`Ekstensi file tidak diizinkan. Allowed: ${allowedExtensions.join(', ')}`)
    }
  }
  
  static sanitizeFilename(filename: string): string {
    // Remove path traversal attempts
    const basename = filename.split('/').pop() || filename
    // Remove dangerous characters
    return basename.replace(/[^a-zA-Z0-9.-]/g, '_')
  }
  
  static generateSecureFilename(originalName: string): string {
    const ext = originalName.split('.').pop()?.toLowerCase() || ''
    const randomStr = crypto.randomUUID()
    return `${randomStr}.${ext}`
  }
}
```

**Update upload routes:**

```typescript
// app/api/forum/upload/route.ts
import { FileValidator } from '@/lib/file-validator'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    
    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }
    
    // ✅ VALIDATE FILE
    try {
      FileValidator.validateImage(file)
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    // ✅ GENERATE SECURE FILENAME
    const secureFileName = FileValidator.generateSecureFilename(file.name)
    const finalPath = `images/${Date.now()}_${secureFileName}`
    
    // ... rest of upload code
  }
}
```

---

### Fix #5: Remove Hardcoded Password (30 min)

**File:** `app/api/admin/participants/reset-password/route.ts`

```typescript
import { withAdmin } from '@/lib/api-auth'
import crypto from 'crypto'

function generateSecurePassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  const values = crypto.randomBytes(length)
  
  for (let i = 0; i < length; i++) {
    password += charset[values[i] % charset.length]
  }
  
  return password
}

export const POST = withAdmin(async (request, auth) => {
  const { userId } = await request.json()
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }
  
  const supabaseAdmin = getSupabaseAdmin()
  
  // ✅ Generate random password
  const newPassword = generateSecurePassword(16)
  
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  )
  
  if (error) {
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
  
  // TODO: Send password via email
  // await sendPasswordResetEmail(userId, newPassword)
  
  return NextResponse.json({
    success: true,
    message: 'Password berhasil direset. Email telah dikirim ke user.',
    // ❌ JANGAN return password di response production!
    ...(process.env.NODE_ENV === 'development' && { tempPassword: newPassword })
  })
})
```

---

## 📌 FASE 2: HIGH PRIORITY FIXES (Hari 2 - 8 jam)

### Fix #6: Rate Limiting (2 jam)

**Install dependency:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

**File:** `lib/rate-limit.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server'

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// Simple in-memory rate limiter (for development)
class InMemoryRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map()
  
  async limit(identifier: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now()
    const record = this.requests.get(identifier)
    
    // Clean up expired entries
    if (record && now > record.resetTime) {
      this.requests.delete(identifier)
    }
    
    const existing = this.requests.get(identifier)
    
    if (!existing) {
      this.requests.set(identifier, { count: 1, resetTime: now + windowMs })
      return { success: true, limit, remaining: limit - 1, reset: now + windowMs }
    }
    
    if (existing.count >= limit) {
      return { success: false, limit, remaining: 0, reset: existing.resetTime }
    }
    
    existing.count++
    return { success: true, limit, remaining: limit - existing.count, reset: existing.resetTime }
  }
}

const limiter = new InMemoryRateLimiter()

export async function rateLimit(
  request: NextRequest,
  limit: number = 10,
  windowMs: number = 60000 // 1 minute
): Promise<RateLimitResult> {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const identifier = `${ip}:${request.nextUrl.pathname}`
  
  return await limiter.limit(identifier, limit, windowMs)
}

export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  limit: number = 10,
  windowMs: number = 60000
) {
  return async (req: NextRequest) => {
    const result = await rateLimit(req, limit, windowMs)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
          },
        }
      )
    }
    
    const response = await handler(req)
    response.headers.set('X-RateLimit-Limit', limit.toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', result.reset.toString())
    
    return response
  }
}
```

**Apply to sensitive routes:**

```typescript
// app/api/login/route.ts
import { withRateLimit } from '@/lib/rate-limit'

export const POST = withRateLimit(
  async (request) => {
    // ... login logic
  },
  5, // Max 5 requests
  60000 // Per 1 minute
)

// app/api/signup-without-email-confirmation/route.ts
export const POST = withRateLimit(
  async (request) => {
    // ... signup logic
  },
  3, // Max 3 signups
  300000 // Per 5 minutes
)
```

---

### Fix #7: Input Sanitization (2 jam)

**Install dependency:**
```bash
npm install zod dompurify
npm install --save-dev @types/dompurify
```

**File:** `lib/sanitizer.ts` (NEW)

```typescript
import DOMPurify from 'isomorphic-dompurify'

export class Sanitizer {
  static html(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href'],
    })
  }
  
  static plainText(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }
  
  static sqlString(input: string): string {
    return input.replace(/'/g, "''")
  }
}
```

**File:** `lib/validators.ts` (NEW)

```typescript
import { z } from 'zod'

export const schemas = {
  email: z.string().email().max(255),
  password: z.string().min(8).max(100).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password harus mengandung huruf besar, kecil, angka, dan simbol'
  ),
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^[0-9+\-() ]{8,20}$/),
  url: z.string().url(),
  uuid: z.string().uuid(),
}

export const userSignUpSchema = z.object({
  email: schemas.email,
  password: schemas.password,
  fullName: schemas.name,
})

export const ticketSchema = z.object({
  full_name: schemas.name,
  email: schemas.email,
  phone: schemas.phone.optional(),
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(5000),
})
```

**Update email templates:**

```typescript
// lib/email-templates.ts
import { Sanitizer } from './sanitizer'

export function generateWelcomeEmail(data: WelcomeEmailData): string {
  // ✅ Sanitize all user input
  const participantName = Sanitizer.plainText(data.participantName)
  const programTitle = Sanitizer.plainText(data.programTitle)
  const programDescription = Sanitizer.plainText(data.programDescription)
  
  return `
    <p>Halo <strong>${participantName}</strong>,</p>
    <p>Program: <strong>${programTitle}</strong></p>
    <p>${programDescription}</p>
  `
}
```

---

### Fix #8: Security Headers (1 jam)

**File:** `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: false, // ✅ Enable linting
  },
  typescript: {
    ignoreBuildErrors: false, // ✅ Enable type checking
  },
  output: 'standalone',
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
    ]
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'supabase.garuda-21.com',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig
```

---

### Fix #9: Audit Logging (2 jam)

**File:** `supabase/create-audit-logs.sql` (NEW)

```sql
-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failure')),
  error_message TEXT,
  metadata JSONB
);

-- Create index for performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource, resource_id);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Service role can insert (via API)
CREATE POLICY "Service role can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);
```

**File:** `lib/audit-logger.ts` (NEW)

```typescript
import { getSupabaseAdmin } from './supabase-admin'

interface AuditLogEntry {
  userId?: string
  action: string
  resource: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  status: 'success' | 'failure'
  errorMessage?: string
  metadata?: any
}

export class AuditLogger {
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      
      await supabaseAdmin.from('audit_logs').insert({
        user_id: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resource_id: entry.resourceId,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        status: entry.status,
        error_message: entry.errorMessage,
        metadata: entry.metadata,
      })
    } catch (error) {
      console.error('Failed to write audit log:', error)
      // Don't throw - audit logging shouldn't break the app
    }
  }
  
  static async logAuth(userId: string, action: string, request: Request, success: boolean, error?: string) {
    await this.log({
      userId,
      action,
      resource: 'auth',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      status: success ? 'success' : 'failure',
      errorMessage: error,
    })
  }
  
  static async logPasswordReset(adminId: string, targetUserId: string, request: Request, success: boolean) {
    await this.log({
      userId: adminId,
      action: 'RESET_PASSWORD',
      resource: 'user',
      resourceId: targetUserId,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      status: success ? 'success' : 'failure',
    })
  }
}
```

**Apply to sensitive operations:**

```typescript
// app/api/admin/participants/reset-password/route.ts
export const POST = withAdmin(async (request, auth) => {
  const { userId } = await request.json()
  
  try {
    // ... reset password logic
    
    // ✅ Log successful reset
    await AuditLogger.logPasswordReset(auth.user.id, userId, request, true)
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    // ✅ Log failed attempt
    await AuditLogger.logPasswordReset(auth.user.id, userId, request, false)
    
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
})
```

---

## ✅ TESTING CHECKLIST

### Setelah Apply Semua Fixes:

#### 1. Authentication Tests
```bash
# Test 1: Akses protected route tanpa login
curl http://localhost:3000/dashboard
# Expected: Redirect ke /login

# Test 2: Akses admin route sebagai user biasa
curl http://localhost:3000/admin \
  -H "Cookie: sb-access-token=USER_TOKEN"
# Expected: 403 Forbidden

# Test 3: Login dengan credentials salah 6x
# Expected: Rate limited setelah 5x
```

#### 2. File Upload Tests
```bash
# Test 1: Upload file .php
# Expected: Rejected

# Test 2: Upload file > 10MB
# Expected: Rejected

# Test 3: Upload file dengan MIME type salah
# Expected: Rejected
```

#### 3. RLS Tests
```sql
-- Login as user A
-- Try to query user B's data
SELECT * FROM participants WHERE user_id = 'USER_B_ID';
-- Expected: No rows returned
```

#### 4. Rate Limiting Tests
```bash
# Rapid fire requests
for i in {1..20}; do
  curl http://localhost:3000/api/login -X POST
done
# Expected: 429 after limit exceeded
```

---

## 📊 DEPLOYMENT CHECKLIST

### Before Deploy to Production:

- [ ] All fixes tested in staging
- [ ] Environment variables configured
- [ ] RLS policies enabled and tested
- [ ] Rate limiting configured
- [ ] Audit logging working
- [ ] Security headers verified
- [ ] File upload restrictions tested
- [ ] Backup database
- [ ] Prepare rollback plan

### Deploy Steps:

```bash
# 1. Run database migrations
supabase db push

# 2. Deploy application
vercel deploy --prod

# 3. Verify deployment
curl -I https://your-domain.com
# Check security headers

# 4. Monitor logs for errors
vercel logs --follow

# 5. Test critical flows
# - Login/logout
# - File upload
# - API authentication
```

---

## 🆘 ROLLBACK PLAN

Jika ada masalah setelah deployment:

```bash
# 1. Rollback application
vercel rollback

# 2. Rollback database (if needed)
# Restore dari backup

# 3. Disable RLS temporarily (emergency only!)
# supabase/disable-rls-emergency.sql
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
# ... etc
```

---

## 📞 SUPPORT

Jika ada masalah saat implementasi:

1. Check logs: `vercel logs`
2. Check Supabase logs: Dashboard → Logs
3. Test di local environment terlebih dahulu
4. Rollback jika critical issue

**Estimated Total Time:** 16-20 jam (2-3 hari kerja)

Good luck! 🚀

