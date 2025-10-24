'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
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
  program_id: string
  discount_percentage: number
  discount_amount: number
}

export default function EnrollProgramStep1Page({ params }: { params: { programId: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { profile, loading: authLoading } = useAuth()
  const { addNotification } = useNotification()
  
  const [program, setProgram] = useState<Program | null>(null)
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const programId = params.programId
  const referralCode = searchParams.get('referral')

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
        router.push('/register')
        return
      }
      fetchProgramData()
    }
  }, [profile, authLoading, programId])

  useEffect(() => {
    // Pre-fill form with profile data
    if (profile) {
      setFormData(prev => ({
        ...prev,
        full_name: profile.full_name || '',
        email: profile.email || ''
      }))
    }
  }, [profile])

  const fetchProgramData = async () => {
    try {
      setLoading(true)

      // Fetch program data
      const { data: programData, error: programError } = await supabase
        .from('programs')
        .select(`
          *,
          user_profiles!programs_trainer_id_fkey (
            full_name,
            email
          )
        `)
        .eq('id', programId)
        .single()

      if (programError) {
        console.error('Error fetching program:', programError)
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Program tidak ditemukan'
        })
        router.push('/programs')
        return
      }

      setProgram({
        ...(programData as any),
        trainer: (programData as any).user_profiles
      })

      // Fetch referral data if referral code exists
      if (referralCode) {
        const { data: referralData, error: referralError } = await supabase
          .from('referral_codes')
          .select('*')
          .eq('code', referralCode)
          .eq('program_id', programId)
          .eq('is_active', true)
          .single()

        if (!referralError && referralData) {
          setReferralData(referralData)
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal memuat data program'
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
    if (!program || !profile) return

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
        const { data: newParticipant, error: createParticipantError } = await (supabase as any)
          .from('participants')
          .insert({
            user_id: profile.id,
            name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            date_of_birth: null, // You might want to add this field
            gender: formData.gender,
            emergency_contact_name: formData.emergency_contact,
            emergency_contact_phone: formData.emergency_phone
          })
          .select('id')
          .single()

        if (createParticipantError) throw createParticipantError
        participantId = newParticipant.id
      } else {
        // Update existing participant
        const { error: updateParticipantError } = await (supabase as any)        
          .from('participants')
          .update({
            name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            gender: formData.gender,
            emergency_contact_name: formData.emergency_contact,
            emergency_contact_phone: formData.emergency_phone
          })
          .eq('id', (existingParticipant as any).id)

        if (updateParticipantError) throw updateParticipantError
        participantId = (existingParticipant as any).id
      }

      // Store form data in sessionStorage for next step
      sessionStorage.setItem('enrollmentFormData', JSON.stringify({
        ...formData,
        participant_id: participantId,
        program_id: programId,
        referral_code: referralCode,
        final_price: calculateFinalPrice()
      }))

      // Redirect to step 2
      router.push(`/enroll-program/${programId}/step2?referral=${referralCode || ''}`)

    } catch (error: any) {
      console.error('Error saving form data:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Gagal menyimpan data formulir'
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
          <p className="mt-4 text-gray-600">Memuat data program...</p>
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Program Tidak Ditemukan</h2>
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/programs" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Program
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Pendaftaran Program</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Progress Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Pendaftaran</h3>
              
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Isi Formulir Registrasi</p>
                    <p className="text-sm text-gray-600">Lengkapi data diri Anda</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 text-sm font-semibold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Konfirmasi & Link Referral</p>
                    <p className="text-sm text-gray-500">Review dan dapatkan link referral</p>
                  </div>
                </div>
              </div>

              {/* Program Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">{program.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{program.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Harga Normal:</span>
                    <span className="text-gray-900">Rp {program.price.toLocaleString('id-ID')}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Diskon:</span>
                      <span>- Rp {discount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                    <span>Total:</span>
                    <span className="text-lg text-blue-600">Rp {finalPrice.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {referralData && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                    <p className="text-xs text-green-700">
                      Kode Referral: <span className="font-mono font-bold">{referralData.code}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-600 font-semibold">Langkah 1</span>
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Isi Formulir Registrasi</h2>
                <p className="text-gray-600 mt-1">
                  Silakan lengkapi formulir di bawah dan pastikan data diisi dengan benar.
                </p>
                <p className="text-red-600 text-sm mt-1">* Wajib diisi.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informasi Personal */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('personal')}
                    className="w-full px-6 py-4 text-left flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-t-lg transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900">Informasi Personal</h3>
                    {accordionStates.personal ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                  
                  {accordionStates.personal && (
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Latar belakangmu *
                        </label>
                        <select
                          name="background"
                          value={formData.background}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Pilih latar belakang</option>
                          <option value="student">Mahasiswa</option>
                          <option value="fresh_graduate">Fresh Graduate</option>
                          <option value="professional">Profesional</option>
                          <option value="entrepreneur">Entrepreneur</option>
                          <option value="other">Lainnya</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nama lengkap *
                        </label>
                        <p className="text-sm text-gray-500 mb-2">
                          Nama ini akan digunakan untuk sertifikat kelulusan. Pastikan penulisannya sudah benar.
                        </p>
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Masukkan nama lengkap"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email aktif *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Masukkan email aktif"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Jenis kelamin *
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gender"
                              value="male"
                              checked={formData.gender === 'male'}
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            Laki-laki
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gender"
                              value="female"
                              checked={formData.gender === 'female'}
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            Perempuan
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Informasi Karier dan Pendidikan */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('career')}
                    className="w-full px-6 py-4 text-left flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900">Informasi Karier dan Pendidikan</h3>
                    {accordionStates.career ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                  
                  {accordionStates.career && (
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Informasi Karier
                        </label>
                        <textarea
                          name="career_info"
                          value={formData.career_info}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ceritakan tentang karier dan pengalaman kerja Anda"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pendidikan
                        </label>
                        <textarea
                          name="education"
                          value={formData.education}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ceritakan tentang latar belakang pendidikan Anda"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Informasi Lainnya */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('other')}
                    className="w-full px-6 py-4 text-left flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-b-lg transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900">Informasi Lainnya</h3>
                    {accordionStates.other ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                  
                  {accordionStates.other && (
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nomor Telepon
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Masukkan nomor telepon"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Alamat
                        </label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Masukkan alamat lengkap"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Kontak Darurat
                        </label>
                        <input
                          type="text"
                          name="emergency_contact"
                          value={formData.emergency_contact}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                          placeholder="Nama kontak darurat"
                        />
                        <input
                          type="tel"
                          name="emergency_phone"
                          value={formData.emergency_phone}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Nomor telepon kontak darurat"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Pernyataan Persetujuan */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Pernyataan Persetujuan Kebijakan Privacy *
                  </h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        name="consent_privacy"
                        checked={formData.consent_privacy}
                        onChange={handleInputChange}
                        className="mt-1"
                        required
                      />
                      <span className="text-sm text-gray-700">
                        Dengan mendaftar saya bersedia untuk memberikan informasi ini kepada tim GARUDA-21 Training Center hanya untuk kepentingan program sesuai dengan Privacy Policy kami.
                      </span>
                    </label>

                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        name="consent_contact"
                        checked={formData.consent_contact}
                        onChange={handleInputChange}
                        className="mt-1"
                        required
                      />
                      <span className="text-sm text-gray-700">
                        Saya bersedia dihubungi oleh tim GARUDA-21 Training Center terkait kebutuhan program.
                      </span>
                    </label>

                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        name="consent_terms"
                        checked={formData.consent_terms}
                        onChange={handleInputChange}
                        className="mt-1"
                        required
                      />
                      <span className="text-sm text-gray-700">
                        Saya menyetujui Terms of Use dan mengonfirmasi bahwa semua informasi yang saya sampaikan adalah benar adanya.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Menyimpan...' : 'Kirim formulir'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
