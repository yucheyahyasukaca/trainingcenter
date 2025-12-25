'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Upload, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatCurrency, compressImage } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useNotification } from '@/components/ui/Notification'
import ReferralCodeInput from '@/components/referral/ReferralCodeInput'
import { ProgramWithClasses, ClassWithTrainers } from '@/types'

export default function EnrollProgramPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { profile } = useAuth()
  const { addNotification } = useNotification()
  const [program, setProgram] = useState<ProgramWithClasses | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedClass, setSelectedClass] = useState('')
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [paymentProofUrl, setPaymentProofUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('') // Preview URL for compressed image
  const [error, setError] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [trainerClasses, setTrainerClasses] = useState<ClassWithTrainers[]>([])
  const [referralData, setReferralData] = useState<any>(null)
  const [finalPrice, setFinalPrice] = useState(0)

  useEffect(() => {
    fetchProgram()
  }, [params.id])

  useEffect(() => {
    // Check for referral code in URL parameters first
    const referral = searchParams.get('referral')
    if (referral) {
      setReferralCode(referral)
      sessionStorage.setItem('referralCode', referral)
      fetchTrainerClasses(referral)
    } else {
      // If no referral in URL, check sessionStorage
      const storedReferral = sessionStorage.getItem('referralCode')
      if (storedReferral) {
        setReferralCode(storedReferral)
        fetchTrainerClasses(storedReferral)
      }
    }
  }, [searchParams])

  useEffect(() => {
    // Update final price when program or referral data changes
    if (program) {
      if (referralData) {
        setFinalPrice(referralData.final_price)
      } else {
        setFinalPrice(program.price)
      }
    }
  }, [program, referralData])

  async function fetchTrainerClasses(referralCode: string) {
    try {
      // Find trainer by referral code (assuming referral code is trainer's email or ID)
      const { data: trainer, error: trainerError } = await supabase
        .from('trainers')
        .select('id, name, email')
        .or(`email.eq.${referralCode},id.eq.${referralCode}`)
        .single()

      if (trainerError || !trainer) {
        console.log('Trainer not found for referral code:', referralCode)
        return
      }

      // Find classes where this trainer is assigned
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select(`
          *,
          trainers:class_trainers(
            *,
            trainer:trainers(*)
          )
        `)
        .eq('program_id', params.id)
        .eq('trainers.trainer_id', (trainer as any).id)
        .order('start_date')

      if (classesError) {
        console.error('Error fetching trainer classes:', classesError)
        return
      }

      setTrainerClasses(classes || [])
      console.log('Found trainer classes:', classes)
    } catch (error) {
      console.error('Error fetching trainer classes:', error)
    }
  }

  const handleReferralApplied = (data: any) => {
    setReferralData(data)
    setReferralCode(data.referral_code)
  }

  const handleReferralRemoved = () => {
    setReferralData(null)
    setReferralCode('')
  }

  async function fetchProgram() {
    try {
      console.log('🔄 Fetching program with ID:', params.id)

      // Before anything else, ensure user's profile/participant data is completed.
      // If not complete, redirect to edit profile page.
      try {
        const { data: authUser } = await supabase.auth.getUser()
        const userId = authUser?.user?.id
        if (userId) {
          // Read user profile
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('full_name, email, phone, gender, address, provinsi')
            .eq('id', userId)
            .maybeSingle()

          // Read participant if exists
          const { data: participant } = await supabase
            .from('participants')
            .select('id, phone, address, gender, date_of_birth, education, education_status, employment_status, it_background, disability, program_source, provinsi')
            .eq('user_id', userId)
            .maybeSingle()

          const nameOk = !!(userProfile as any)?.full_name
          const emailOk = !!(userProfile as any)?.email
          const phoneOk = !!((userProfile as any)?.phone || (participant as any)?.phone)
          const genderOk = !!((userProfile as any)?.gender || (participant as any)?.gender)
          const addressOk = !!((userProfile as any)?.address || (participant as any)?.address)
          const provinsiOk = !!((userProfile as any)?.provinsi || (participant as any)?.provinsi)
          const dateOfBirthOk = !!(participant as any)?.date_of_birth
          const educationOk = !!(participant as any)?.education
          const educationStatusOk = !!(participant as any)?.education_status
          const employmentStatusOk = !!(participant as any)?.employment_status
          const itBackgroundOk = !!(participant as any)?.it_background
          const disabilityOk = !!(participant as any)?.disability
          const programSourceOk = !!(participant as any)?.program_source

          const isComplete = nameOk && emailOk && phoneOk && genderOk && addressOk && provinsiOk &&
            dateOfBirthOk && educationOk && educationStatusOk && employmentStatusOk &&
            itBackgroundOk && disabilityOk && programSourceOk

          if (!isComplete) {
            // Build list of missing fields
            const missing: string[] = []
            if (!nameOk) missing.push('Nama Lengkap')
            if (!emailOk) missing.push('Email')
            if (!phoneOk) missing.push('Nomor Telepon')
            if (!genderOk) missing.push('Jenis Kelamin')
            if (!addressOk) missing.push('Alamat')
            if (!provinsiOk) missing.push('Provinsi')
            if (!dateOfBirthOk) missing.push('Tanggal Lahir')
            if (!educationOk) missing.push('Pendidikan')
            if (!educationStatusOk) missing.push('Status Pendidikan')
            if (!employmentStatusOk) missing.push('Status Pekerjaan')
            if (!itBackgroundOk) missing.push('Latar Belakang IT')
            if (!disabilityOk) missing.push('Status Disabilitas')
            if (!programSourceOk) missing.push('Sumber Informasi Program')

            // Show notification about incomplete profile
            addNotification({
              type: 'warning',
              title: 'Data Profil Belum Lengkap',
              message: `Untuk mendaftar program, Anda harus melengkapi data profil terlebih dahulu. Silakan lengkapi data di halaman edit profil.`,
              duration: 5000
            })

            console.log('➡️ Redirecting to edit profile page to complete data first')
            console.log('📋 Missing fields:', missing.join(', '))

            setTimeout(() => {
              router.push(`/profile/edit?return=${encodeURIComponent(`/programs/${params.id}/enroll`)}`)
            }, 1500)
            return
          }
        }
      } catch (e) {
        // If profile check fails, redirect to edit profile page to be safe
        console.error('Error checking profile completeness:', e)
        addNotification({
          type: 'warning',
          title: 'Lengkapi Data Profil',
          message: 'Untuk mendaftar program, silakan lengkapi data profil Anda terlebih dahulu.',
          duration: 5000
        })

        setTimeout(() => {
          router.push(`/profile/edit?return=${encodeURIComponent(`/programs/${params.id}/enroll`)}`)
        }, 1500)
        return
      }

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

      // Now try the full query with classes - simplified approach
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          classes:classes(*)
        `)
        .eq('id', params.id)
        .single()

      console.log('📊 Full query result:', { data, error })

      if (error) {
        console.error('❌ Full query error:', error)
        console.log('⚠️ Using simple data due to full query error')

        // For simple data, we need to check classes separately
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('*')
          .eq('program_id', params.id)

        console.log('📚 Classes query result:', { classesData, classesError })

        if (classesError) {
          console.error('❌ Classes query error:', classesError)
        }

        if (!classesData || classesData.length === 0) {
          console.log('⚠️ Program has no available classes (simple data) - allowing enrollment without class selection')
        } else {
          console.log('✅ Found classes with simple query:', classesData.length)
        }

        setProgram({
          ...(simpleData as any),
          classes: classesData || []
        })
        return
      }

      if (!data) {
        console.log('⚠️ No data from full query, using simple data')

        // For simple data, we need to check classes separately
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('*')
          .eq('program_id', params.id)

        console.log('📚 Classes query result (no data):', { classesData, classesError })

        if (classesError) {
          console.error('❌ Classes query error (no data):', classesError)
        }

        if (!classesData || classesData.length === 0) {
          console.log('⚠️ Program has no available classes (no data) - allowing enrollment without class selection')
        } else {
          console.log('✅ Found classes with simple query (no data):', classesData.length)
        }

        setProgram({
          ...(simpleData as any),
          classes: classesData || []
        })
        return
      }

      console.log('✅ Program found with classes:', (data as any).title)
      console.log('📚 Classes data:', (data as any).classes)
      console.log('📊 Classes count:', (data as any).classes?.length || 0)

      // If we have classes, fetch trainer data for each class
      if ((data as any).classes && (data as any).classes.length > 0) {
        const classesWithTrainers = await Promise.all(
          (data as any).classes.map(async (classItem: any) => {
            const { data: trainers } = await supabase
              .from('class_trainers')
              .select(`
                *,
                trainer:trainers(*)
              `)
              .eq('class_id', classItem.id)

            return {
              ...classItem,
              trainers: trainers || []
            }
          })
        )

        setProgram({
          ...(data as any),
          classes: classesWithTrainers
        })
      } else {
        // Check if program has available classes - but don't block enrollment
        console.log('⚠️ Program has no available classes - allowing enrollment without class selection')
        setProgram(data)
      }
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
      // Upload payment proof if needed
      let proofUrl = ''
      if (program.price > 0 && paymentProof) {
        const fileExt = paymentProof.name.split('.').pop()
        const fileName = `${profile.id}_${program.id}_${Date.now()}.${fileExt}`
        const filePath = `${profile.id}/${fileName}`

        console.log('Uploading payment proof via proxy API...', filePath)

        const formData = new FormData()
        formData.append('file', paymentProof)
        formData.append('path', filePath)

        const uploadResponse = await fetch('/api/enrollment/upload-proof', {
          method: 'POST',
          body: formData
        })

        const responseText = await uploadResponse.text()
        let result
        try {
          result = JSON.parse(responseText)
        } catch (e) {
          console.error('SERVER ERROR (Non-JSON response):', responseText)
          throw new Error(`Server returned non-JSON error. Status: ${uploadResponse.status}`)
        }

        if (!uploadResponse.ok) {
          console.error('Upload proxy error:', result)
          throw new Error(result.error || `Upload failed with status ${uploadResponse.status}`)
        }

        console.log('Upload success:', result)
        proofUrl = result.url
      }

      // Create enrollment
      const enrollmentData = {
        program_id: program.id,
        class_id: selectedClass || null,
        participant_id: participantId,
        status: finalPrice === 0 ? 'approved' : 'pending',
        payment_status: finalPrice === 0 ? 'paid' : 'unpaid',
        amount_paid: finalPrice === 0 ? finalPrice : 0,
        payment_proof_url: proofUrl,
        referral_code_id: referralData?.referral_code_id || null,
        referral_discount: referralData?.discount_amount || 0,
        final_price: finalPrice,
        notes: `Pendaftaran program ${program.title}${selectedClass ? ` - Kelas ${program.classes?.find(c => c.id === selectedClass)?.name}` : ' - Menunggu kelas tersedia'}${referralData ? ` - Menggunakan kode referral ${referralData.referral_code}` : ''}`
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

      // Track referral if referral code was used
      if (referralData && enrollmentResult && enrollmentResult.length > 0) {
        try {
          const createdEnrollment = enrollmentResult[0]
          const { error: trackError } = await (supabase as any)
            .rpc('track_referral_enrollment', {
              p_referral_code_id: referralData.referral_code_id,
              p_enrollment_id: createdEnrollment.id,
              p_discount_amount: referralData.discount_amount,
              p_commission_amount: referralData.commission_amount
            })

          if (trackError) {
            console.error('Error tracking referral:', trackError)
          } else {
            console.log('Referral tracked successfully')
          }
        } catch (trackError) {
          console.error('Error in referral tracking:', trackError)
        }
      }

      // Verify the enrollment was created with correct status
      if (enrollmentResult && enrollmentResult.length > 0) {
        const createdEnrollment = enrollmentResult[0]
        console.log('Created enrollment status:', createdEnrollment.status)
        console.log('Created enrollment payment_status:', createdEnrollment.payment_status)

        // If it's a free program but enrollment is not approved, there might be an issue
        if (finalPrice === 0 && createdEnrollment.status !== 'approved') {
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      try {
        let fileToUpload = file
        // Helper to check if file is image for preview/compression
        if (file.type.startsWith('image/')) {
          // Compress image
          try {
            console.log('Compressing image...', file.size)
            // Force convert to JPEG for better compression to avoid Nginx 1MB limit
            fileToUpload = await compressImage(file, 800, 0.7, 'image/jpeg')
            console.log('Compressed image size:', fileToUpload.size)

            // Check if still too big (unlikely with JPEG 800px)
            if (fileToUpload.size > 1000 * 1024) {
              // Try one more time with lower quality
              fileToUpload = await compressImage(file, 600, 0.5, 'image/jpeg')
            }

            // Create preview URL from compressed file
            const objectUrl = URL.createObjectURL(fileToUpload)
            setPreviewUrl(objectUrl)
          } catch (compressError) {
            console.error('Error compressing image:', compressError)
            // Fallback to original file but still show preview
            const objectUrl = URL.createObjectURL(file)
            setPreviewUrl(objectUrl)
          }
        } else {
          setPreviewUrl('') // No preview for PDF
        }

        setPaymentProof(fileToUpload)
        setError('')

        // Show success notification for file selection
        addNotification({
          type: 'success',
          title: 'File Terpilih',
          message: `File "${file.name}" berhasil dipilih`,
          duration: 3000
        })
      } catch (err: any) {
        console.error('Error processing file:', err)
        setError('Gagal memproses file')
      }
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
        <div className="text-center py-4">
          <p className="text-sm text-gray-600">Memeriksa kelengkapan data profil...</p>
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
                      ((program as any).start_date === (program as any).end_date)
                      ? 'Lifetime'
                      : `${formatDate((program as any).start_date)} - ${formatDate((program as any).end_date)}`
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
                {referralData ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Harga Asli:</span>
                      <span className="text-sm line-through text-gray-500">
                        {formatCurrency(program.price)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-600">Diskon:</span>
                      <span className="text-sm text-green-600">
                        -{formatCurrency(referralData.discount_amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-lg font-semibold text-gray-900">Harga Final:</span>
                      <span className="text-2xl font-bold text-primary-600">
                        {formatCurrency(finalPrice)}
                      </span>
                    </div>
                    <p className="text-xs text-green-600">
                      Anda hemat {formatCurrency(referralData.discount_amount)}!
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">Harga:</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {formatCurrency(program.price)}
                    </span>
                  </div>
                )}
                {finalPrice === 0 && (
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

              {/* Referral Code Input */}
              <ReferralCodeInput
                programId={program.id}
                onReferralApplied={handleReferralApplied}
                onReferralRemoved={handleReferralRemoved}
                initialCode={referralCode}
              />

              {/* Class Selection */}
              {(() => {
                // Determine which classes to show: trainer classes if referral code exists, otherwise program classes
                const classesToShow = referralCode && trainerClasses.length > 0 ? trainerClasses : program.classes
                const hasClasses = classesToShow && classesToShow.length > 0

                if (hasClasses) {
                  return (
                    <div>
                      {referralCode && trainerClasses.length > 0 && (
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Kelas dari Trainer:</strong> Menampilkan kelas yang diajar oleh trainer yang direferensikan.
                          </p>
                        </div>
                      )}
                      <SearchableSelect
                        label="Pilih Kelas"
                        required
                        value={selectedClass}
                        onChange={setSelectedClass}
                        placeholder="Pilih kelas yang ingin diikuti"
                        searchPlaceholder="Cari kelas..."
                        options={classesToShow.map(classItem => ({
                          value: classItem.id,
                          label: `${classItem.name} - ${formatDate(classItem.start_date)} (${classItem.current_participants}/${classItem.max_participants === null || classItem.max_participants === undefined ? 'Unlimited' : classItem.max_participants} peserta)`
                        }))}
                      />
                    </div>
                  )
                } else {
                  return (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Info:</strong> {referralCode
                          ? 'Trainer yang direferensikan belum memiliki kelas yang tersedia untuk program ini.'
                          : 'Program ini belum memiliki kelas yang tersedia.'
                        } Anda tetap dapat mendaftar dan akan diberitahu ketika kelas tersedia.
                      </p>
                    </div>
                  )
                }
              })()}

              {/* Payment Proof Upload */}
              {finalPrice > 0 && (
                <div className="space-y-6">
                  {/* Payment Instructions & Bank Details */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <h3 className="text-md font-bold text-blue-900 mb-3">Instruksi Pembayaran</h3>
                    <p className="text-sm text-blue-800 mb-4">
                      Silakan transfer pembayaran ke salah satu rekening berikut atas nama <strong>PT REFORMASI INDONESIA MAJU</strong> (GARUDA-21):
                    </p>

                    <div className="grid grid-cols-1 gap-3 mb-4">


                      <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Bank Mandiri</p>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-bold text-gray-900 font-mono">1840057588889</p>
                          </div>
                          <p className="text-xs text-gray-600">PT REFORMASI INDONESIA MAJU</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-blue-800 bg-white/50 p-3 rounded-lg border border-blue-100">
                      <p className="font-semibold mb-1">Langkah selanjutnya:</p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-900">
                        <li>Transfer sejumlah <strong>{formatCurrency(finalPrice)}</strong></li>
                        <li>Simpan/Screenshot bukti transfer Anda</li>
                        <li>Upload bukti transfer pada form di bawah ini</li>
                        <li>Konfirmasi pendaftaran ke WhatsApp: <a href="https://wa.me/628112666456" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-blue-700">08112666456</a></li>
                      </ol>
                    </div>
                  </div>

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
                        <div className="text-sm text-green-600 flex items-start">
                          <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="break-all">{paymentProof.name}</span>
                        </div>
                        {previewUrl && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Preview:</p>
                            <img src={previewUrl} alt="Preview Bukti Bayar" className="max-w-full h-auto max-h-64 rounded-lg border border-gray-200" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Terms and Conditions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Syarat dan Ketentuan:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Program ini akan dimulai sesuai jadwal yang telah ditentukan</li>
                  <li>• Peserta diwajibkan mengikuti seluruh sesi program</li>
                  <li>• Sertifikat akan diberikan setelah menyelesaikan program</li>
                  {finalPrice > 0 && (
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
                  disabled={submitting || (finalPrice > 0 && !paymentProof) || (() => {
                    const classesToShow = referralCode && trainerClasses.length > 0 ? trainerClasses : program.classes
                    return classesToShow && classesToShow.length > 0 && !selectedClass
                  })()}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Mendaftar...' : 'Daftar Program'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div >
    </div >
  )
}
