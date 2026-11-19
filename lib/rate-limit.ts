// Pembatas laju sederhana (in-memory, per proses). Cukup untuk meredam penyalahgunaan
// endpoint publik; untuk beberapa instance gunakan juga aturan rate-limit di Cloudflare.
const buckets = new Map<string, { n: number; reset: number }>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now()
    const cur = buckets.get(key)
    if (!cur || cur.reset <= now) {
        buckets.set(key, { n: 1, reset: now + windowMs })
    } else {
        cur.n += 1
        if (cur.n > limit) return false
    }
    if (buckets.size > 20000) {
        for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k)
    }
    return true
}

export function clientIp(req: Request): string {
    return (
        req.headers.get('cf-connecting-ip') ||
        (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
        req.headers.get('x-real-ip') ||
        'unknown'
    )
}
