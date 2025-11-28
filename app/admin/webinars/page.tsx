'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/hooks/useToast'
import { Plus, Edit, Trash2, Video, X, Calendar, Users, Award } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface WebinarForm {
  title: string
  slug: string
  description: string
  start_time: string
  end_time: string
  is_published: boolean
  hero_image_file?: File | null
  recording_url?: string
  meeting_url?: string
  platform?: string
}

export default function AdminWebinarsPage() {
  const { profile } = useAuth()
  const addToast = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<WebinarForm>({
    title: '', slug: '', description: '', start_time: '', end_time: '', is_published: false, recording_url: '', meeting_url: '', platform: 'microsoft-teams'
  })
  const [speakers, setSpeakers] = useState<Array<{ name: string; title: string; avatar?: File | null; avatar_url?: string }>>([
    { name: '', title: '', avatar: null, avatar_url: undefined }
  ])
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)

  async function compressImageToWebp(file: File, maxWidth: number, maxHeight: number, quality = 0.8): Promise<Blob> {
    const imageBitmap = await createImageBitmap(file)
    const { width, height } = imageBitmap
    const scale = Math.min(maxWidth / width, maxHeight / height, 1)
    const targetW = Math.round(width * scale)
    const targetH = Math.round(height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')
    ctx.drawImage(imageBitmap, 0, 0, targetW, targetH)
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
    if (!blob) throw new Error('Failed to compress image')
    return blob
  }

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('webinars').select('*').order('created_at', { ascending: false })
      setItems(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      // Slug validation
      if (!editingId) {
        const { data: exist } = await supabase.from('webinars').select('id').eq('slug', form.slug).maybeSingle()
        if (exist) throw new Error('Slug sudah dipakai, gunakan slug lain')
      } else {
        const { data: exist } = await supabase.from('webinars').select('id').eq('slug', form.slug).maybeSingle()
        if (exist && exist.id !== editingId) throw new Error('Slug sudah dipakai, gunakan slug lain')
      }

      let heroUrl: string | undefined
      if (form.hero_image_file) {
        const file = form.hero_image_file
        const blob = await compressImageToWebp(file, 1600, 900, 0.8)
        const path = `hero/${Date.now()}_${(file.name || 'banner')}.webp`
        const { error, data } = await supabase.storage.from('webinar-assets').upload(path, blob, { upsert: true, contentType: 'image/webp' })
        if (error) throw error
        const { data: pub } = supabase.storage.from('webinar-assets').getPublicUrl(path)
        heroUrl = pub.publicUrl
      }

      let webinarId = editingId
      if (!editingId) {
        const { data: insData, error: insErr } = await supabase.from('webinars').insert({
          title: form.title,
          slug: form.slug,
          description: form.description,
          start_time: new Date(form.start_time).toISOString(),
          end_time: new Date(form.end_time).toISOString(),
          is_published: form.is_published,
          hero_image_url: heroUrl,
          meeting_url: form.meeting_url || null,
          platform: form.platform || 'microsoft-teams',
          created_by: profile?.id || null
        }).select('id').single()
        if (insErr) throw insErr
        webinarId = (insData as any)?.id
      } else {
        const { error: updErr } = await supabase.from('webinars').update({
          title: form.title,
          slug: form.slug,
          description: form.description,
          start_time: new Date(form.start_time).toISOString(),
          end_time: new Date(form.end_time).toISOString(),
          is_published: form.is_published,
          hero_image_url: heroUrl ?? undefined,
          meeting_url: form.meeting_url || null,
          platform: form.platform || 'microsoft-teams'
        }).eq('id', editingId)
        if (updErr) throw updErr
      }

      // Insert recording if provided
      if (webinarId) {
        // delete existing and insert new if provided
        await supabase.from('webinar_recordings').delete().eq('webinar_id', webinarId)
        if (form.recording_url) {
          const { error: recErr } = await supabase
            .from('webinar_recordings')
            .insert({ webinar_id: webinarId, recording_url: form.recording_url, is_public: true })
          if (recErr) throw recErr
        }
      }

      // Upload speaker avatars + insert rows
      if (webinarId) {
        // If editing: replace existing speakers with provided list
        if (editingId) {
          await supabase.from('webinar_speakers').delete().eq('webinar_id', webinarId)
        }
        for (let i = 0; i < speakers.length; i++) {
          const sp = speakers[i]
          if (!sp.name && !sp.title && !sp.avatar) continue
          let avatarUrl: string | undefined
          if (sp.avatar) {
            const blob = await compressImageToWebp(sp.avatar, 512, 512, 0.8)
            const path = `speakers/${webinarId}/${Date.now()}_${(sp.avatar.name || 'avatar')}.webp`
            const up = await supabase.storage.from('webinar-assets').upload(path, blob, { upsert: true, contentType: 'image/webp' })
            if (up.error) throw up.error
            const { data: pub } = supabase.storage.from('webinar-assets').getPublicUrl(path)
            avatarUrl = pub.publicUrl
          } else if (sp.avatar_url) {
            avatarUrl = sp.avatar_url
          }
          const { error: spErr } = await supabase
            .from('webinar_speakers')
            .insert({
              webinar_id: webinarId,
              name: sp.name,
              title: sp.title,
              avatar_url: avatarUrl,
              sort_order: i
            })
          if (spErr) throw spErr
        }
      }
      const { data } = await supabase.from('webinars').select('*').order('created_at', { ascending: false })
      setItems(data || [])
      setForm({ title: '', slug: '', description: '', start_time: '', end_time: '', is_published: false, recording_url: '', meeting_url: '', platform: 'microsoft-teams' })
      setSpeakers([{ name: '', title: '', avatar: null }])
      setEditingId(null)
      setShowForm(false)
      addToast.success('Webinar berhasil disimpan', 'Berhasil')
    } catch (err: any) {
      addToast.error(err.message || 'Gagal membuat webinar', 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  async function loadForEdit(id: string) {
    const { data, error } = await supabase.from('webinars').select('*').eq('id', id).single()
    if (error || !data) {
      addToast.error('Gagal memuat data webinar', 'Error')
      return
    }
    setEditingId(id)
    setShowForm(true)
    setForm({
      title: data.title || '',
      slug: data.slug || '',
      description: data.description || '',
      start_time: data.start_time ? new Date(data.start_time).toISOString().slice(0,16) : '',
      end_time: data.end_time ? new Date(data.end_time).toISOString().slice(0,16) : '',
      is_published: !!data.is_published,
      recording_url: '',
      meeting_url: data.meeting_url || '',
      platform: data.platform || 'microsoft-teams'
    })
    // Load existing recording
    const { data: recs } = await supabase.from('webinar_recordings').select('recording_url').eq('webinar_id', id).order('created_at', { ascending: false }).limit(1)
    if (recs && recs.length > 0) {
      setForm(f => ({ ...f, recording_url: recs[0].recording_url || '' }))
    }
    // Load existing speakers
    const { data: sps } = await supabase.from('webinar_speakers').select('name, title, avatar_url, sort_order').eq('webinar_id', id).order('sort_order', { ascending: true })
    if (sps) {
      setSpeakers(sps.map((s: any) => ({ name: s.name || '', title: s.title || '', avatar: null, avatar_url: s.avatar_url || undefined })))
    } else {
      setSpeakers([{ name: '', title: '', avatar: null, avatar_url: undefined }])
    }
  }

  function handleCancelEdit() {
    setEditingId(null)
    setShowForm(false)
    setForm({ title: '', slug: '', description: '', start_time: '', end_time: '', is_published: false, recording_url: '', meeting_url: '', platform: 'microsoft-teams' })
    setSpeakers([{ name: '', title: '', avatar: null }])
    setSlugAvailable(null)
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Apakah Anda yakin ingin menghapus webinar "${title}"?`)) return
    try {
      const { error } = await supabase.from('webinars').delete().eq('id', id)
      if (error) throw error
      const { data } = await supabase.from('webinars').select('*').order('created_at', { ascending: false })
      setItems(data || [])
      addToast.success('Webinar berhasil dihapus', 'Berhasil')
    } catch (error: any) {
      addToast.error(error.message || 'Gagal menghapus webinar', 'Error')
    }
  }

  async function checkSlugAvailability(slug: string) {
    if (!slug) { setSlugAvailable(null); return }
    const { data } = await supabase.from('webinars').select('id').eq('slug', slug).maybeSingle()
    if (!data) { setSlugAvailable(true); return }
    if (editingId && data.id === editingId) { setSlugAvailable(true); return }
    setSlugAvailable(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manajemen Webinar</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Kelola semua webinar</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setShowForm(true)
              setEditingId(null)
              setForm({ title: '', slug: '', description: '', start_time: '', end_time: '', is_published: false, recording_url: '', meeting_url: '', platform: 'microsoft-teams' })
              setSpeakers([{ name: '', title: '', avatar: null }])
              setSlugAvailable(null)
            }}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-primary-600 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-primary-700 transition-colors flex-shrink-0 whitespace-nowrap shadow-sm"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span>Buat Webinar</span>
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? 'Edit Webinar' : 'Buat Webinar Baru'}
            </h2>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
              <input 
                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm" 
                value={form.title} 
                onChange={e=>setForm(f=>({...f,title:e.target.value}))} 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input 
                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm" 
                value={form.slug} 
                onChange={e=>{ setForm(f=>({...f,slug:e.target.value})); setSlugAvailable(null) }} 
                onBlur={e=>checkSlugAvailability(e.target.value)}
                required 
              />
              {slugAvailable === false && (
                <div className="text-xs text-red-600 mt-1">Slug sudah dipakai</div>
              )}
              {slugAvailable === true && (
                <div className="text-xs text-green-600 mt-1">Slug tersedia</div>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <textarea 
                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm h-28 resize-none" 
                value={form.description} 
                onChange={e=>setForm(f=>({...f,description:e.target.value}))} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mulai</label>
              <input 
                type="datetime-local" 
                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm" 
                value={form.start_time} 
                onChange={e=>setForm(f=>({...f,start_time:e.target.value}))} 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selesai</label>
              <input 
                type="datetime-local" 
                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm" 
                value={form.end_time} 
                onChange={e=>setForm(f=>({...f,end_time:e.target.value}))} 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Banner (opsional)</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={e=>setForm(f=>({...f,hero_image_file:e.target.files?.[0]}))}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Recording URL (opsional)</label>
              <input
                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                placeholder="https://... (YouTube, Vimeo, atau file)"
                value={form.recording_url}
                onChange={e=>setForm(f=>({...f,recording_url:e.target.value}))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting URL (opsional)</label>
              <input
                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                placeholder="https://... (Zoom, Google Meet, Teams)"
                value={form.meeting_url || ''}
                onChange={e=>setForm(f=>({...f,meeting_url:e.target.value}))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
              <select
                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                value={form.platform || 'microsoft-teams'}
                onChange={e=>setForm(f=>({...f,platform:e.target.value}))}
              >
                <option value="microsoft-teams">Microsoft Teams</option>
                <option value="google-meet">Google Meet</option>
                <option value="zoom">Zoom</option>
                <option value="luring">Luring (Offline)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input 
                id="pub" 
                type="checkbox" 
                checked={form.is_published} 
                onChange={e=>setForm(f=>({...f,is_published:e.target.checked}))}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="pub" className="text-sm text-gray-700">Publish</label>
            </div>
            {/* Speakers */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">Pembicara</label>
                <button
                  type="button"
                  onClick={() => setSpeakers(prev => [...prev, { name: '', title: '', avatar: null }])}
                  className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  + Tambah Pembicara
                </button>
              </div>
              <div className="space-y-3">
                {speakers.map((sp, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border border-gray-200 rounded-lg">
                    <input
                      className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                      placeholder="Nama Pembicara"
                      value={sp.name}
                      onChange={e=>{
                        const v = e.target.value; setSpeakers(s => s.map((x,i)=> i===idx? {...x, name:v}: x))
                      }}
                    />
                    <input
                      className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                      placeholder="Jabatan / Title"
                      value={sp.title}
                      onChange={e=>{
                        const v = e.target.value; setSpeakers(s => s.map((x,i)=> i===idx? {...x, title:v}: x))
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={e=>{
                          const file = e.target.files?.[0] || null
                          setSpeakers(s => s.map((x,i)=> i===idx? {...x, avatar:file}: x))
                        }}
                        className="text-sm text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      />
                      {sp.avatar_url && (
                        <img src={sp.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover border" />
                      )}
                      <button
                        type="button"
                        onClick={() => setSpeakers(s => s.filter((_,i)=> i!==idx))}
                        className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button 
                type="submit" 
                disabled={submitting || slugAvailable === false} 
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Buat Webinar')}
              </button>
              <button 
                type="button" 
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Batal
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Webinars List */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Daftar Webinar</h2>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 animate-pulse rounded"></div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Belum ada webinar</p>
            <button
              onClick={() => {
                setShowForm(true)
                setEditingId(null)
                setForm({ title: '', slug: '', description: '', start_time: '', end_time: '', is_published: false, recording_url: '', meeting_url: '', platform: 'microsoft-teams' })
                setSpeakers([{ name: '', title: '', avatar: null }])
                setSlugAvailable(null)
              }}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Buat Webinar Pertama
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Judul</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Waktu</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-1">{it.title}</p>
                          <p className="text-xs text-gray-500">{it.slug}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-600">
                          <p>{formatDate(it.start_time)}</p>
                          <p className="text-xs text-gray-500">s/d {formatDate(it.end_time)}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          it.is_published 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {it.is_published ? 'Diterbitkan' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => loadForEdit(it.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <a
                            href={`/admin/webinars/${it.id}/participants`}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Peserta"
                          >
                            <Users className="w-4 h-4" />
                          </a>
                          <a
                            href={`/admin/webinars/${it.id}/certificates`}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Sertifikat"
                          >
                            <Award className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(it.id, it.title)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {items.map((it) => (
                <div key={it.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 mb-1 truncate">{it.title}</h3>
                      <p className="text-xs text-gray-500 mb-2">{it.slug}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      it.is_published 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {it.is_published ? 'Diterbitkan' : 'Draft'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(it.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(it.end_time)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => loadForEdit(it.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <a
                      href={`/admin/webinars/${it.id}/participants`}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Peserta"
                    >
                      <Users className="w-4 h-4" />
                    </a>
                    <a
                      href={`/admin/webinars/${it.id}/certificates`}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                      title="Sertifikat"
                    >
                      <Award className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDelete(it.id, it.title)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}


