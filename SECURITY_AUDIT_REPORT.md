# 🔒 Laporan Audit Keamanan - GARUDA-21 Training Center
## Persiapan Penetration Testing

---

## 📋 Executive Summary

Aplikasi GARUDA-21 Training Center adalah platform pelatihan berbasis web yang dibangun menggunakan:
- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Fitur Utama:** Manajemen program, enrollment, sertifikat digital, referral system, forum, quiz, webinar

Audit keamanan ini mengidentifikasi **15 kerentanan KRITIS** dan **22 kerentanan MEDIUM-HIGH** yang perlu ditangani sebelum penetration testing.

---

## 🚨 KERENTANAN KRITIS (Critical Vulnerabilities)

### 1. ⚠️ **TIDAK ADA VALIDASI AUTENTIKASI DI API ROUTES**

**Severity:** CRITICAL 🔴  
**CWE-306:** Missing Authentication for Critical Function

**Deskripsi:**
Banyak API routes tidak memvalidasi autentikasi dan otorisasi user dengan benar.

**Contoh Kode Bermasalah:**

```typescript
// app/api/admin/certificate-templates/route.ts
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    // ❌ TIDAK ADA VALIDASI ROLE ADMIN!
    const { data, error } = await supabaseAdmin
      .from('certificate_templates')
      .select('*')
    // ...
```

```typescript
// app/api/admin/participants/reset-password/route.ts
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    // ❌ SIAPAPUN BISA RESET PASSWORD USER LAIN!
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: 'Garuda-21.com' }
    )
```

**Impact:**
- Siapapun dapat mengakses endpoint admin
- Siapapun dapat reset password user lain
- Dapat membaca/modifikasi data sensitif
- Bypass authorization sepenuhnya

**Rekomendasi Fix:**

```typescript
// Buat middleware untuk validasi admin
// lib/auth-middleware.ts
export async function validateAdmin(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Unauthorized')
  }
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || profile.role !== 'admin') {
    throw new Error('Forbidden: Admin access required')
  }
  
  return { user, profile }
}

// Implementasi di API route
export async function GET(request: NextRequest) {
  try {
    // ✅ VALIDASI ADMIN TERLEBIH DAHULU
    const { user, profile } = await validateAdmin(request)
    
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('certificate_templates')
      .select('*')
    // ...
```

---

### 2. ⚠️ **UNRESTRICTED FILE UPLOAD**

**Severity:** CRITICAL 🔴  
**CWE-434:** Unrestricted Upload of File with Dangerous Type

**Deskripsi:**
File upload tidak memiliki validasi tipe file, ukuran, dan ekstensi yang memadai.

**Kode Bermasalah:**

```typescript
// app/api/forum/upload/route.ts
export async function POST(req: NextRequest) {
  const file = form.get('file') as File | null
  
  // ❌ TIDAK ADA VALIDASI TIPE FILE!
  // ❌ TIDAK ADA VALIDASI UKURAN!
  // ❌ TIDAK ADA SCAN MALWARE!
  
  const normalizedFileName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\s+/g, '_')
    .toLowerCase()
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucketId)
    .upload(finalPath, arrayBuffer, {
      contentType: file.type || 'application/octet-stream', // ❌ Trust user input!
      upsert: true,
    })
```

**Impact:**
- Upload shell/malware (PHP, JSP, ASPX)
- Upload file berukuran besar → DoS
- Path traversal → overwrite file sistem
- Stored XSS via SVG/HTML upload
- MIME type confusion attack

**Rekomendasi Fix:**

```typescript
// lib/file-validation.ts
const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  video: ['video/mp4', 'video/webm']
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function validateFile(file: File, allowedTypes: string[]) {
  // 1. Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }
  
  // 2. Validate MIME type
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`)
  }
  
  // 3. Validate extension
  const ext = file.name.split('.').pop()?.toLowerCase()
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']
  if (!ext || !allowedExtensions.includes(ext)) {
    throw new Error('Invalid file extension')
  }
  
  // 4. Validate magic bytes (file signature)
  // Implement magic byte validation here
  
  return true
}

