'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'

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
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
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
      alert('Webinar disimpan')
    } catch (err: any) {
      alert(err.message || 'Gagal membuat webinar')
    } finally {
      setSubmitting(false)
    }
  }

  async function loadForEdit(id: string) {
    const { data, error } = await supabase.from('webinars').select('*').eq('id', id).single()
    if (error || !data) return
    setEditingId(id)
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

  async function handleDelete(id: string) {
    if (!confirm('Hapus webinar ini?')) return
    const { error } = await supabase.from('webinars').delete().eq('id', id)
    if (error) { alert(error.message); return }
    const { data } = await supabase.from('webinars').select('*').order('created_at', { ascending: false })
    setItems(data || [])
  }

  async function checkSlugAvailability(slug: string) {
    if (!slug) { setSlugAvailable(null); return }
    const { data } = await supabase.from('webinars').select('id').eq('slug', slug).maybeSingle()
    if (!data) { setSlugAvailable(true); return }
    if (editingId && data.id === editingId) { setSlugAvailable(true); return }
    setSlugAvailable(false)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Kelola Webinar</h1>

      <form onSubmit={handleCreate} className="bg-white border rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Judul</label>
          <input className="input w-full" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug</label>
          <input 
            className="input w-full" 
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
          <label className="block text-sm font-medium mb-1">Deskripsi</label>
          <textarea className="input w-full h-28" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mulai</label>
          <input type="datetime-local" className="input w-full" value={form.start_time} onChange={e=>setForm(f=>({...f,start_time:e.target.value}))} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Selesai</label>
          <input type="datetime-local" className="input w-full" value={form.end_time} onChange={e=>setForm(f=>({...f,end_time:e.target.value}))} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Banner (optional)</label>
          <input type="file" accept="image/*" onChange={e=>setForm(f=>({...f,hero_image_file:e.target.files?.[0]}))} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Recording URL (opsional)</label>
          <input
            className="input w-full"
            placeholder="https://... (YouTube, Vimeo, atau file)"
            value={form.recording_url}
            onChange={e=>setForm(f=>({...f,recording_url:e.target.value}))}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Meeting URL (opsional)</label>
          <input
            className="input w-full"
            placeholder="https://... (Zoom, Google Meet, Teams)"
            value={form.meeting_url || ''}
            onChange={e=>setForm(f=>({...f,meeting_url:e.target.value}))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Platform</label>
          <select
            className="input w-full"
            value={form.platform || 'microsoft-teams'}
            onChange={e=>setForm(f=>({...f,platform:e.target.value}))}
          >
            <option value="microsoft-teams">Microsoft Teams</option>
            <option value="google-meet">Google Meet</option>
            <option value="zoom">Zoom</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input id="pub" type="checkbox" checked={form.is_published} onChange={e=>setForm(f=>({...f,is_published:e.target.checked}))} />
          <label htmlFor="pub" className="text-sm">Publish</label>
        </div>
        {/* Speakers */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold">Pembicara</label>
            <button
              type="button"
              onClick={() => setSpeakers(prev => [...prev, { name: '', title: '', avatar: null }])}
              className="text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50"
            >
              + Tambah Pembicara
            </button>
          </div>
          <div className="space-y-3">
            {speakers.map((sp, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border rounded-lg">
                <input
                  className="input"
                  placeholder="Nama Pembicara"
                  value={sp.name}
                  onChange={e=>{
                    const v = e.target.value; setSpeakers(s => s.map((x,i)=> i===idx? {...x, name:v}: x))
                  }}
                />
                <input
                  className="input"
                  placeholder="Jabatan / Title"
                  value={sp.title}
                  onChange={e=>{
                    const v = e.target.value; setSpeakers(s => s.map((x,i)=> i===idx? {...x, title:v}: x))
                  }}
                />
                <div className="flex items-center gap-2">
                  <input type="file" accept="image/*" onChange={e=>{
                    const file = e.target.files?.[0] || null
                    setSpeakers(s => s.map((x,i)=> i===idx? {...x, avatar:file}: x))
                  }} />
                  {sp.avatar_url && (
                    <img src={sp.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover border" />
                  )}
                  <button
                    type="button"
                    onClick={() => setSpeakers(s => s.filter((_,i)=> i!==idx))}
                    className="text-sm px-3 py-1.5 border rounded-lg hover:bg-red-50 text-red-600"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <button type="submit" disabled={submitting || slugAvailable === false} className="btn-primary px-4 py-2 rounded-lg">{submitting? 'Menyimpan...' : (editingId? 'Simpan Perubahan' : 'Buat Webinar')}</button>
          {editingId && (
            <button type="button" onClick={()=>{ setEditingId(null); setForm({ title:'', slug:'', description:'', start_time:'', end_time:'', is_published:false, recording_url:'' }); setSlugAvailable(null)}} className="ml-3 px-4 py-2 border rounded-lg">Batal</button>
          )}
        </div>
      </form>

      <div className="bg-white border rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-3">Daftar Webinar</h2>
        {loading ? (
          <div>Memuat...</div>
        ) : items.length === 0 ? (
          <div>Belum ada webinar.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Judul</th>
                  <th className="py-2 pr-4">Slug</th>
                  <th className="py-2 pr-4">Waktu</th>
                  <th className="py-2 pr-4">Publish</th>
                  <th className="py-2 pr-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.id} className="border-b">
                    <td className="py-2 pr-4">{it.title}</td>
                    <td className="py-2 pr-4">{it.slug}</td>
                    <td className="py-2 pr-4">{new Date(it.start_time).toLocaleString('id-ID')} - {new Date(it.end_time).toLocaleString('id-ID')}</td>
                    <td className="py-2 pr-4">{it.is_published ? 'Ya' : 'Tidak'}</td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-2">
                        <button onClick={()=>loadForEdit(it.id)} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">Edit</button>
                        <a href={`/admin/webinars/${it.id}/participants`} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">Peserta</a>
                        <a href={`/admin/webinars/${it.id}/certificates`} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">Sertifikat</a>
                        <button onClick={()=>handleDelete(it.id)} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-red-50 text-red-600">Hapus</button>
                      </div>
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


