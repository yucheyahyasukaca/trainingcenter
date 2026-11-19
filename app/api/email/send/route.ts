import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, addToQueue, verifyTransporter, getQueueStatus } from '@/lib/mail'
import { isInternalRequest, validateAuth, guardAdmin } from '@/lib/api-auth'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MAX_HTML_CHARS = 200_000
const FRESH_ACCOUNT_MS = 30 * 60 * 1000
const SAFE_LINK_HOST = /^(https?:\/\/)([a-z0-9-]+\.)*(garuda-21\.com|garuda21\.com)(\/|$|\?|#)/i

// Untuk pemanggil non-admin: semua tautan di luar domain Garuda dinetralkan dan script dibuang.
function sanitizeHtml(html: string): string {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, '')
        .replace(/href\s*=\s*("([^"]*)"|'([^']*)')/gi, (m, _q, d, s) => {
            const url = (d ?? s ?? '').trim()
            if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) return m
            return SAFE_LINK_HOST.test(url) ? m : 'href="#"'
        })
}

// Siapa yang boleh mengirim email?
//  - panggilan internal server / admin : bebas
//  - pengguna lain (termasuk yang baru mendaftar & belum login):
//      hanya email sambutan "Selamat Bergabung" ke alamat miliknya sendiri
//      atau ke akun yang baru dibuat (<30 menit), dengan batas laju ketat.
async function authorize(request: NextRequest, to: string, subject: string): Promise<NextResponse | null> {
    if (isInternalRequest(request)) return null

    let role: string | null = null
    try {
        const { profile } = await validateAuth(request)
        role = profile.role
    } catch { /* belum login */ }

    if (role === 'admin' || role === 'manager') return null

    const ip = clientIp(request)
    const target = to.toLowerCase()
    if (!rateLimit(`mail-ip:${ip}`, 20, 3_600_000) || !rateLimit(`mail-to:${target}`, 3, 3_600_000)) {
        return NextResponse.json({ error: 'Terlalu banyak permintaan.' }, { status: 429 })
    }
    if (!/^selamat bergabung/i.test(subject.trim())) {
        return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 403 })
    }
    // Pengguna yang sudah login boleh mengirim email sambutan (tautan sudah disanitasi, laju dibatasi).
    if (role) return null

    const { data } = await getSupabaseAdmin()
        .from('user_profiles')
        .select('created_at')
        .ilike('email', target.replace(/[\\%_]/g, (c) => `\\${c}`))
        .maybeSingle()
    const created = data?.created_at ? new Date(data.created_at).getTime() : 0
    if (created && Date.now() - created < FRESH_ACCOUNT_MS) return null

    return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 403 })
}

export async function POST(request: NextRequest) {
    try {
        const { to, subject, html, useQueue = true, recipientId } = await request.json()

        if (!to || !subject || !html || typeof to !== 'string' || typeof subject !== 'string' || typeof html !== 'string') {
            return NextResponse.json(
                { error: 'Missing required fields: to, subject, html' },
                { status: 400 }
            )
        }
        if (!EMAIL_RE.test(to) || to.length > 254 || subject.length > 300 || html.length > MAX_HTML_CHARS) {
            return NextResponse.json({ error: 'Data email tidak valid.' }, { status: 400 })
        }

        const denied = await authorize(request, to, subject)
        if (denied) return denied

        const trusted = isInternalRequest(request)
        const safeHtml = trusted ? html : sanitizeHtml(html)

        const isVerified = await verifyTransporter()
        if (!isVerified) {
            return NextResponse.json({ error: 'Layanan email sedang bermasalah.' }, { status: 500 })
        }

        if (useQueue) {
            const queueLength = addToQueue({ to, subject, html: safeHtml, recipientId })
            return NextResponse.json({ success: true, message: 'Email added to queue', queueLength })
        }

        const result = await sendEmail(to, subject, safeHtml, recipientId)
        if (result.success) {
            return NextResponse.json({ success: true, message: 'Email sent successfully', messageId: result.messageId })
        }
        return NextResponse.json({
            success: true,
            message: 'Email queued for later delivery (immediate send failed)',
        })
    } catch (error: any) {
        console.error('Error in send email API:', error?.message || error)
        return NextResponse.json({ error: 'Gagal mengirim email' }, { status: 500 })
    }
}

// Status antrian & konfigurasi email: hanya admin (tanpa membocorkan akun SMTP).
export async function GET(request: NextRequest) {
    const denied = await guardAdmin(request)
    if (denied) return denied
    const status = getQueueStatus()
    return NextResponse.json({
        queueLength: status.queueLength,
        isProcessing: status.isProcessing,
        currentProvider: status.provider,
        emailProvider: process.env.EMAIL_PROVIDER || 'gmail',
        dailyEmailCount: status.dailyEmailCount,
    })
}