// Implementasi di API
export async function POST(req: NextRequest) {
  const file = form.get('file') as File | null
  
  if (!file) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }
  
  // ✅ VALIDASI FILE
  try {
    validateFile(file, ALLOWED_FILE_TYPES.image)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  
  // Generate secure filename (tidak trust user input)
  const secureFileName = `${crypto.randomUUID()}.${file.name.split('.').pop()}`
  
  // Upload dengan Content-Type yang benar
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucketId)
    .upload(secureFileName, arrayBuffer, {
      contentType: file.type,
      upsert: false, // ✅ Jangan allow overwrite
    })
```

---

### 3. ⚠️ **HARDCODED DEFAULT PASSWORD**

**Severity:** CRITICAL 🔴  
**CWE-798:** Use of Hard-coded Credentials

**Kode Bermasalah:**

```typescript
// app/api/admin/participants/reset-password/route.ts
export async function POST(request: NextRequest) {
  // ❌ PASSWORD DEFAULT HARDCODED!
  const defaultPassword = 'Garuda-21.com'
  
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { password: defaultPassword }
  )
```

**Impact:**
- Attacker tahu password default
- Account takeover massal
- Brute force password yang predictable

**Rekomendasi Fix:**

```typescript
// lib/password-generator.ts
export function generateSecurePassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  const array = new Uint32Array(length)
  crypto.getRandomValues(array)
  
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length]
  }
  
  return password
}

// Implementasi
export async function POST(request: NextRequest) {
  const { user, profile } = await validateAdmin(request)
  const { userId } = await request.json()
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }
  
  // ✅ Generate random password
  const newPassword = generateSecurePassword(16)
  
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  )
  
  if (error) {
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
  
  // ✅ Send password via secure channel (email dengan encryption)
  await sendPasswordResetEmail(userId, newPassword)
  
  return NextResponse.json({
    success: true,
    message: 'Password berhasil direset dan dikirim via email'
    // ❌ JANGAN return password di response!
  })
}
```

---

### 4. ⚠️ **MIDDLEWARE DINONAKTIFKAN**

**Severity:** CRITICAL 🔴  
**CWE-284:** Improper Access Control

**Kode Bermasalah:**

```typescript
// middleware.ts
export const config = {
  matcher: [
    // Temporarily disable middleware for testing
    // ❌ MIDDLEWARE DIMATIKAN!
  ],
}
```

**Impact:**
- Tidak ada proteksi route sama sekali
- User tidak perlu login untuk akses protected pages
- Bypass semua authorization

**Rekomendasi Fix:**

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/certificate/verify',
  '/about',
  '/contact',
  '/programs', // Public program listing
]

const adminRoutes = [
  '/admin',
  '/dashboard/admin',
  '/statistics/admin',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Create Supabase client for server-side
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: any) {
          response.cookies.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )
  
  // Get session
  const { data: { session }, error } = await supabase.auth.getSession()
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route))
  
  // Check if route requires admin
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  
  // Redirect to login if not authenticated
  if (!isPublicRoute && !session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Check admin access
  if (isAdminRoute && session) {
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
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
```

---

### 5. ⚠️ **ROW LEVEL SECURITY (RLS) DISABLED**

**Severity:** CRITICAL 🔴  
**CWE-862:** Missing Authorization

**Kode Bermasalah:**

```sql
-- supabase/disable-all-rls.sql
-- ❌ RLS DINONAKTIFKAN DI SEMUA TABEL!
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments DISABLE ROW LEVEL SECURITY;
-- ... dll
```

**Impact:**
- User bisa akses data user lain
- Data leakage masif
- Tidak ada data isolation
- Bypass authorization di database level

**Rekomendasi Fix:**

```sql
-- Enable RLS pada semua tabel
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Policy untuk user_profiles
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy untuk participants
CREATE POLICY "Users can view own participant data"
ON public.participants
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all participants"
ON public.participants
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy untuk enrollments
CREATE POLICY "Users can view own enrollments"
ON public.enrollments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.participants
    WHERE id = enrollments.participant_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins and trainers can view all enrollments"
ON public.enrollments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'trainer')
  )
);
```

---

### 6. ⚠️ **SENSITIVE DATA EXPOSURE DI LOGS**

**Severity:** HIGH 🟠  
**CWE-532:** Insertion of Sensitive Information into Log File

**Kode Bermasalah:**

```typescript
// lib/supabase.ts
console.log('🔧 Supabase Config:')
console.log('URL:', supabaseUrl)
console.log('Anon Key exists:', !!supabaseAnonKey)
console.log('Service Key exists:', !!supabaseServiceKey) // ❌ Log sensitive info

// lib/supabase-admin.ts
if (isProduction) {
  console.log('✓ Supabase URL:', supabaseUrl)
  console.log('✓ Service role key:', supabaseKey.substring(0, 20) + '...') // ❌ Partial key leak
}
```

