// Service worker Garuda Academy.
// - Hanya menangani GET dari origin sendiri (permintaan ke Supabase/API tidak disentuh).
// - /_next/static/ (nama berhash): cache-first, aman karena berkasnya tidak pernah berubah.
// - Gambar/font/berkas statis lain: stale-while-revalidate (cepat, tapi diperbarui di latar).
// - Halaman HTML dan /api/ tidak pernah di-cache oleh SW.
const CACHE = 'app-cache-v2'
const STATIC_EXT = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.woff2', '.woff', '.ttf', '.eot']

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return
  if (!STATIC_EXT.some((ext) => url.pathname.endsWith(ext))) return

  const hashed = url.pathname.startsWith('/_next/static/')

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req)
      if (hashed && cached) return cached

      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone())
          return res
        })
        .catch(() => cached)

      return cached || network
    })
  )
})
