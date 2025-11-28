'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Prevent unhandled errors from causing redirects
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    // Prevent default error handling that might cause redirect
    if (e.message?.includes('certificate') || e.message?.includes('webinar')) {
      console.error('Error caught:', e)
      e.preventDefault()
    }
  })
  
  window.addEventListener('unhandledrejection', (e) => {
    // Prevent unhandled promise rejections from causing redirect
    if (e.reason?.message?.includes('certificate') || e.reason?.message?.includes('webinar')) {
      console.error('Unhandled rejection caught:', e.reason)
      e.preventDefault()
    }
  })
}

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
  const [certs, setCerts] = useState<Array<{ user_id: string | null; participant_id: string | null; certificate_number: string }>>([])
  const hasIssuedRef = useRef(false)

  useEffect(() => {
    async function load() {
      try {
        const { data: w, error: wError } = await supabase
          .from('webinars')
          .select('id, title, end_time, certificate_template_id, slug')
          .eq('id', params.id)
          .maybeSingle()
          
        if (wError) {
          console.error('Error loading webinar:', wError)
          setResult(`Error: ${wError.message}`)
          return
        }
        
        if (w) {
          setWebinar(w as any)
          const templateId = (w as any).certificate_template_id || ''
          setSelectedTemplate(templateId)
          console.log('Webinar loaded:', {
            id: w.id,
            title: w.title,
            end_time: w.end_time,
            template_id: templateId,
            slug: (w as any).slug
          })
          
          await refreshCertificates(w.id)
        } else {
          setResult('Error: Webinar tidak ditemukan')
        }
        
        const { data: tpls, error: tplError } = await supabase
          .from('certificate_templates')
          .select('id, template_name')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          
        if (tplError) {
          console.error('Error loading templates:', tplError)
        } else {
          setTemplates(tpls || [])
        }
      } catch (error: any) {
        console.error('Error in load:', error)
        setResult(`Error: ${error.message || 'Gagal memuat data'}`)
      }
    }
    load()
  }, [params.id])

  async function refreshCertificates(webinarId?: string) {
    const id = webinarId || webinar?.id
    if (!id) return
    const { data: existing, error: certError } = await supabase
      .from('webinar_certificates')
      .select('user_id, participant_id, certificate_number')
      .eq('webinar_id', id)
    if (certError) {
      console.error('Error loading certificates:', certError)
    } else {
      setCerts(existing || [])
    }
  }

  async function saveTemplate() {
    if (!webinar) return
    try {
      setSaving(true)
      const { error } = await supabase
        .from('webinars')
        .update({ certificate_template_id: selectedTemplate || null })
        .eq('id', webinar.id)
      if (error) throw error
      setWebinar(prev => prev ? { ...prev, certificate_template_id: selectedTemplate || null } : prev)
      hasIssuedRef.current = false
      const hasEnded = new Date(webinar.end_time) <= new Date()
      if (hasEnded && selectedTemplate) {
        setResult('Template tersimpan. Menyiapkan sertifikat otomatis...')
        await handleIssue()
      } else {
        setResult('Template tersimpan. Sertifikat akan aktif otomatis setelah webinar selesai.')
      }
      await refreshCertificates(webinar.id)
    } catch (e: any) {
      setResult(e.message || 'Gagal menyimpan template')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadCertificate = async (certificateNumber: string) => {
    try {
      const response = await fetch(`/api/webinar-certificates/${certificateNumber}/pdf`)
      if (!response.ok) {
        throw new Error('Failed to download certificate')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `webinar-certificate-${certificateNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading webinar certificate:', error)
      setResult('Error: Gagal mengunduh sertifikat')
    }
  }

  async function handleIssue(e?: React.MouseEvent) {
    // Prevent any default behavior and navigation
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    // Prevent any form submission or navigation
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', window.location.href)
    }
    
    try {
      setIssuing(true)
      setResult('') // Clear previous result
      
      // Validate template is selected
      if (!selectedTemplate) {
        setResult('Error: Pilih template sertifikat terlebih dahulu!')
        setIssuing(false)
        return
      }
      
      // Validate webinar data
      if (!webinar) {
        setResult('Error: Data webinar tidak ditemukan. Silakan refresh halaman.')
        setIssuing(false)
        return
      }
      
      // Check if webinar has ended
      const now = new Date()
      const endTime = new Date(webinar.end_time)
      if (endTime > now) {
        setResult(`Error: Webinar belum selesai. Webinar akan berakhir pada ${endTime.toLocaleString('id-ID')}`)
        setIssuing(false)
        return
      }
      
      // need slug to call existing endpoint - fetch it
      const { data: w, error: wError } = await supabase
        .from('webinars')
        .select('slug, end_time, certificate_template_id')
        .eq('id', params.id)
        .maybeSingle()
      
      if (wError || !w) {
        setResult(`Error: ${wError?.message || 'Webinar tidak ditemukan'}`)
        setIssuing(false)
        return
      }
      
      const slug = (w as any)?.slug
      if (!slug) {
        setResult('Error: Slug webinar tidak ditemukan')
        setIssuing(false)
        return
      }

      // Ensure template has been saved before issuing (auto-save if needed)
      if (!w.certificate_template_id || w.certificate_template_id !== selectedTemplate) {
        try {
          console.log('Template mismatch detected, auto-saving before issuing certificate.')
          const { error: updateError } = await supabase
            .from('webinars')
            .update({ certificate_template_id: selectedTemplate })
            .eq('id', params.id)

          if (updateError) {
            throw updateError
          }

          w.certificate_template_id = selectedTemplate
          setWebinar(prev => prev ? { ...prev, certificate_template_id: selectedTemplate } : prev)
        } catch (autoSaveError: any) {
          console.error('Failed to auto-save template before issuing:', autoSaveError)
          const detail = autoSaveError?.message ? ` ${autoSaveError.message}` : ''
          setResult(`Error: Gagal menyimpan template sebelum menerbitkan.${detail}`)
          setIssuing(false)
          return
        }
      }

      // Double check template
      if (!w.certificate_template_id) {
        setResult('Error: Template sertifikat belum diatur. Simpan template terlebih dahulu.')
        setIssuing(false)
        return
      }
      
      let res: Response
      let json: any
      
      console.log('Calling API with slug:', slug)
      
      try {
        const apiUrl = `/api/webinars/${slug}/issue-certificates`
        console.log('API URL:', apiUrl)
        
        res = await fetch(apiUrl, { 
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        console.log('Response status:', res.status, res.statusText)
        
        // Always try to parse JSON, even for error responses
        try {
          json = await res.json()
          console.log('Response JSON:', json)
        } catch (parseError) {
          console.error('Failed to parse JSON:', parseError)
          const text = await res.text()
          console.error('Response text:', text)
          json = { 
            error: `Server error: ${res.status} ${res.statusText}`,
            details: text.substring(0, 200)
          }
        }
        
        // Check if response is ok
        if (!res.ok) {
          console.error('API returned error:', {
            status: res.status,
            statusText: res.statusText,
            json
          })
        }
      } catch (fetchError: any) {
        // Network error or fetch failed
        console.error('Fetch error:', fetchError)
        setResult(`Error: Gagal menghubungi server. ${fetchError?.message || 'Silakan coba lagi.'}`)
        setIssuing(false)
        return
      }
      
      if (res.ok) {
        hasIssuedRef.current = true
        const issuedCount = json.issued || 0
        const failedCount = json.failed || 0
        
        let resultMsg = ''
        if (issuedCount > 0 && failedCount === 0) {
          resultMsg = `Berhasil menerbitkan ${issuedCount} sertifikat.`
        } else if (issuedCount > 0 && failedCount > 0) {
          resultMsg = `Berhasil menerbitkan ${issuedCount} sertifikat. ${failedCount} gagal.`
          if (json.errors && json.errors.length > 0) {
            resultMsg += `\n\nDetail error:\n${json.errors.slice(0, 5).join('\n')}`
            if (json.errors.length > 5) {
              resultMsg += `\n... dan ${json.errors.length - 5} error lainnya.`
            }
          }
        } else {
          resultMsg = `Gagal menerbitkan sertifikat. ${failedCount} error.`
          if (json.errors && json.errors.length > 0) {
            resultMsg += `\n\nDetail error:\n${json.errors.slice(0, 5).join('\n')}`
            if (json.errors.length > 5) {
              resultMsg += `\n... dan ${json.errors.length - 5} error lainnya.`
            }
          }
        }
        
        setResult(resultMsg)
        
        // Reload certificates list
        if (webinar) {
          const { data: existing } = await supabase
            .from('webinar_certificates')
            .select('user_id, participant_id, certificate_number')
            .eq('webinar_id', webinar.id)
          setCerts(existing || [])
        }
      } else {
        hasIssuedRef.current = false
        // Show error message but stay on the same page
        let errorMsg = json?.error || `Gagal menerbitkan sertifikat (${res.status})`
        
        // Add details if available
        if (json?.details) {
          errorMsg += `: ${json.details}`
        }
        
        // Special handling for common errors
        if (res.status === 400) {
          if (json?.error === 'Webinar belum selesai') {
            errorMsg = `Error: ${json.error}. ${json.details || 'Sertifikat hanya dapat diterbitkan setelah webinar selesai.'}`
          } else if (json?.error === 'Template sertifikat belum diatur') {
            errorMsg = `Error: ${json.error}. ${json.details || 'Pilih template sertifikat terlebih dahulu.'}`
          } else {
            errorMsg = `Error: ${errorMsg}`
          }
        } else if (res.status === 404) {
          errorMsg = `Error: Webinar tidak ditemukan. ${json?.details || ''}`
        } else if (res.status === 401) {
          errorMsg = `Error: Tidak memiliki akses. ${json?.details || 'Silakan login ulang.'}`
        } else {
          errorMsg = `Error: ${errorMsg}`
        }
        
        setResult(errorMsg)
        console.error('Certificate issue error:', { 
          status: res.status, 
          statusText: res.statusText,
          json,
          url: res.url,
          errorMsg
        })
        // Explicitly prevent any navigation
        e?.preventDefault?.()
        e?.stopPropagation?.()
      }
      } catch (error: any) {
      hasIssuedRef.current = false
      // Catch any unexpected errors and display them
      const errorMsg = error?.message || 'Terjadi kesalahan saat menerbitkan sertifikat'
      setResult(`Error: ${errorMsg}`)
      console.error('Unexpected error in handleIssue:', error)
      
      // Prevent any navigation
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', window.location.href)
        // Prevent default error handling
        if (error?.preventDefault) {
          error.preventDefault()
        }
      }
      
      // Don't rethrow - stay on page
    } finally {
      setIssuing(false)
      // Ensure we stay on the page
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', window.location.href)
      }
    }
  }

  useEffect(() => {
    if (!webinar || !webinar.certificate_template_id || issuing) return
    const hasEnded = new Date(webinar.end_time) <= new Date()
    if (hasEnded && !hasIssuedRef.current) {
      handleIssue().catch(() => {
        hasIssuedRef.current = false
      })
    }
  }, [webinar, issuing])

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
        <h2 className="font-semibold mb-2">Status Sertifikat</h2>
        <div className="p-4 rounded-lg border border-green-200 bg-green-50 text-sm text-green-800">
          Sertifikat webinar kini dibuat saat peserta mengunduhnya melalui halaman publik.
          Setelah template disimpan dan webinar selesai, daftar peserta otomatis mendapatkan nomor sertifikat.
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Gunakan daftar di bawah untuk memantau peserta yang sudah memiliki nomor sertifikat. Anda dapat mengunduh versi terbaru kapan saja.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => handleIssue()}
            disabled={issuing || !selectedTemplate}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {issuing ? 'Sinkronisasi...' : 'Sinkronkan Sertifikat'}
          </button>
          <button
            onClick={() => refreshCertificates()}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Muat Ulang Daftar
          </button>
          <a
            href="/webinar-certificates"
            target="_blank"
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Buka Halaman Publik
          </a>
        </div>
        {result && (
          <div className={`mt-3 text-sm p-3 rounded-lg ${
            result.startsWith('Error:') 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {result}
          </div>
        )}
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
                  <th className="py-2 pr-4">Peserta / ID</th>
                  <th className="py-2 pr-4">Nomor Sertifikat</th>
                  <th className="py-2 pr-4">Unduh</th>
                </tr>
              </thead>
              <tbody>
                {certs.map((c, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2 pr-4">{c.user_id || c.participant_id || '-'}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-gray-700">{c.certificate_number}</td>
                    <td className="py-2 pr-4">
                      <button
                        className="px-3 py-1.5 border rounded-lg hover:bg-gray-50"
                        onClick={() => handleDownloadCertificate(c.certificate_number)}
                      >
                        Download
                      </button>
                    </td>
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