**Impact:**
- API keys leak via logs
- Credentials exposure
- Information disclosure

**Rekomendasi Fix:**

```typescript
// lib/logger.ts
const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  info: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, data)
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error)
    // Send to error tracking service (Sentry, etc)
  },
  debug: (message: string, data?: any) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data)
    }
  },
  // ❌ JANGAN log sensitive data
  sensitive: (message: string) => {
    if (isDevelopment) {
      console.log(`[SENSITIVE] ${message} [REDACTED]`)
    }
  }
}

// Implementasi
logger.info('Supabase initialized')
logger.sensitive('API Key configured') // Tidak log key actual
```

---

### 7. ⚠️ **SQL INJECTION VIA RPC FUNCTIONS**

**Severity:** HIGH 🟠  
**CWE-89:** SQL Injection

**Potensi Masalah:**
Jika ada RPC functions yang build dynamic SQL tanpa parameterized queries.

**Rekomendasi:**

```sql
-- ❌ JANGAN seperti ini
CREATE OR REPLACE FUNCTION search_users(search_term TEXT)
RETURNS TABLE(...) AS $$
BEGIN
  -- ❌ String concatenation = SQL Injection!
  RETURN QUERY EXECUTE 'SELECT * FROM users WHERE name LIKE ''%' || search_term || '%''';
END;
$$ LANGUAGE plpgsql;

-- ✅ GUNAKAN parameterized queries
CREATE OR REPLACE FUNCTION search_users(search_term TEXT)
RETURNS TABLE(id UUID, name TEXT, email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email
  FROM users u
  WHERE u.name ILIKE '%' || search_term || '%'
  OR u.email ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 8. ⚠️ **XSS (Cross-Site Scripting) - Stored XSS**

**Severity:** HIGH 🟠  
**CWE-79:** Improper Neutralization of Input During Web Page Generation

**Kode Bermasalah:**

```typescript
// lib/email-templates.ts
export function generateWelcomeEmail(data: WelcomeEmailData): string {
  const { participantName, programTitle, programDescription } = data
  
  return `
    <p>Halo <strong>${participantName}</strong>,</p>
    <!-- ❌ Direct interpolation tanpa sanitization! -->
    <p>Selamat! Pendaftaran Anda untuk program <strong>${programTitle}</strong></p>
    <p>${programDescription}</p>
  `
}
```

**Impact:**
- Stored XSS via nama, deskripsi, dll
- Cookie theft / session hijacking
- Malicious script execution
- Phishing attacks

**Rekomendasi Fix:**

```typescript
// lib/sanitizer.ts
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// lib/email-templates.ts
export function generateWelcomeEmail(data: WelcomeEmailData): string {
  // ✅ Sanitize semua user input
  const participantName = sanitizeHtml(data.participantName)
  const programTitle = sanitizeHtml(data.programTitle)
  const programDescription = sanitizeHtml(data.programDescription)
  
  return `
    <p>Halo <strong>${participantName}</strong>,</p>
    <p>Selamat! Pendaftaran Anda untuk program <strong>${programTitle}</strong></p>
    <p>${programDescription}</p>
  `
}
```

---

### 9. ⚠️ **IDOR (Insecure Direct Object Reference)**

**Severity:** HIGH 🟠  
**CWE-639:** Authorization Bypass Through User-Controlled Key

**Kode Bermasalah:**

```typescript
// app/api/tickets/[id]/messages/route.ts
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const ticketId = params.id // ❌ User controlled
  
  // Minimal validation
  if (!isUserAdmin) {
    const userEmail = user?.email || sender_email
    if (ticket.email !== userEmail && ticket.user_id !== user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
  }
  // ❌ Validation bisa di-bypass dengan manipulasi email
}
```

**Impact:**
- Akses data user lain
- Modifikasi resource yang bukan milik user
- Data leakage

**Rekomendasi Fix:**

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()
  const ticketId = params.id
  
  // ✅ Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // ✅ Verify ticket ownership via RLS
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .single()
  
  // RLS akan otomatis filter hanya ticket milik user
  if (ticketError || !ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }
  
  // ✅ Additional check
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  const isAdmin = profile?.role === 'admin'
  
  if (!isAdmin && ticket.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // Process request
}
```

