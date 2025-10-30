'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function WebinarCertificatesAdminPage() {
  const params = useParams<{ slug: string }>()
  const [issuing, setIssuing] = useState(false)
  const [result, setResult] = useState<string>('')

  async function handleIssue() {
    try {
      setIssuing(true)
      const res = await fetch(`/api/webinars/${params.slug}/issue-certificates`, { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        setResult(`Berhasil menerbitkan ${json.issued || 0} sertifikat.`)
      } else {
        setResult(json.error || 'Gagal menerbitkan sertifikat')
      }
    } finally {
      setIssuing(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Sertifikat Webinar</h1>
      <button onClick={handleIssue} disabled={issuing} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
        {issuing ? 'Memproses...' : 'Terbitkan Sertifikat untuk Peserta'}
      </button>
      {result && <div className="mt-3 text-sm text-gray-700">{result}</div>}
      <p className="text-xs text-gray-500 mt-2">Hanya dapat diterbitkan setelah webinar selesai.</p>
    </div>
  )
}


