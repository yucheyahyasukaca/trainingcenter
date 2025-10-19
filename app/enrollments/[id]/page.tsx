'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Program, Participant } from '@/types'

export default function EditEnrollmentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [programs, setPrograms] = useState<Program[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [formData, setFormData] = useState({
    program_id: '',
    participant_id: '',
    status: 'pending' as 'pending' | 'approved' | 'rejected' | 'completed',
    payment_status: 'unpaid' as 'unpaid' | 'partial' | 'paid',
    amount_paid: 0,
    notes: '',
  })

  useEffect(() => {
    fetchPrograms()
    fetchParticipants()
    fetchEnrollment()
  }, [])

  async function fetchPrograms() {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('title')

      if (error) throw error
      setPrograms(data || [])
    } catch (error) {
      console.error('Error fetching programs:', error)
    }
  }

  async function fetchParticipants() {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('name')

      if (error) throw error
      setParticipants(data || [])
    } catch (error) {
      console.error('Error fetching participants:', error)
    }
  }

  async function fetchEnrollment() {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      setFormData({
        program_id: data.program_id,
        participant_id: data.participant_id,
        status: data.status,
        payment_status: data.payment_status,
        amount_paid: data.amount_paid,
        notes: data.notes || '',
      })
    } catch (error) {
      console.error('Error fetching enrollment:', error)
      alert('Gagal memuat data pendaftaran')
    } finally {
      setFetching(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('enrollments')
        .update(formData)
        .eq('id', params.id)

      if (error) throw error

      alert('Pendaftaran berhasil diupdate!')
      router.push('/enrollments')
    } catch (error: any) {
      console.error('Error updating enrollment:', error)
      alert('Gagal mengupdate pendaftaran: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount_paid' ? parseFloat(value) || 0 : value,
    }))
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data pendaftaran...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/enrollments" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Pendaftaran</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Pendaftaran</h1>
        <p className="text-gray-600 mt-1">Update informasi pendaftaran</p>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-3xl">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Program *</label>
              <select
                name="program_id"
                value={formData.program_id}
                onChange={handleChange}
                required
                className="input"
              >
                <option value="">Pilih Program</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title} - Rp {program.price.toLocaleString('id-ID')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Peserta *</label>
              <select
                name="participant_id"
                value={formData.participant_id}
                onChange={handleChange}
                required
                className="input"
              >
                <option value="">Pilih Peserta</option>
                {participants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.name} - {participant.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Status Pendaftaran *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="label">Status Pembayaran *</label>
              <select
                name="payment_status"
                value={formData.payment_status}
                onChange={handleChange}
                className="input"
              >
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div>
              <label className="label">Jumlah Dibayar (IDR)</label>
              <input
                type="number"
                name="amount_paid"
                value={formData.amount_paid}
                onChange={handleChange}
                min="0"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Catatan</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="input"
            />
          </div>

          <div className="flex items-center space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Update Pendaftaran'}
            </button>
            <Link href="/enrollments" className="btn-secondary">
              Batal
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}

