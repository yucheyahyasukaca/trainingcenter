'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Row { id: string; email: string; full_name: string }

export default function WebinarParticipantsPage() {
  const params = useParams<{ id: string }>()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      // Admin policy allows reading all webinar_registrations
      const { data: regs } = await supabase
        .from('webinar_registrations')
        .select('user_id')
        .eq('webinar_id', params.id)

      const userIds = (regs || []).map((r: any) => r.user_id)
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, email, full_name')
          .in('id', userIds)
        setRows((profiles || []).map((p:any)=>({ id: p.id, email: p.email, full_name: p.full_name })))
      } else {
        setRows([])
      }
      setLoading(false)
    }
    load()
  }, [params.id])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Peserta Webinar</h1>
      {loading ? (
        <div>Memuat...</div>
      ) : rows.length === 0 ? (
        <div>Belum ada peserta.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Nama</th>
                <th className="py-2 pr-4">Email</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="py-2 pr-4">{r.full_name}</td>
                  <td className="py-2 pr-4">{r.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}


