'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Program, Participant } from '@/types'

export default function NewEnrollmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
  }, [])

  async function fetchPrograms() {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('status', 'published')
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
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setParticipants(data || [])
    } catch (error) {
      console.error('Error fetching participants:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('enrollments')
        .insert([formData])

      if (error) throw error

      alert('Pendaftaran berhasil ditambahkan!')
      router.push('/enrollments')
    } catch (error: any) {
      console.error('Error creating enrollment:', error)
      alert('Gagal menambahkan pendaftaran: ' + error.message)
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

  return (
    <div className="space-y-6">
      <div>
        <Link href="/enrollments" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Pendaftaran</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Tambah Pendaftaran Baru</h1>
        <p className="text-gray-600 mt-1">Daftarkan peserta ke program training</p>
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
                placeholder="0"
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
              placeholder="Catatan tambahan..."
            />
          </div>

          <div className="flex items-center space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Pendaftaran'}
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

