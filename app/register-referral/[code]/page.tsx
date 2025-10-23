'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { CheckCircle, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useNotification } from '@/components/ui/Notification'

interface Program {
  id: string
  title: string
  description: string
  category: string
  price: number
  start_date: string
  end_date: string
  max_participants: number
  current_participants: number
  trainer_id: string
  trainer: {
    full_name: string
    email: string
  }
}

interface ReferralData {
  id: string
  code: string
  description: string
  trainer_id: string
  discount_percentage: number
  discount_amount: number
}

export default function RegisterReferralPage({ params }: { params: { code: string } }) {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  const { addNotification } = useNotification()
  
  const [program, setProgram] = useState<Program | null>(null)
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const referralCode = params.code

  // Form data
  const [formData, setFormData] = useState({
    background: '',
    full_name: '',
    email: '',
    gender: '',
    career_info: '',
    education: '',
    phone: '',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
    consent_privacy: false,
    consent_contact: false,
    consent_terms: false
  })

  // Accordion states
  const [accordionStates, setAccordionStates] = useState({
    personal: true,
    career: false,
    other: false
  })

  useEffect(() => {
    if (!authLoading) {
      if (!profile) {
        // User not logged in, redirect to login
        router.push('/login')
        return
      }
      
      // Pre-fill form with profile data
      setFormData(prev => ({
        ...prev,
        full_name: profile.full_name || '',
        email: profile.email || ''
      }))
      
      validateReferralCode()
    }
  }, [profile, authLoading, referralCode])

  const validateReferralCode = async () => {
    try {
      setLoading(true)

      console.log('Validating referral code:', referralCode)

      // Get referral code details with program info
      const { data, error } = await supabase
        .from('referral_codes')
        .select(`
          *,
          user_profiles!referral_codes_trainer_id_fkey (
            full_name,
            email
          )
        `)
        .eq('code', referralCode)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching referral code:', error)
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Kode referral tidak ditemukan'
        })
        router.push('/programs')
        return
      }

      if (!data) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Kode referral tidak ditemukan'
        })
        router.push('/programs')
        return
      }

      // Check if referral code is expired
      if ((data as any).valid_until && new Date((data as any).valid_until) < new Date()) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Kode referral sudah expired'
        })
        router.push('/programs')
        return
      }

      // Check if referral code has reached max uses
      if ((data as any).max_uses && (data as any).current_uses >= (data as any).max_uses) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Kode referral sudah mencapai batas penggunaan'
        })
        router.push('/programs')
        return
      }

      // Set referral data
      setReferralData({
        id: (data as any).id,
        code: (data as any).code,
        description: (data as any).description,
        trainer_id: (data as any).trainer_id,
        discount_percentage: (data as any).discount_percentage || 0,
        discount_amount: (data as any).discount_amount || 0
      })

      // Get programs from this trainer - try different approaches
      let programsData = null
      let programsError = null

      // First try: programs with trainer_id from user_profiles
      const { data: programsData1, error: programsError1 } = await supabase
        .from('programs')
        .select('*')
        .eq('trainer_id', (data as any).trainer_id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(1)

      if (programsError1 || !programsData1 || programsData1.length === 0) {
        // Second try: get all published programs and show the first one
        const { data: allProgramsData, error: allProgramsError } = await supabase
          .from('programs')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(1)

        programsData = allProgramsData
        programsError = allProgramsError
      } else {
        programsData = programsData1
        programsError = programsError1
      }

      if (programsError) {
        console.error('Error fetching trainer programs:', programsError)
        // Fallback to a default program if no programs found
        setProgram({
          id: 'default-program',
          title: 'Program dengan Kode Referral',
          description: 'Program khusus dengan kode referral yang valid',
          category: 'General',
          price: 0, // Free program
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          max_participants: 50,
          current_participants: 0,
          trainer_id: (data as any).trainer_id,
          trainer: {
            full_name: (data as any).user_profiles?.full_name || 'Unknown Trainer',
            email: (data as any).user_profiles?.email || 'unknown@example.com'
          }
        })
      } else if (programsData && programsData.length > 0) {
        // Use the first program from the trainer
        const programData = programsData[0] as any
        setProgram({
          id: programData.id,
          title: programData.title,
          description: programData.description,
          category: programData.category,
          price: programData.price || 0,
          start_date: programData.start_date,
          end_date: programData.end_date,
          max_participants: programData.max_participants,
          current_participants: programData.current_participants,
          trainer_id: (data as any).trainer_id,
          trainer: {
            full_name: (data as any).user_profiles?.full_name || 'Unknown Trainer',
            email: (data as any).user_profiles?.email || 'unknown@example.com'
          }
        })
      } else {
        // No programs found, create a default free program
        setProgram({
          id: 'default-program',
          title: 'Program dengan Kode Referral',
          description: 'Program khusus dengan kode referral yang valid',
          category: 'General',
          price: 0, // Free program
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          max_participants: 50,
          current_participants: 0,
          trainer_id: (data as any).trainer_id,
          trainer: {
            full_name: (data as any).user_profiles?.full_name || 'Unknown Trainer',
            email: (data as any).user_profiles?.email || 'unknown@example.com'
          }
        })
      }

      console.log('Referral code validated:', data)

    } catch (error) {
      console.error('Error validating referral code:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal memvalidasi kode referral'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const toggleAccordion = (section: keyof typeof accordionStates) => {
    setAccordionStates(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const calculateFinalPrice = () => {
    if (!program) return 0
    if (!referralData) return program.price

    let finalPrice = program.price
    
    // Apply discount
    if (referralData.discount_percentage > 0) {
      finalPrice = finalPrice * (1 - referralData.discount_percentage / 100)
    }
    if (referralData.discount_amount > 0) {
      finalPrice = finalPrice - referralData.discount_amount
    }

    return Math.max(0, finalPrice)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!program || !referralData || !profile) return

    // Validate required fields
    if (!formData.full_name || !formData.email || !formData.gender) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Mohon lengkapi semua field yang wajib diisi'
      })
      return
    }

    if (!formData.consent_privacy || !formData.consent_contact || !formData.consent_terms) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Mohon centang semua pernyataan persetujuan'
      })
      return
    }

    try {
      setSubmitting(true)

      // Create or update participant record
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
        const { data: newParticipant, error: createParticipantError } = await supabase
          .from('participants')
          .insert({
            user_id: profile.id,
            name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            date_of_birth: null,
            gender: formData.gender,
            emergency_contact_name: formData.emergency_contact,
            emergency_contact_phone: formData.emergency_phone
          } as any)
          .select('id')
          .single()

        if (createParticipantError) throw createParticipantError
        participantId = (newParticipant as any).id
      } else {
        // Update existing participant
        const updateData = {
          name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          gender: formData.gender,
          emergency_contact_name: formData.emergency_contact,
          emergency_contact_phone: formData.emergency_phone
        }
        
        const { error: updateParticipantError } = await (supabase as any)
          .from('participants')
          .update(updateData)
          .eq('id', (existingParticipant as any).id)

        if (updateParticipantError) throw updateParticipantError
        participantId = (existingParticipant as any).id
      }

      // Create enrollment
      const enrollmentData = {
        program_id: program.id,
        participant_id: participantId,
        status: 'pending',
        payment_status: calculateFinalPrice() > 0 ? 'unpaid' : 'paid',
        amount_paid: 0,
        notes: `Referral Code: ${referralData.code}`
      }

      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .insert(enrollmentData as any)
        .select()
        .single()

      if (enrollmentError) {
        throw enrollmentError
      }

      // Create referral tracking
      const { error: trackingError } = await supabase
        .from('referral_tracking')
        .insert({
          referral_code_id: referralData.id,
          trainer_id: referralData.trainer_id,
          participant_id: participantId,
          enrollment_id: (enrollment as any).id,
          program_id: program.id,
          discount_applied: program.price - calculateFinalPrice(),
          commission_earned: 0,
          status: 'pending'
        } as any)

      if (trackingError) {
        console.error('Error creating referral tracking:', trackingError)
      }

      addNotification({
        type: 'success',
        title: 'Berhasil',
        message: 'Pendaftaran berhasil! Detail lebih lanjut telah dikirim ke email Anda.'
      })

      // Redirect to success page
      setTimeout(() => {
        router.push(`/register-referral/${referralCode}/success`)
      }, 1000)

    } catch (error: any) {
      console.error('Error completing enrollment:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Gagal menyelesaikan pendaftaran'
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memvalidasi kode referral...</p>
        </div>
      </div>
    )
  }

  if (!program || !referralData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Kode Referral Tidak Valid</h2>
          <Link href="/programs" className="text-blue-600 hover:text-blue-700">
            Kembali ke Daftar Program
          </Link>
        </div>
      </div>
    )
  }

  const finalPrice = calculateFinalPrice()
  const discount = program.price - finalPrice

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pendaftaran dengan Referral</h1>
          <p className="text-gray-600 mt-2">
            Lengkapi data diri Anda untuk melanjutkan pendaftaran dengan kode referral
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Program Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Program Detail</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{program.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{program.description}</p>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Harga Normal:</span>
                    <span className="font-medium">Rp {program.price.toLocaleString('id-ID')}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 mt-1">
                      <span>Diskon:</span>
                      <span className="font-medium">-Rp {discount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-lg font-semibold text-gray-900 mt-2 pt-2 border-t">
                    <span>Total:</span>
                    <span>Rp {finalPrice.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Kode Referral Valid</span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    Dari: {program.trainer.full_name}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Data Diri</h3>
              
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="border rounded-lg">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('personal')}
                    className="w-full px-4 py-3 text-left flex items-center justify-between bg-gray-50 rounded-t-lg hover:bg-gray-100"
                  >
                    <span className="font-medium text-gray-900">Informasi Pribadi</span>
                    {accordionStates.personal ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  
                  {accordionStates.personal && (
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nama Lengkap *
                          </label>
                          <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email *
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jenis Kelamin *
                          </label>
                          <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Pilih Jenis Kelamin</option>
                            <option value="male">Laki-laki</option>
                            <option value="female">Perempuan</option>
                            <option value="other">Lainnya</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nomor Telepon
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alamat
                        </label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Emergency Contact */}
                <div className="border rounded-lg">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('other')}
                    className="w-full px-4 py-3 text-left flex items-center justify-between bg-gray-50 rounded-t-lg hover:bg-gray-100"
                  >
                    <span className="font-medium text-gray-900">Kontak Darurat</span>
                    {accordionStates.other ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  
                  {accordionStates.other && (
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nama Kontak Darurat
                          </label>
                          <input
                            type="text"
                            name="emergency_contact"
                            value={formData.emergency_contact}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nomor Telepon Darurat
                          </label>
                          <input
                            type="tel"
                            name="emergency_phone"
                            value={formData.emergency_phone}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Consent */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Pernyataan Persetujuan</h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        name="consent_privacy"
                        checked={formData.consent_privacy}
                        onChange={handleInputChange}
                        required
                        className="mt-1"
                      />
                      <span className="text-sm text-gray-700">
                        Saya menyetujui penggunaan data pribadi saya sesuai dengan kebijakan privasi yang berlaku. *
                      </span>
                    </label>
                    
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        name="consent_contact"
                        checked={formData.consent_contact}
                        onChange={handleInputChange}
                        required
                        className="mt-1"
                      />
                      <span className="text-sm text-gray-700">
                        Saya menyetujui untuk dihubungi melalui email atau telepon untuk keperluan program. *
                      </span>
                    </label>
                    
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        name="consent_terms"
                        checked={formData.consent_terms}
                        onChange={handleInputChange}
                        required
                        className="mt-1"
                      />
                      <span className="text-sm text-gray-700">
                        Saya menyetujui syarat dan ketentuan yang berlaku. *
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Memproses...
                    </>
                  ) : (
                    'Daftar Program'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}