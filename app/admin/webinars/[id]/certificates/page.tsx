'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Template { id: string; template_name: string }
interface Webinar { id: string; title: string; end_time: string; certificate_template_id?: string | null }

export default function WebinarCertificatesAdminPage() {
  const params = useParams<{ id: string }>()
  const [issuing, setIssuing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<string>('')
  const [webinar, setWebinar] = useState<Webinar | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [certs, setCerts] = useState<Array<{ user_id: string; pdf_url: string }>>([])

  useEffect(() => {
    async function load() {
      const { data: w } = await supabase
        .from('webinars')
        .select('id, title, end_time, certificate_template_id')
        .eq('id', params.id)
        .maybeSingle()
      if (w) {
        setWebinar(w as any)
        setSelectedTemplate((w as any).certificate_template_id || '')
        const { data: existing } = await supabase
          .from('webinar_certificates')
          .select('user_id, pdf_url')
          .eq('webinar_id', (w as any).id)
        setCerts(existing || [])
      }
      const { data: tpls } = await supabase
        .from('certificate_templates')
        .select('id, template_name')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      setTemplates(tpls || [])
    }
    load()
  }, [params.id])

  async function saveTemplate() {
    if (!webinar) return
    try {
      setSaving(true)
      const { error } = await supabase
        .from('webinars')
        .update({ certificate_template_id: selectedTemplate || null })
        .eq('id', webinar.id)
      if (error) throw error
      setResult('Template tersimpan untuk webinar ini.')
    } catch (e: any) {
      setResult(e.message || 'Gagal menyimpan template')
    } finally {
      setSaving(false)
    }
  }

  async function handleIssue() {
    try {
      setIssuing(true)
      // need slug to call existing endpoint - fetch it
      const { data: w } = await supabase.from('webinars').select('slug').eq('id', params.id).maybeSingle()
      const slug = (w as any)?.slug
      const res = await fetch(`/api/webinars/${slug}/issue-certificates`, { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        setResult(`Berhasil menerbitkan ${json.issued || 0} sertifikat.`)
        if (webinar) {
          const { data: existing } = await supabase
            .from('webinar_certificates')
            .select('user_id, pdf_url')
            .eq('webinar_id', webinar.id)
          setCerts(existing || [])
        }
      } else {
        setResult(json.error || 'Gagal menerbitkan sertifikat')
      }
    } finally {
      setIssuing(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Sertifikat Webinar</h1>
        {webinar && <p className="text-sm text-gray-600 mt-1">{webinar.title}</p>}
      </div>

      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold mb-2">Pilih Template Sertifikat</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <select className="input" value={selectedTemplate} onChange={(e)=> setSelectedTemplate(e.target.value)}>
            <option value="">— Pilih Template —</option>
            {templates.map(t => (<option key={t.id} value={t.id}>{t.template_name}</option>))}
          </select>
          <button onClick={saveTemplate} disabled={saving} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            {saving ? 'Menyimpan...' : 'Simpan Template'}
          </button>
          <a href="/admin/certificate-management" className="px-4 py-2 border rounded-lg hover:bg-gray-50">Kelola Template</a>
        </div>
        <p className="text-xs text-gray-500 mt-2">Template sertifikat menggunakan sistem program (PDF + QR code + field dinamis).</p>
      </div>

      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold mb-2">Terbitkan Sertifikat</h2>
        <button onClick={handleIssue} disabled={issuing || !selectedTemplate} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
          {issuing ? 'Memproses...' : 'Terbitkan Sertifikat untuk Peserta'}
        </button>
        <p className="text-xs text-gray-500 mt-2">Hanya dapat diterbitkan setelah webinar selesai.</p>
        {result && <div className="mt-3 text-sm text-gray-700">{result}</div>}
      </div>

      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold mb-3">Sertifikat Terbit</h2>
        {certs.length === 0 ? (
          <div className="text-gray-600 text-sm">Belum ada sertifikat.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">User ID</th>
                  <th className="py-2 pr-4">Unduh</th>
                </tr>
              </thead>
              <tbody>
                {certs.map((c, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2 pr-4">{c.user_id}</td>
                    <td className="py-2 pr-4"><a className="px-3 py-1.5 border rounded-lg hover:bg-gray-50" href={c.pdf_url} target="_blank">Download</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}


