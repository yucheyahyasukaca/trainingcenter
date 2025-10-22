'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useNotification } from '@/components/ui/Notification'
import { ProgramWithClasses, ClassWithTrainers } from '@/types'

export default function EnrollProgramPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { profile } = useAuth()
  const { addNotification } = useNotification()
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
      console.log('🔄 Fetching program with ID:', params.id)
      
      // First try simple query to check if program exists
      const { data: simpleData, error: simpleError } = await supabase
        .from('programs')
        .select('*')
        .eq('id', params.id)
        .single()

      console.log('📊 Simple query result:', { simpleData, simpleError })

      if (simpleError) {
        console.error('❌ Simple query error:', simpleError)
        throw simpleError
      }

      if (!simpleData) {
        console.log('⚠️ No program found with ID:', params.id)
        setError('Belum ada Kelas')
        return
      }

      // Check if program is published
      if ((simpleData as any).status !== 'published') {
        console.log('⚠️ Program exists but not published:', (simpleData as any).status)
        setError('Program tidak tersedia untuk pendaftaran')
        return
      }

      // Now try the full query with classes
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
        .single()

      console.log('📊 Full query result:', { data, error })

      if (error) {
        console.error('❌ Full query error:', error)
        // If full query fails, use simple data but check for classes
        console.log('⚠️ Using simple data due to full query error')
        
        // For simple data, we need to check classes separately
        const { data: classesData } = await supabase
          .from('classes')
          .select('id')
          .eq('program_id', params.id)
        
        if (!classesData || classesData.length === 0) {
          console.log('⚠️ Program has no available classes (simple data)')
          setError('Program ini belum memiliki kelas yang tersedia untuk pendaftaran')
          return
        }
        
        setProgram(simpleData)
        return
      }
      
      if (!data) {
        console.log('⚠️ No data from full query, using simple data')
        
        // For simple data, we need to check classes separately
        const { data: classesData } = await supabase
          .from('classes')
          .select('id')
          .eq('program_id', params.id)
        
        if (!classesData || classesData.length === 0) {
          console.log('⚠️ Program has no available classes (no data)')
          setError('Program ini belum memiliki kelas yang tersedia untuk pendaftaran')
          return
        }
        
        setProgram(simpleData)
        return
      }

      console.log('✅ Program found with classes:', (data as any).title)
      console.log('📚 Classes data:', (data as any).classes)
      console.log('📊 Classes count:', (data as any).classes?.length || 0)
      
      // Check if program has available classes
      if (!(data as any).classes || (data as any).classes.length === 0) {
        console.log('⚠️ Program has no available classes')
        setError('Program ini belum memiliki kelas yang tersedia untuk pendaftaran')
        return
      }
      
      setProgram(data)
    } catch (error) {
      console.error('❌ Error fetching program:', error)
      setError('Belum ada Kelas')
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
      // First, check if user has a participant record, create if not
      let participantId = profile.id
      
      const { data: existingParticipant, error: participantError } = await supabase
        .from('participants')
        .select('id')
        .eq('user_id', profile.id)
        .single()

      if (participantError && participantError.code !== 'PGRST116') {
        throw participantError
      }

      if (!existingParticipant) {
        // Create participant record
        const { data: newParticipant, error: createParticipantError } = await (supabase as any)
          .from('participants')
          .insert([{
            user_id: profile.id,
            name: profile.full_name || 'User',
            email: profile.email,
            phone: ''
            // status will use default value 'active' from schema
          }])
          .select('id')
          .single()

        if (createParticipantError) throw createParticipantError
        participantId = (newParticipant as any).id
      } else {
        participantId = (existingParticipant as any).id
      }

      // Check if user already enrolled in this program
      const { data: existingEnrollment, error: enrollmentCheckError } = await supabase
        .from('enrollments')
        .select('id, status')
        .eq('participant_id', participantId)
        .eq('program_id', program.id)
        .single()

      if (enrollmentCheckError && enrollmentCheckError.code !== 'PGRST116') {
        throw enrollmentCheckError
      }

      if (existingEnrollment) {
        const statusText = (existingEnrollment as any).status === 'pending' ? 'menunggu persetujuan' :
                          (existingEnrollment as any).status === 'approved' ? 'sudah disetujui' :
                          'ditolak'
        
        addNotification({
          type: 'warning',
          title: 'Sudah Terdaftar',
          message: `Anda sudah terdaftar di program ini dengan status ${statusText}. Silakan cek halaman "Kelas Terdaftar".`,
          duration: 8000
        })
        return
      }

      // Upload payment proof if needed
      let proofUrl = ''
      if (program.price > 0 && paymentProof) {
        const fileExt = paymentProof.name.split('.').pop()
        const fileName = `${profile.id}_${program.id}_${Date.now()}.${fileExt}`
        const filePath = `${profile.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(filePath, paymentProof)

        if (uploadError) throw uploadError

        // Use public URL directly (no signed URL needed)
        proofUrl = `https://supabase.garuda-21.com/storage/v1/object/public/payment-proofs/${filePath}`
      }

      // Create enrollment
      const enrollmentData = {
        program_id: program.id,
        class_id: selectedClass || null,
        participant_id: participantId,
        status: program.price === 0 ? 'approved' : 'pending',
        payment_status: program.price === 0 ? 'paid' : 'unpaid',
        amount_paid: program.price === 0 ? program.price : 0,
        payment_proof_url: proofUrl,
        notes: `Pendaftaran program ${program.title}${selectedClass ? ` - Kelas ${program.classes?.find(c => c.id === selectedClass)?.name}` : ''}`
      }

      console.log('Creating enrollment with data:', enrollmentData)
      console.log('Program price:', program.price, 'Is free:', program.price === 0)

      const { data: enrollmentResult, error: enrollError } = await (supabase as any)
        .from('enrollments')
        .insert([enrollmentData])
        .select()

      if (enrollError) {
        console.error('Enrollment error:', enrollError)
        throw enrollError
      }

      console.log('Enrollment created successfully:', enrollmentResult)
      
      // Verify the enrollment was created with correct status
      if (enrollmentResult && enrollmentResult.length > 0) {
        const createdEnrollment = enrollmentResult[0]
        console.log('Created enrollment status:', createdEnrollment.status)
        console.log('Created enrollment payment_status:', createdEnrollment.payment_status)
        
        // If it's a free program but enrollment is not approved, there might be an issue
        if (program.price === 0 && createdEnrollment.status !== 'approved') {
          console.warn('Free program enrollment was not auto-approved! Status:', createdEnrollment.status)
        }
      }

      // Show success notification
      addNotification({
        type: 'success',
        title: 'Pendaftaran Berhasil!',
        message: program.price === 0 
          ? 'Anda sudah terdaftar di program ini dan dapat langsung mengakses kelas.' 
          : 'Pendaftaran berhasil! Silakan tunggu konfirmasi dari admin untuk mengakses kelas.',
        duration: 6000
      })

      // Redirect based on program type
      setTimeout(() => {
        if (program.price === 0) {
          // For free programs, redirect directly to classes
          router.push(`/programs/${program.id}/classes`)
        } else {
          // For paid programs, redirect to my enrollments
          const returnUrl = `/programs`
          router.push(`/my-enrollments?return=${encodeURIComponent(returnUrl)}`)
        }
      }, 1200)
    } catch (error: any) {
      console.error('Error enrolling:', error)
      const errorMessage = 'Gagal mendaftar: ' + error.message
      setError(errorMessage)
      
      // Show error notification
      addNotification({
        type: 'error',
        title: 'Gagal Mendaftar',
        message: errorMessage,
        duration: 8000
      })
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
        const errorMsg = 'File harus berupa gambar (JPG, PNG) atau PDF'
        setError(errorMsg)
        addNotification({
          type: 'error',
          title: 'Format File Tidak Valid',
          message: errorMsg,
          duration: 5000
        })
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        const errorMsg = 'Ukuran file maksimal 5MB'
        setError(errorMsg)
        addNotification({
          type: 'error',
          title: 'File Terlalu Besar',
          message: errorMsg,
          duration: 5000
        })
        return
      }

      setPaymentProof(file)
      setError('')
      
      // Show success notification for file selection
      addNotification({
        type: 'success',
        title: 'File Terpilih',
        message: `File "${file.name}" berhasil dipilih`,
        duration: 3000
      })
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Belum ada Kelas</h1>
          <p className="text-gray-600 mb-4">Program yang Anda cari belum memiliki kelas yang tersedia untuk pendaftaran.</p>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 max-w-md mx-auto">
              <p className="text-sm text-red-600">Error: {error}</p>
            </div>
          )}
          <div className="space-x-4">
            <Link href="/programs" className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar Program
            </Link>
            <button 
              onClick={() => window.location.reload()} 
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/programs" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 text-sm">
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
                  <span>
                    {(program as any).registration_type === 'lifetime' || 
                     (program.start_date === program.end_date)
                      ? 'Lifetime' 
                      : `${formatDate(program.start_date)} - ${formatDate(program.end_date)}`
                    }
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium w-20">Peserta:</span>
                  <span>
                    {program.max_participants === null || program.max_participants === undefined 
                      ? 'Unlimited' 
                      : `Max ${program.max_participants} orang`
                    }
                  </span>
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
                      label: `${classItem.name} - ${formatDate(classItem.start_date)} (${classItem.current_participants}/${classItem.max_participants === null || classItem.max_participants === undefined ? 'Unlimited' : classItem.max_participants} peserta)`
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
                  href="/programs"
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