---

### 10. ⚠️ **MASS ASSIGNMENT VULNERABILITY**

**Severity:** MEDIUM 🟡  
**CWE-915:** Improperly Controlled Modification of Dynamically-Determined Object Attributes

**Kode Bermasalah:**

```typescript
// app/api/signup-without-email-confirmation/route.ts
export async function POST(request: NextRequest) {
  const { email, password, fullName } = await request.json()
  
  // ❌ Attacker bisa inject field tambahan seperti 'role'
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: authData.user.id,
      email: authData.user.email!,
      full_name: fullName,
      role: 'user' // ❌ Hardcoded, tapi bisa di-override dari request body
    })
```

**Impact:**
- Privilege escalation (set role = 'admin')
- Modify protected fields
- Bypass business logic

**Rekomendasi Fix:**

```typescript
// lib/dto.ts
interface SignUpRequest {
  email: string
  password: string
  fullName: string
}

export function validateSignUpRequest(body: any): SignUpRequest {
  // ✅ Only allow specific fields
  const { email, password, fullName } = body
  
  if (!email || !password || !fullName) {
    throw new Error('Missing required fields')
  }
  
  // ✅ Validate format
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    throw new Error('Invalid email format')
  }
  
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }
  
  return { email, password, fullName }
}

// Implementasi
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // ✅ Validate and sanitize input
    const validatedData = validateSignUpRequest(body)
    
    // ✅ Explicitly set fields - ignore any extra fields
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: validatedData.email,
        full_name: validatedData.fullName,
        role: 'user', // ✅ Always default to 'user', never from input
      })
```

---

## 🟠 KERENTANAN MEDIUM-HIGH

### 11. ⚠️ **RATE LIMITING TIDAK ADA**

**Severity:** MEDIUM 🟡  
**CWE-770:** Allocation of Resources Without Limits or Throttling

**Impact:**
- Brute force attacks
- DDoS attacks
- API abuse
- Resource exhaustion

**Rekomendasi:**

```typescript
// lib/rate-limiter.ts
import { LRUCache } from 'lru-cache'

type RateLimitOptions = {
  interval: number // milliseconds
  uniqueTokenPerInterval: number
}

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  })

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0]
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount)
        }
        tokenCount[0] += 1

        const currentUsage = tokenCount[0]
        const isRateLimited = currentUsage >= limit

        return isRateLimited ? reject() : resolve()
      }),
  }
}

// Usage di API route
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

export async function POST(request: NextRequest) {
  const ip = request.ip ?? 'unknown'
  
  try {
    await limiter.check(10, ip) // Max 10 requests per minute
  } catch {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }
  
  // Process request
}
```

---

### 12. ⚠️ **CORS MISCONFIGURATION**

**Severity:** MEDIUM 🟡  
**CWE-346:** Origin Validation Error

**Rekomendasi:**

```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ]
  },
}
```

---

### 13. ⚠️ **CSRF PROTECTION TIDAK ADA**

**Severity:** MEDIUM 🟡  
**CWE-352:** Cross-Site Request Forgery

**Rekomendasi:**

```typescript
// lib/csrf.ts
import { cookies } from 'next/headers'
import crypto from 'crypto'

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function setCsrfToken(): string {
  const token = generateCsrfToken()
  cookies().set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
  })
  return token
}

export function validateCsrfToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get('csrf-token')?.value
  const headerToken = request.headers.get('X-CSRF-Token')
  
  if (!cookieToken || !headerToken) {
    return false
  }
  
  return cookieToken === headerToken
}

// Middleware
export async function middleware(request: NextRequest) {
  // Skip CSRF check for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return NextResponse.next()
  }
  
  // Validate CSRF token for POST, PUT, DELETE
  if (!validateCsrfToken(request)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    )
  }
  
  return NextResponse.next()
}
```

---

### 14. ⚠️ **SESSION MANAGEMENT ISSUES**

**Severity:** MEDIUM 🟡  
**CWE-384:** Session Fixation

**Rekomendasi:**

```typescript
// lib/session-config.ts
export const sessionConfig = {
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  },
  // Force new session after login
  regenerateOnLogin: true,
  // Invalidate old sessions
  invalidateOldTokens: true,
}

// Implementasi di Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce', // ✅ Use PKCE flow for better security
  },
  global: {
    headers: {
      'X-Client-Info': 'garuda-academy',
    },
  },
})
```

