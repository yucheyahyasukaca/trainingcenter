'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, X, Save, Video, Link as LinkIcon, Calendar, Clock, Play, ExternalLink } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/components/AuthProvider'

interface ClassResourcesManagementProps {
  classId: string
  className: string
  onClose: () => void
}

export function ClassResourcesManagement({ classId, className, onClose }: ClassResourcesManagementProps) {
  const addToast = useToast()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [moduleUrl, setModuleUrl] = useState('')
  const [faceToFaceSessions, setFaceToFaceSessions] = useState<any[]>([])
  const [sessionRecordings, setSessionRecordings] = useState<any[]>([])
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [showRecordingModal, setShowRecordingModal] = useState(false)
  const [editingSession, setEditingSession] = useState<any>(null)
  const [editingRecording, setEditingRecording] = useState<any>(null)
  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    session_date: '',
    session_time: '',
    duration_minutes: 60,
    meeting_platform: 'zoom',
    meeting_link: '',
    meeting_id: '',
    meeting_password: '',
    is_required: true,
    status: 'scheduled'
  })
  const [newRecording, setNewRecording] = useState({
    title: '',
    description: '',
    recording_url: '',
    recording_type: 'video',
    duration_minutes: null as number | null,
    file_size_mb: null as number | null,
    is_public: true
  })
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [classId])

  async function fetchData() {
    setLoading(true)
    try {
      // Fetch module URL
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('module_url')
        .eq('id', classId)
        .single()

      if (!classError && classData) {
        setModuleUrl(classData.module_url || '')
      }

      // Fetch face-to-face sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('face_to_face_sessions')
        .select('*')
        .eq('class_id', classId)
        .order('session_date', { ascending: true })
        .order('session_time', { ascending: true })

      if (!sessionsError) {
        setFaceToFaceSessions(sessions || [])
      }

      // Fetch recordings
      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id)
        const { data: recordings, error: recordingsError } = await supabase
          .from('session_recordings')
          .select('*')
          .in('session_id', sessionIds)
          .order('created_at', { ascending: false })

        if (!recordingsError) {
          setSessionRecordings(recordings || [])
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveModuleUrl() {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('classes')
        .update({ module_url: moduleUrl || null })
        .eq('id', classId)

      if (error) throw error

      addToast.success('URL modul pelatihan berhasil disimpan', 'Berhasil')
    } catch (error: any) {
      addToast.error('Gagal menyimpan URL modul', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveSession() {
    setLoading(true)
    try {
      const sessionData = {
        ...newSession,
        class_id: classId,
        created_by: profile?.id
      }

      if (editingSession) {
        const { error } = await supabase
          .from('face_to_face_sessions')
          .update(sessionData)
          .eq('id', editingSession.id)

        if (error) throw error
        addToast.success('Sesi berhasil diperbarui', 'Berhasil')
      } else {
        const { error } = await supabase
          .from('face_to_face_sessions')
          .insert([sessionData])

        if (error) throw error
        addToast.success('Sesi berhasil ditambahkan', 'Berhasil')
      }

      setShowSessionModal(false)
      setEditingSession(null)
      setNewSession({
        title: '',
        description: '',
        session_date: '',
        session_time: '',
        duration_minutes: 60,
        meeting_platform: 'zoom',
        meeting_link: '',
        meeting_id: '',
        meeting_password: '',
        is_required: true,
        status: 'scheduled'
      })
      fetchData()
    } catch (error: any) {
      addToast.error('Gagal menyimpan sesi', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteSession(sessionId: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus sesi ini?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('face_to_face_sessions')
        .delete()
        .eq('id', sessionId)

      if (error) throw error

      addToast.success('Sesi berhasil dihapus', 'Berhasil')
      fetchData()
    } catch (error: any) {
      addToast.error('Gagal menghapus sesi', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveRecording() {
    if (!selectedSessionId) {
      addToast.error('Pilih sesi terlebih dahulu', 'Error')
      return
    }

    setLoading(true)
    try {
      const recordingData = {
        ...newRecording,
        session_id: selectedSessionId,
        uploaded_by: profile?.id
      }

      if (editingRecording) {
        const { error } = await supabase
          .from('session_recordings')
          .update(recordingData)
          .eq('id', editingRecording.id)

        if (error) throw error
        addToast.success('Rekaman berhasil diperbarui', 'Berhasil')
      } else {
        const { error } = await supabase
          .from('session_recordings')
          .insert([recordingData])

        if (error) throw error
        addToast.success('Rekaman berhasil ditambahkan', 'Berhasil')
      }

      setShowRecordingModal(false)
      setEditingRecording(null)
      setSelectedSessionId(null)
      setNewRecording({
        title: '',
        description: '',
        recording_url: '',
        recording_type: 'video',
        duration_minutes: null,
        file_size_mb: null,
        is_public: true
      })
      fetchData()
    } catch (error: any) {
      addToast.error('Gagal menyimpan rekaman', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteRecording(recordingId: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus rekaman ini?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('session_recordings')
        .delete()
        .eq('id', recordingId)

      if (error) throw error

      addToast.success('Rekaman berhasil dihapus', 'Berhasil')
      fetchData()
    } catch (error: any) {
      addToast.error('Gagal menghapus rekaman', error.message)
    } finally {
      setLoading(false)
    }
  }

  function openEditSession(session: any) {
    setEditingSession(session)
    setNewSession({
      title: session.title,
      description: session.description || '',
      session_date: session.session_date,
      session_time: session.session_time,
      duration_minutes: session.duration_minutes || 60,
      meeting_platform: session.meeting_platform,
      meeting_link: session.meeting_link,
      meeting_id: session.meeting_id || '',
      meeting_password: session.meeting_password || '',
      is_required: session.is_required,
      status: session.status
    })
    setShowSessionModal(true)
  }

  function openEditRecording(recording: any) {
    setEditingRecording(recording)
    setSelectedSessionId(recording.session_id)
    setNewRecording({
      title: recording.title,
      description: recording.description || '',
      recording_url: recording.recording_url,
      recording_type: recording.recording_type,
      duration_minutes: recording.duration_minutes,
      file_size_mb: recording.file_size_mb,
      is_public: recording.is_public
    })
    setShowRecordingModal(true)
  }

  const platformNames: Record<string, string> = {
    zoom: 'Zoom',
    google_meet: 'Google Meet',
    microsoft_teams: 'Microsoft Teams',
    other: 'Platform Lain'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Kelola Resources Kelas</h2>
            <p className="text-sm text-gray-600 mt-1">{className}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Module URL Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              URL Modul Pelatihan
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Masukkan URL Google Drive atau Microsoft OneDrive untuk modul pelatihan
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                value={moduleUrl}
                onChange={(e) => setModuleUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <button
                onClick={handleSaveModuleUrl}
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Simpan
              </button>
            </div>
          </div>

          {/* Face-to-Face Sessions Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Video className="w-5 h-5" />
                Sesi Tatap Muka
              </h3>
              <button
                onClick={() => {
                  setEditingSession(null)
                  setNewSession({
                    title: '',
                    description: '',
                    session_date: '',
                    session_time: '',
                    duration_minutes: 60,
                    meeting_platform: 'zoom',
                    meeting_link: '',
                    meeting_id: '',
                    meeting_password: '',
                    is_required: true,
                    status: 'scheduled'
                  })
                  setShowSessionModal(true)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Tambah Sesi
              </button>
            </div>

            {faceToFaceSessions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Belum ada sesi tatap muka</p>
            ) : (
              <div className="space-y-3">
                {faceToFaceSessions.map((session) => {
                  const recordings = sessionRecordings.filter(r => r.session_id === session.id)
                  return (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{session.title}</h4>
                            {session.is_required && (
                              <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded">WAJIB</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-2">
                            <span>{formatDate(session.session_date)}</span>
                            <span>{formatTime(session.session_time)}</span>
                            <span>{platformNames[session.meeting_platform]}</span>
                            <span className="text-xs text-gray-500">
                              {recordings.length} rekaman
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedSessionId(session.id)
                              setNewRecording({
                                title: '',
                                description: '',
                                recording_url: '',
                                recording_type: 'video',
                                duration_minutes: null,
                                file_size_mb: null,
                                is_public: true
                              })
                              setShowRecordingModal(true)
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Tambah Rekaman"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditSession(session)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit Sesi"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Hapus Sesi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {recordings.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Rekaman:</p>
                          <div className="space-y-1">
                            {recordings.map((recording) => (
                              <div key={recording.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                <span className="text-gray-700">{recording.title}</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openEditRecording(recording)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRecording(recording.id)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingSession ? 'Edit Sesi Tatap Muka' : 'Tambah Sesi Tatap Muka'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Sesi *</label>
                <input
                  type="text"
                  value={newSession.title}
                  onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  value={newSession.description}
                  onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal *</label>
                  <input
                    type="date"
                    value={newSession.session_date}
                    onChange={(e) => setNewSession({ ...newSession, session_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Waktu *</label>
                  <input
                    type="time"
                    value={newSession.session_time}
                    onChange={(e) => setNewSession({ ...newSession, session_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (menit)</label>
                  <input
                    type="number"
                    value={newSession.duration_minutes}
                    onChange={(e) => setNewSession({ ...newSession, duration_minutes: parseInt(e.target.value) || 60 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform *</label>
                  <select
                    value={newSession.meeting_platform}
                    onChange={(e) => setNewSession({ ...newSession, meeting_platform: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    <option value="zoom">Zoom</option>
                    <option value="google_meet">Google Meet</option>
                    <option value="microsoft_teams">Microsoft Teams</option>
                    <option value="other">Platform Lain</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link Meeting *</label>
                <input
                  type="url"
                  value={newSession.meeting_link}
                  onChange={(e) => setNewSession({ ...newSession, meeting_link: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting ID</label>
                  <input
                    type="text"
                    value={newSession.meeting_id}
                    onChange={(e) => setNewSession({ ...newSession, meeting_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="text"
                    value={newSession.meeting_password}
                    onChange={(e) => setNewSession({ ...newSession, meeting_password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newSession.is_required}
                    onChange={(e) => setNewSession({ ...newSession, is_required: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Wajib diikuti</span>
                </label>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={newSession.status}
                    onChange={(e) => setNewSession({ ...newSession, status: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    <option value="scheduled">Terjadwal</option>
                    <option value="ongoing">Berlangsung</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSaveSession}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Simpan
                </button>
                <button
                  onClick={() => {
                    setShowSessionModal(false)
                    setEditingSession(null)
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recording Modal */}
      {showRecordingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingRecording ? 'Edit Rekaman' : 'Tambah Rekaman'}
            </h3>
            <div className="space-y-4">
              {!editingRecording && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sesi *</label>
                  <select
                    value={selectedSessionId || ''}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="">Pilih sesi</option>
                    {faceToFaceSessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.title} - {formatDate(session.session_date)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Rekaman *</label>
                <input
                  type="text"
                  value={newRecording.title}
                  onChange={(e) => setNewRecording({ ...newRecording, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  value={newRecording.description}
                  onChange={(e) => setNewRecording({ ...newRecording, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Rekaman *</label>
                <input
                  type="url"
                  value={newRecording.recording_url}
                  onChange={(e) => setNewRecording({ ...newRecording, recording_url: e.target.value })}
                  placeholder="https://drive.google.com/... atau https://youtube.com/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                  <select
                    value={newRecording.recording_type}
                    onChange={(e) => setNewRecording({ ...newRecording, recording_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                    <option value="transcript">Transkrip</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (menit)</label>
                  <input
                    type="number"
                    value={newRecording.duration_minutes || ''}
                    onChange={(e) => setNewRecording({ ...newRecording, duration_minutes: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ukuran (MB)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newRecording.file_size_mb || ''}
                    onChange={(e) => setNewRecording({ ...newRecording, file_size_mb: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newRecording.is_public}
                    onChange={(e) => setNewRecording({ ...newRecording, is_public: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Publik (dapat diakses semua peserta)</span>
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSaveRecording}
                  disabled={loading || !selectedSessionId}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Simpan
                </button>
                <button
                  onClick={() => {
                    setShowRecordingModal(false)
                    setEditingRecording(null)
                    setSelectedSessionId(null)
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

