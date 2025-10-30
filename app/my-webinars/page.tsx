'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'

interface Row { webinar_id: string; slug: string; title: string; start_time: string }

export default function MyWebinarsPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('webinar_registrations')
        .select('webinar_id, webinars:webinars(id, slug, title, start_time)')
        .eq('user_id', user.id)
        .order('registered_at', { ascending: false })
      const mapped: Row[] = (data || []).map((r: any) => ({
        webinar_id: r.webinar_id,
        slug: r.webinars?.slug,
        title: r.webinars?.title,
        start_time: r.webinars?.start_time
      }))
      setRows(mapped)
      setLoading(false)
    }
    load()
  }, [user])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Webinar Terdaftar</h1>
      {loading ? (
        <div>Memuat...</div>
      ) : rows.length === 0 ? (
        <div>Belum ada webinar terdaftar.</div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.webinar_id} className="p-4 border rounded-xl flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">{r.title}</div>
                <div className="text-sm text-gray-600">{new Date(r.start_time).toLocaleString('id-ID')}</div>
              </div>
              <Link href={`/webinars/${r.slug}`} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Buka</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