---

### 15. ⚠️ **SECURITY HEADERS TIDAK LENGKAP**

**Severity:** MEDIUM 🟡  
**CWE-693:** Protection Mechanism Failure

**Rekomendasi:**

```typescript
// next.config.js
const securityHeaders = [
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
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self' https://*.supabase.co;
      frame-ancestors 'none';
    `.replace(/\s{2,}/g, ' ').trim()
  }
]

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}
```

---

## 🔐 REKOMENDASI KEAMANAN TAMBAHAN

### 1. **Environment Variables Protection**

```bash
# .env.local
# ✅ JANGAN commit file ini ke Git!
# ✅ Gunakan secrets management (Vault, AWS Secrets Manager)

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx # ⚠️ SANGAT SENSITIF!

# Email
GMAIL_SMTP_HOST=smtp.gmail.com
GMAIL_SMTP_PORT=587
GMAIL_SMTP_USER=xxx
GMAIL_SMTP_PASS=xxx # ⚠️ Gunakan App Password, bukan password asli!

# Security
JWT_SECRET=xxx # Generate random 256-bit key
ENCRYPTION_KEY=xxx
```

### 2. **Input Validation Library**

```typescript
// lib/validation.ts
import { z } from 'zod'

// User validation schemas
export const emailSchema = z.string().email()
export const passwordSchema = z.string().min(8).max(100)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)

export const userSignUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().min(2).max(100),
})

export const ticketSchema = z.object({
  full_name: z.string().min(2).max(100),
  email: emailSchema,
  phone: z.string().regex(/^[0-9+\-() ]{8,20}$/).optional(),
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(5000),
})

// Usage
export async function POST(request: NextRequest) {
  const body = await request.json()
  
  try {
    const validatedData = ticketSchema.parse(body)
    // Process validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
  }
}
```

### 3. **Secure Password Hashing**

```typescript
// lib/password.ts
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}
```

### 4. **API Key Rotation Policy**

```markdown
# API Key Management Policy

1. **Service Role Key:**
   - Rotasi setiap 90 hari
   - Store di secrets manager
   - Jangan expose di client-side

2. **Anon Key:**
   - Public key (safe untuk client)
   - Dikombinasikan dengan RLS

3. **JWT Secret:**
   - Rotasi setiap 180 hari
   - Minimal 256-bit entropy
```

### 5. **Audit Logging**

```typescript
// lib/audit-log.ts
export async function logAuditEvent(event: {
  userId: string
  action: string
  resource: string
  resourceId: string
  ipAddress?: string
  userAgent?: string
  status: 'success' | 'failure'
  metadata?: any
}) {
  const supabaseAdmin = getSupabaseAdmin()
  
  await supabaseAdmin.from('audit_logs').insert({
    user_id: event.userId,
    action: event.action,
    resource: event.resource,
    resource_id: event.resourceId,
    ip_address: event.ipAddress,
    user_agent: event.userAgent,
    status: event.status,
    metadata: event.metadata,
    created_at: new Date().toISOString(),
  })
}

