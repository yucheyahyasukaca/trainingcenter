import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import crypto from 'crypto'

export interface AuthResult {
    user: any
    profile: any
}

// ---------------------------------------------------------------------------
// Kunci internal untuk panggilan server-ke-server (mis. reset password -> kirim email).
// Diturunkan dari service role key, sehingga tidak perlu env baru dan tidak bisa ditebak.
// ---------------------------------------------------------------------------
export function internalKey(): string {
    return crypto
        .createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing')
        .update('garuda-internal-api-v1')
        .digest('hex')
}

export function internalHeaders(): Record<string, string> {
    return { 'x-internal-key': internalKey() }
}

export function isInternalRequest(request: Request): boolean {
    const given = request.headers.get('x-internal-key')
    if (!given) return false
    const a = Buffer.from(given)
    const b = Buffer.from(internalKey())
    return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function parseCookies(header: string | null) {
    if (!header) return []
    return header.split(';').map((c) => {
        const i = c.indexOf('=')
        if (i < 0) return { name: c.trim(), value: '' }
        let value = c.slice(i + 1).trim()
        try { value = decodeURIComponent(value) } catch { /* biarkan apa adanya */ }
        return { name: c.slice(0, i).trim(), value }
    }).filter((c) => c.name)
}

// Mengambil user dari header Authorization (Bearer) ATAU dari cookie sesi Supabase
// (fetch same-origin dari browser mengirim cookie otomatis).
export async function validateAuth(request: Request | NextRequest): Promise<AuthResult> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

    let user: any = null
    const authHeader = request.headers.get('Authorization')
    if (authHeader && /^Bearer\s+/i.test(authHeader)) {
        const token = authHeader.replace(/^Bearer\s+/i, '')
        const { data, error } = await admin.auth.getUser(token)
        if (error || !data?.user) throw new Error('Unauthorized: Invalid token')
        user = data.user
    } else {
        const cookies = parseCookies(request.headers.get('cookie'))
        if (!cookies.some((c) => c.name.startsWith('sb-'))) {
            throw new Error('Unauthorized: No session')
        }
        const ssr = createServerClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
            cookies: { getAll: () => cookies, setAll: () => { /* read-only */ } },
        })
        const { data, error } = await ssr.auth.getUser()
        if (error || !data?.user) throw new Error('Unauthorized: Invalid session')
        user = data.user
    }

    const { data: profile } = await admin
        .from('user_profiles')
        .select('id, email, full_name, role')
        .eq('id', user.id)
        .single()

    if (!profile) {
        throw new Error('Profile not found')
    }

    return { user, profile }
}

export async function validateAdmin(request: Request | NextRequest): Promise<AuthResult> {
    const { user, profile } = await validateAuth(request)

    if (profile.role !== 'admin' && profile.role !== 'manager') {
        throw new Error('Forbidden: Admin access required')
    }

    return { user, profile }
}

function errorResponse(error: any) {
    const msg: string = error?.message || 'Unauthorized'
    const status = msg.startsWith('Forbidden') ? 403 : 401
    return NextResponse.json({ error: status === 403 ? 'Akses ditolak' : 'Silakan login terlebih dahulu' }, { status })
}

// Dipakai di awal handler: `const denied = await guardAdmin(request); if (denied) return denied`
export async function guardAdmin(request: Request | NextRequest): Promise<NextResponse | null> {
    if (isInternalRequest(request)) return null
    try {
        await validateAdmin(request)
        return null
    } catch (error: any) {
        console.warn('[AuthGuard] admin ditolak:', error?.message)
        return errorResponse(error)
    }
}

export async function guardUser(request: Request | NextRequest): Promise<NextResponse | null> {
    if (isInternalRequest(request)) return null
    try {
        await validateAuth(request)
        return null
    } catch (error: any) {
        return errorResponse(error)
    }
}

export function withAdmin(
    handler: (req: NextRequest, auth: AuthResult) => Promise<NextResponse>
) {
    return async (req: NextRequest) => {
        try {
            const auth = await validateAdmin(req)
            return await handler(req, auth)
        } catch (error: any) {
            console.error('[AuthError]', error.message)
            return errorResponse(error)
        }
    }
}

// Samarkan email (mis. "ab***@domain.com") untuk pengguna non-admin.
export function maskEmail(email: string): string {
    const [name, domain] = String(email).split('@')
    if (!domain) return '***'
    return `${name.slice(0, 2)}***@${domain}`
}

export function maskEmailsDeep<T>(value: T): T {
    if (Array.isArray(value)) return value.map((v) => maskEmailsDeep(v)) as any
    if (value && typeof value === 'object') {
        const out: any = {}
        for (const [k, v] of Object.entries(value as any)) {
            out[k] = /email/i.test(k) && typeof v === 'string' ? maskEmail(v) : maskEmailsDeep(v)
        }
        return out
    }
    return value
}

export function isAdminRole(role: string | null | undefined): boolean {
    return role === 'admin' || role === 'manager'
}
