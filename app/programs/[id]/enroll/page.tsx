'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { ProgramWithClasses, ClassWithTrainers } from '@/types'

export default function EnrollProgramPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { profile } = useAuth()
  const [program, setProgram] = useState<ProgramWithClasses | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedClass, setSelectedClass] = useState('')
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [paymentProofUrl, setPaymentProofUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProgram()
  }, [params.id])

  async function fetchProgram() {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          classes:classes(
            *,
            trainers:class_trainers(
              *,
              trainer:trainers(*)
            )
          )
        `)
        .eq('id', params.id)
        .eq('status', 'published')
        .single()

      if (error) throw error
      setProgram(data)
    } catch (error) {
      console.error('Error fetching program:', error)
      setError('Program tidak ditemukan atau tidak tersedia')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!program || !profile) return

    setSubmitting(true)
    setError('')

    try {
      // Upload payment proof if needed
      let proofUrl = ''
      if (program.price > 0 && paymentProof) {
        const fileExt = paymentProof.name.split('.').pop()
        const fileName = `${profile.id}_${program.id}_${Date.now()}.${fileExt}`
        const filePath = `payment-proofs/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(filePath, paymentProof)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(filePath)

        proofUrl = publicUrl
      }

      // Create enrollment
      const enrollmentData = {
        program_id: program.id,
        class_id: selectedClass || null,
        participant_id: profile.id,
        status: program.price === 0 ? 'approved' : 'pending',
        payment_status: program.price === 0 ? 'paid' : 'unpaid',
        amount_paid: program.price === 0 ? program.price : 0,
        payment_proof_url: proofUrl,
        notes: `Pendaftaran program ${program.title}${selectedClass ? ` - Kelas ${program.classes?.find(c => c.id === selectedClass)?.name}` : ''}`
      }

      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert([enrollmentData])

      if (enrollError) throw enrollError

      alert(program.price === 0 ? 'Pendaftaran berhasil! Anda sudah terdaftar di program ini.' : 'Pendaftaran berhasil! Silakan tunggu konfirmasi dari admin.')
      router.push('/enrollments')
    } catch (error: any) {
      console.error('Error enrolling:', error)
      setError('Gagal mendaftar: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        setError('File harus berupa gambar (JPG, PNG) atau PDF')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB')
        return
      }

      setPaymentProof(file)
      setError('')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Program Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-6">Program yang Anda cari tidak tersedia atau sudah tidak aktif.</p>
          <Link href="/enrollments" className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Daftar Program
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/enrollments" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali ke Daftar Program</span>
          <span className="sm:hidden">Kembali</span>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Daftar Program</h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">Isi form di bawah ini untuk mendaftar program training</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Program Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Informasi Program</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">{program.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{program.description}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium w-20">Kategori:</span>
                  <span>{program.category}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium w-20">Tanggal:</span>
                  <span>{formatDate(program.start_date)} - {formatDate(program.end_date)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium w-20">Peserta:</span>
                  <span>Max {program.max_participants} orang</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium w-20">Kelas:</span>
                  <span>{program.classes?.length || 0} kelas tersedia</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">Harga:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatCurrency(program.price)}
                  </span>
                </div>
                {program.price === 0 && (
                  <p className="text-sm text-green-600 mt-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Gratis - Otomatis terdaftar
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enrollment Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Form Pendaftaran</h2>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Class Selection */}
              {program.classes && program.classes.length > 0 && (
                <div>
                  <SearchableSelect
                    label="Pilih Kelas"
                    required
                    value={selectedClass}
                    onChange={setSelectedClass}
                    placeholder="Pilih kelas yang ingin diikuti"
                    searchPlaceholder="Cari kelas..."
                    options={program.classes.map(classItem => ({
                      value: classItem.id,
                      label: `${classItem.name} - ${formatDate(classItem.start_date)} (${classItem.current_participants}/${classItem.max_participants} peserta)`
                    }))}
                  />
                </div>
              )}

              {/* Payment Proof Upload */}
              {program.price > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bukti Pembayaran *
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="payment-proof"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                        >
                          <span>Upload file</span>
                          <input
                            id="payment-proof"
                            name="payment-proof"
                            type="file"
                            className="sr-only"
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                            required
                          />
                        </label>
                        <p className="pl-1">atau drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, PDF hingga 5MB
                      </p>
                    </div>
                  </div>
                  {paymentProof && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-600 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        File terpilih: {paymentProof.name}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Terms and Conditions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Syarat dan Ketentuan:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Program ini akan dimulai sesuai jadwal yang telah ditentukan</li>
                  <li>• Peserta diwajibkan mengikuti seluruh sesi program</li>
                  <li>• Sertifikat akan diberikan setelah menyelesaikan program</li>
                  {program.price > 0 && (
                    <li>• Pembayaran harus dilakukan sebelum program dimulai</li>
                  )}
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-4">
                <Link
                  href="/enrollments"
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Batal
                </Link>
                <button
                  type="submit"
                  disabled={submitting || (program.price > 0 && !paymentProof)}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Mendaftar...' : 'Daftar Program'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