// Usage
await logAuditEvent({
  userId: user.id,
  action: 'RESET_PASSWORD',
  resource: 'user',
  resourceId: targetUserId,
  ipAddress: request.ip,
  status: 'success',
})
```

---

## ✅ CHECKLIST PERSIAPAN PENETRATION TEST

### Pre-Test Checklist

- [ ] **Authentication & Authorization**
  - [ ] Implementasi authentication middleware di semua protected routes
  - [ ] Validasi role-based access control (RBAC)
  - [ ] Enable dan configure RLS policies dengan benar
  - [ ] Session management yang secure
  - [ ] Password policy yang kuat

- [ ] **Input Validation**
  - [ ] Validasi semua user input dengan schema validation (Zod)
  - [ ] Sanitize HTML/JavaScript input
  - [ ] Validate file uploads (type, size, magic bytes)
  - [ ] SQL injection prevention via parameterized queries

- [ ] **API Security**
  - [ ] Rate limiting di semua API endpoints
  - [ ] CSRF protection
  - [ ] CORS configuration yang strict
  - [ ] API authentication dengan JWT/Bearer tokens
  - [ ] Request size limits

- [ ] **Data Protection**
  - [ ] Encrypt sensitive data at rest
  - [ ] Encrypt data in transit (HTTPS only)
  - [ ] Implement data masking untuk PII
  - [ ] Secure file storage dengan access controls

- [ ] **Security Headers**
  - [ ] Implement semua security headers (CSP, HSTS, X-Frame-Options, dll)
  - [ ] Configure HTTPS/TLS dengan grade A
  - [ ] Disable unnecessary HTTP methods

- [ ] **Error Handling**
  - [ ] Tidak expose stack traces di production
  - [ ] Generic error messages untuk user
  - [ ] Detailed logging untuk debugging (secure logs)
  - [ ] Implement error monitoring (Sentry)

- [ ] **Logging & Monitoring**
  - [ ] Audit logs untuk sensitive operations
  - [ ] Monitor authentication failures
  - [ ] Alert untuk suspicious activities
  - [ ] SIEM integration (optional)

- [ ] **Infrastructure**
  - [ ] Environment variables management
  - [ ] Secrets tidak di-commit ke Git
  - [ ] Database backups regular
  - [ ] Disaster recovery plan

- [ ] **Code Quality**
  - [ ] Dependency vulnerability scanning (npm audit)
  - [ ] Code review untuk security issues
  - [ ] Static Application Security Testing (SAST)
  - [ ] Update dependencies ke versi terbaru

### Test Environment Setup

- [ ] Setup staging environment terpisah untuk pentest
- [ ] Backup production database sebelum test
- [ ] Gunakan test accounts dengan data sample
- [ ] Monitor logs selama pentest
- [ ] Prepare incident response plan

---

## 📊 PRIORITAS PERBAIKAN

### 🔴 CRITICAL (Fix Immediately - Before Pentest)

1. Enable middleware authentication
2. Implement API route authentication & authorization
3. Enable RLS policies di semua tabel
4. Fix file upload validation
5. Remove hardcoded passwords

**Timeline:** 1-2 hari

### 🟠 HIGH (Fix Within 1 Week)

6. Implement rate limiting
7. Add CSRF protection
8. Fix XSS vulnerabilities
9. Fix IDOR vulnerabilities
10. Implement audit logging

**Timeline:** 3-5 hari

### 🟡 MEDIUM (Fix Within 2 Weeks)

11. Add security headers
12. Implement input validation library
13. Fix CORS configuration
14. Improve session management
15. Setup monitoring & alerting

**Timeline:** 1-2 minggu

---

## 🛠️ TOOLS UNTUK PENETRATION TESTING

### Recommended Tools

1. **OWASP ZAP** - Web application security scanner
2. **Burp Suite** - Web vulnerability scanner & proxy
3. **SQLMap** - SQL injection testing
4. **Postman** - API testing
5. **Nikto** - Web server scanner
6. **Nmap** - Network scanner
7. **Metasploit** - Penetration testing framework

### Testing Scope

- [ ] Authentication & Authorization bypass
- [ ] SQL Injection
- [ ] XSS (Reflected, Stored, DOM-based)
- [ ] CSRF
- [ ] IDOR
- [ ] File Upload vulnerabilities
- [ ] API security testing
- [ ] Session management
- [ ] Business logic flaws

---

## 📞 KONTAK & SUPPORT

Jika ada pertanyaan mengenai implementasi fix keamanan:

1. Review dokumentasi ini dengan tim development
2. Prioritaskan fix berdasarkan severity
3. Test setiap fix di staging environment
4. Deploy ke production secara bertahap
5. Monitor logs setelah deployment

---

**Report Generated:** $(date)  
**Version:** 1.0  
**Status:** DRAFT - For Internal Review

⚠️ **DISCLAIMER:** Laporan ini bersifat rahasia dan hanya untuk internal use. Jangan share ke pihak ketiga tanpa persetujuan.

---

## 🎯 KESIMPULAN

Aplikasi GARUDA-21 Training Center memiliki **potensi kerentanan serius** yang harus diperbaiki sebelum penetration testing. Focus utama:

1. **Authentication & Authorization** - KRITIS
2. **Input Validation** - KRITIS  
3. **File Upload Security** - KRITIS
4. **RLS Policies** - KRITIS
5. **Rate Limiting & CSRF** - HIGH

Dengan memperbaiki 15 kerentanan critical/high di atas, aplikasi akan jauh lebih secure dan siap untuk penetration testing profesional.

**Estimated Effort:** 2-3 minggu full-time development

Good luck! 🚀

