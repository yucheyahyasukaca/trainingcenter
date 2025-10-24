'use client'

import { useState, useEffect, useCallback } from 'react'
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
    // Personal Information
    background: '',
    full_name: '',
    email: '',
    gender: '',
    date_of_birth: '',
    whatsapp: '',
    province: '',
    city: '',
    district: '',
    
    // Career & Education
    education: '',
    education_status: '',
    employment_status: '',
    
    // Other Information
    it_background: '',
    disability: '',
    program_source: [] as string[],
    
    // Consent
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
  
  // Custom dropdown states
  const [isBackgroundDropdownOpen, setIsBackgroundDropdownOpen] = useState(false)
  const [backgroundSearchTerm, setBackgroundSearchTerm] = useState('')
  const [isEducationDropdownOpen, setIsEducationDropdownOpen] = useState(false)
  const [educationSearchTerm, setEducationSearchTerm] = useState('')
  
  // Location data
  const [provinces, setProvinces] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [districts, setDistricts] = useState<any[]>([])

  // Background options with descriptions
  const backgroundOptions = [
    {
      value: 'Mahasiswa/Fresh Graduate IT',
      label: 'Mahasiswa/Fresh Graduate IT',
      description: 'Mahasiswa, fresh graduate, job seekers, lulusan bootcamp/sertifikasi yang memiliki pondasi di bidang IT'
    },
    {
      value: 'Developer/Engineer/Praktisi IT',
      label: 'Developer/Engineer/Praktisi IT',
      description: 'Web/Mobile/Game Developer, Data Scientist/Analyst/Engineer, Cloud/DevOps Engineer, Cybersecurity Specialist, IT Support'
    },
    {
      value: 'Guru/Dosen/Peneliti/Akademisi',
      label: 'Guru/Dosen/Peneliti/Akademisi',
      description: 'Pengajar, peneliti, akademisi di bidang teknologi dan pendidikan'
    },
    {
      value: 'Pimpinan Teknologi',
      label: 'Pimpinan Teknologi',
      description: 'CTO, IT Director, Technology Manager, Head of Engineering'
    },
    {
      value: 'Pendiri Startup/Wirausahawan Teknologi',
      label: 'Pendiri Startup/Wirausahawan Teknologi',
      description: 'Founder, Co-founder, CEO startup teknologi, wirausahawan di bidang IT'
    },
    {
      value: 'Konsultan/Analis/Profesional Terkait Teknologi',
      label: 'Konsultan/Analis/Profesional Terkait Teknologi',
      description: 'IT Consultant, Business Analyst, System Analyst, Project Manager IT'
    },
    {
      value: 'Mahasiswa Non-IT',
      label: 'Mahasiswa Non-IT',
      description: 'Mahasiswa dari jurusan non-teknologi yang tertarik belajar IT'
    },
    {
      value: 'Fresh Graduate Non-IT',
      label: 'Fresh Graduate Non-IT',
      description: 'Lulusan baru dari jurusan non-teknologi yang ingin beralih ke bidang IT'
    },
    {
      value: 'Karyawan Swasta',
      label: 'Karyawan Swasta',
      description: 'Karyawan di perusahaan swasta yang ingin meningkatkan skill IT'
    },
    {
      value: 'PNS/ASN',
      label: 'PNS/ASN',
      description: 'Pegawai Negeri Sipil atau Aparatur Sipil Negara'
    },
    {
      value: 'Wirausaha/Entrepreneur',
      label: 'Wirausaha/Entrepreneur',
      description: 'Pengusaha atau entrepreneur yang ingin mengintegrasikan teknologi'
    },
    {
      value: 'Freelancer',
      label: 'Freelancer',
      description: 'Pekerja lepas yang ingin mengembangkan skill teknologi'
    },
    {
      value: 'Pensiunan',
      label: 'Pensiunan',
      description: 'Pensiunan yang ingin belajar teknologi untuk hobi atau bisnis'
    },
    {
      value: 'Ibu Rumah Tangga',
      label: 'Ibu Rumah Tangga',
      description: 'Ibu rumah tangga yang ingin belajar teknologi untuk keperluan pribadi atau bisnis'
    },
    {
      value: 'Pelajar/Siswa',
      label: 'Pelajar/Siswa',
      description: 'Siswa SMA/SMK yang tertarik dengan dunia teknologi'
    },
    {
      value: 'Lainnya',
      label: 'Lainnya',
      description: 'Kategori lain yang tidak termasuk dalam pilihan di atas'
    }
  ]

  // Education options with descriptions
  const educationOptions = [
    {
      value: 'SD',
      label: 'SD (Sekolah Dasar)',
      description: 'Pendidikan dasar 6 tahun (Kelas 1-6)'
    },
    {
      value: 'SMP',
      label: 'SMP (Sekolah Menengah Pertama)',
      description: 'Pendidikan menengah pertama 3 tahun (Kelas 7-9)'
    },
    {
      value: 'SMA',
      label: 'SMA (Sekolah Menengah Atas)',
      description: 'Pendidikan menengah atas umum 3 tahun (Kelas 10-12)'
    },
    {
      value: 'SMK',
      label: 'SMK (Sekolah Menengah Kejuruan)',
      description: 'Pendidikan menengah kejuruan 3 tahun dengan fokus keterampilan'
    },
    {
      value: 'SMA/SMK',
      label: 'SMA/SMK',
      description: 'Pendidikan menengah atas (umum atau kejuruan)'
    },
    {
      value: 'D1',
      label: 'D1 (Diploma 1)',
      description: 'Pendidikan vokasi 1 tahun'
    },
    {
      value: 'D2',
      label: 'D2 (Diploma 2)',
      description: 'Pendidikan vokasi 2 tahun'
    },
    {
      value: 'D3',
      label: 'D3 (Diploma 3)',
      description: 'Pendidikan vokasi 3 tahun'
    },
    {
      value: 'D4',
      label: 'D4 (Diploma 4)',
      description: 'Pendidikan vokasi 4 tahun setara dengan S1'
    },
    {
      value: 'Diploma',
      label: 'Diploma',
      description: 'Pendidikan vokasi (D1, D2, D3, atau D4)'
    },
    {
      value: 'S1',
      label: 'S1 (Sarjana)',
      description: 'Pendidikan tinggi strata 1 (4 tahun)'
    },
    {
      value: 'S2',
      label: 'S2 (Magister)',
      description: 'Pendidikan tinggi strata 2 (2 tahun setelah S1)'
    },
    {
      value: 'S3',
      label: 'S3 (Doktor)',
      description: 'Pendidikan tinggi strata 3 (3-4 tahun setelah S2)'
    },
    {
      value: 'Magister',
      label: 'Magister',
      description: 'Gelar magister (S2)'
    },
    {
      value: 'Doktor',
      label: 'Doktor',
      description: 'Gelar doktor (S3)'
    },
    {
      value: 'Profesi',
      label: 'Profesi',
      description: 'Pendidikan profesi (setelah S1)'
    },
    {
      value: 'Spesialis',
      label: 'Spesialis',
      description: 'Pendidikan spesialis (setelah profesi)'
    }
  ]

  // Program source options
  const programSourceOptions = [
    'Media Sosial (Instagram, Facebook, TikTok, dll)',
    'Website/Google Search',
    'Rekomendasi Teman/Keluarga',
    'Email Marketing',
    'Event/Seminar',
    'Referral Code',
    'Iklan Online',
    'Partner/Sponsor',
    'Lainnya'
  ]

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

  // Initialize search terms when form data changes
  useEffect(() => {
    if (formData.background) {
      const selectedOption = backgroundOptions.find(opt => opt.value === formData.background)
      if (selectedOption && selectedOption.label !== backgroundSearchTerm) {
        setBackgroundSearchTerm(selectedOption.label)
      }
    }
  }, [formData.background])

  useEffect(() => {
    if (formData.education) {
      const selectedOption = educationOptions.find(opt => opt.value === formData.education)
      if (selectedOption && selectedOption.label !== educationSearchTerm) {
        setEducationSearchTerm(selectedOption.label)
      }
    }
  }, [formData.education])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.background-dropdown-container')) {
        setIsBackgroundDropdownOpen(false)
      }
      if (!target.closest('.education-dropdown-container')) {
        setIsEducationDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
    
    if (name === 'program_source') {
      const checkbox = e.target as HTMLInputElement
      setFormData(prev => ({
        ...prev,
        program_source: checkbox.checked 
          ? [...prev.program_source, value]
          : prev.program_source.filter(item => item !== value)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }))
    }
  }

  const handleLocationChange = async (type: 'province' | 'city' | 'district', value: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: value,
      // Reset dependent fields
      ...(type === 'province' && { city: '', district: '' }),
      ...(type === 'city' && { district: '' })
    }))

    // Load dependent data
    if (type === 'province' && value) {
      // Load cities for selected province
      // This would typically call an API
      setCities([]) // Placeholder
    } else if (type === 'city' && value) {
      // Load districts for selected city
      setDistricts([]) // Placeholder
    }
  }

  // Filter background options based on search term
  const filteredBackgroundOptions = backgroundOptions.filter(option =>
    option.label.toLowerCase().includes(backgroundSearchTerm.toLowerCase()) ||
    option.description.toLowerCase().includes(backgroundSearchTerm.toLowerCase())
  )

  // Filter education options based on search term
  const filteredEducationOptions = educationOptions.filter(option =>
    option.label.toLowerCase().includes(educationSearchTerm.toLowerCase()) ||
    option.description.toLowerCase().includes(educationSearchTerm.toLowerCase())
  )


  // Handle education selection
  const handleEducationSelect = useCallback((option: any) => {
    setFormData(prev => ({
      ...prev,
      education: option.value
    }))
    setEducationSearchTerm(option.label)
    setIsEducationDropdownOpen(false)
  }, [])

  // Handle background input change
  const handleBackgroundInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setBackgroundSearchTerm(value)
    setIsBackgroundDropdownOpen(true)
    
    // If user clears the input, clear the form data too
    if (!value) {
      setFormData(prev => ({
        ...prev,
        background: ''
      }))
    }
  }

  // Handle background selection with useCallback
  const handleBackgroundSelect = useCallback((option: any) => {
    setFormData(prev => ({
      ...prev,
      background: option.value
    }))
    setBackgroundSearchTerm(option.label)
    setIsBackgroundDropdownOpen(false)
  }, [])

  // Handle education input change
  const handleEducationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEducationSearchTerm(value)
    setIsEducationDropdownOpen(true)
    
    // If user clears the input, clear the form data too
    if (!value) {
      setFormData(prev => ({
        ...prev,
        education: ''
      }))
    }
  }

  // Toggle accordion
  const toggleAccordion = useCallback((section: keyof typeof accordionStates) => {
    setAccordionStates(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }, [])

  // Check if specific section is complete
  const isSectionComplete = (section: string) => {
    if (section === 'personal') {
      return formData.full_name && formData.email && formData.background && formData.gender && 
             formData.date_of_birth && formData.whatsapp && formData.province
    } else if (section === 'career') {
      return formData.education && formData.education_status && formData.employment_status
    } else if (section === 'other') {
      return formData.it_background && formData.disability && formData.program_source.length > 0
    }
    return false
  }

  // Get missing fields for specific section
  const getMissingFields = (section: string) => {
    const missing = []
    if (section === 'personal') {
      if (!formData.full_name) missing.push('Nama Lengkap')
      if (!formData.email) missing.push('Email')
      if (!formData.background) missing.push('Latar Belakang')
      if (!formData.gender) missing.push('Jenis Kelamin')
      if (!formData.date_of_birth) missing.push('Tanggal Lahir')
      if (!formData.whatsapp) missing.push('No WhatsApp')
      if (!formData.province) missing.push('Provinsi')
    } else if (section === 'career') {
      if (!formData.education) missing.push('Pendidikan Terakhir')
      if (!formData.education_status) missing.push('Status Pendidikan')
      if (!formData.employment_status) missing.push('Status Pekerjaan')
    } else if (section === 'other') {
      if (!formData.it_background) missing.push('Pemahaman IT')
      if (!formData.disability) missing.push('Status Disabilitas')
      if (formData.program_source.length === 0) missing.push('Sumber Program')
    }
    return missing
  }

  // Check if all sections are complete
  const isAllSectionsComplete = () => {
    return isSectionComplete('personal') && isSectionComplete('career') && isSectionComplete('other')
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
    if (!formData.full_name || !formData.email || !formData.gender || !formData.background || !formData.date_of_birth || !formData.whatsapp || !formData.province) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Mohon lengkapi semua field yang wajib diisi pada tab Informasi Pribadi'
      })
      return
    }

    if (!formData.education || !formData.education_status || !formData.employment_status) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Mohon lengkapi semua field pada tab Informasi Karier dan Pendidikan'
      })
      return
    }

    if (!formData.it_background || !formData.disability || formData.program_source.length === 0) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Mohon lengkapi semua field pada tab Informasi Lainnya'
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
            phone: formData.whatsapp,
            address: `${formData.province}, ${formData.city}, ${formData.district}`,
            date_of_birth: formData.date_of_birth,
            gender: formData.gender,
            emergency_contact_name: '',
            emergency_contact_phone: ''
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
          phone: formData.whatsapp,
          address: `${formData.province}, ${formData.city}, ${formData.district}`,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          emergency_contact_name: '',
          emergency_contact_phone: ''
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
                {/* Accordion 1: Personal Information */}
                <div className="border rounded-lg">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('personal')}
                    className="w-full px-4 py-3 text-left flex items-center justify-between bg-gray-50 rounded-t-lg hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">Informasi Pribadi</span>
                      {isSectionComplete('personal') ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Lengkap
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {getMissingFields('personal').length} field kosong
                        </span>
                      )}
                    </div>
                    {accordionStates.personal ? (
                      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                  
                  {accordionStates.personal && (
                  <div className="space-y-4">
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors"
                        />
                      </div>
                      
                      <div className="relative background-dropdown-container">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Latar Belakang *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={backgroundSearchTerm}
                            onChange={handleBackgroundInputChange}
                            onFocus={() => setIsBackgroundDropdownOpen(true)}
                            placeholder="Pilih latar belakang"
                            required
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setIsBackgroundDropdownOpen(!isBackgroundDropdownOpen)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                          >
                            <svg
                              className={`h-5 w-5 transition-transform ${isBackgroundDropdownOpen ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                        
                        {isBackgroundDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredBackgroundOptions.length > 0 ? (
                              filteredBackgroundOptions.map((option, index) => (
                                <div
                                  key={index}
                                  onClick={() => handleBackgroundSelect(option)}
                                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900 text-sm">
                                    {option.label}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {option.description}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-gray-500 text-sm">
                                Tidak ada pilihan yang sesuai
                              </div>
                            )}
                          </div>
                        )}
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors"
                        >
                          <option value="">Pilih Jenis Kelamin</option>
                          <option value="male">Laki-laki</option>
                          <option value="female">Perempuan</option>
                          <option value="other">Lainnya</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tanggal Lahir *
                        </label>
                        <input
                          type="date"
                          name="date_of_birth"
                          value={formData.date_of_birth}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          No WhatsApp *
                        </label>
                        <input
                          type="tel"
                          name="whatsapp"
                          value={formData.whatsapp}
                          onChange={handleInputChange}
                          placeholder="08xxxxxxxxxx"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Provinsi *
                        </label>
                        <select
                          name="province"
                          value={formData.province}
                          onChange={(e) => handleLocationChange('province', e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors"
                        >
                          <option value="">Pilih Provinsi</option>
                          {/* Provinces would be loaded here */}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kabupaten *
                        </label>
                        <select
                          name="city"
                          value={formData.city}
                          onChange={(e) => handleLocationChange('city', e.target.value)}
                          required
                          disabled={!formData.province}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                        >
                          <option value="">Pilih Kabupaten</option>
                          {/* Cities would be loaded here */}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kota *
                        </label>
                        <select
                          name="district"
                          value={formData.district}
                          onChange={(e) => handleLocationChange('district', e.target.value)}
                          required
                          disabled={!formData.city}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                        >
                          <option value="">Pilih Kota</option>
                          {/* Districts would be loaded here */}
                        </select>
                      </div>
                    </div>
                  </div>
                  )}
                </div>

                {/* Accordion 2: Career & Education */}
                <div className="border rounded-lg">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('career')}
                    className="w-full px-4 py-3 text-left flex items-center justify-between bg-gray-50 rounded-t-lg hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">Karier & Pendidikan</span>
                      {isSectionComplete('career') ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Lengkap
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {getMissingFields('career').length} field kosong
                        </span>
                      )}
                    </div>
                    {accordionStates.career ? (
                      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                  
                  {accordionStates.career && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative education-dropdown-container">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pendidikan Terakhir *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={educationSearchTerm}
                            onChange={handleEducationInputChange}
                            onFocus={() => setIsEducationDropdownOpen(true)}
                            placeholder="Pilih pendidikan terakhir"
                            required
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setIsEducationDropdownOpen(!isEducationDropdownOpen)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                          >
                            <svg
                              className={`h-5 w-5 transition-transform ${isEducationDropdownOpen ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                        
                        {isEducationDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredEducationOptions.length > 0 ? (
                              filteredEducationOptions.map((option, index) => (
                                <div
                                  key={index}
                                  onClick={() => handleEducationSelect(option)}
                                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900 text-sm">
                                    {option.label}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {option.description}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-gray-500 text-sm">
                                Tidak ada pilihan yang sesuai
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status Pendidikan *
                        </label>
                        <select
                          name="education_status"
                          value={formData.education_status}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors"
                        >
                          <option value="">Pilih Status Pendidikan</option>
                          <option value="sedang">Sedang Menempuh Pendidikan</option>
                          <option value="tidak">Tidak Menempuh Pendidikan</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status Pekerjaan *
                        </label>
                        <select
                          name="employment_status"
                          value={formData.employment_status}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors"
                        >
                          <option value="">Pilih Status Pekerjaan</option>
                          <option value="bekerja">Sedang Bekerja</option>
                          <option value="tidak_bekerja">Tidak Bekerja</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  )}
                </div>

                {/* Accordion 3: Other Information */}
                <div className="border rounded-lg">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('other')}
                    className="w-full px-4 py-3 text-left flex items-center justify-between bg-gray-50 rounded-t-lg hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">Informasi Lainnya</span>
                      {isSectionComplete('other') ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Lengkap
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {getMissingFields('other').length} field kosong
                        </span>
                      )}
                    </div>
                    {accordionStates.other ? (
                      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                  
                  {accordionStates.other && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Apakah kamu memiliki pemahaman dasar/latar belakang di bidang IT? *
                        </label>
                        <select
                          name="it_background"
                          value={formData.it_background}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors"
                        >
                          <option value="">Pilih Jawaban</option>
                          <option value="ya">Ya</option>
                          <option value="tidak">Tidak</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Apakah kamu penyandang disabilitas? *
                        </label>
                        <select
                          name="disability"
                          value={formData.disability}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors"
                        >
                          <option value="">Pilih Jawaban</option>
                          <option value="ya">Ya</option>
                          <option value="tidak">Tidak</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dari mana kamu mengetahui program ini? * (bisa lebih dari 1)
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        {programSourceOptions.map((option, index) => (
                          <label key={index} className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
                            <input
                              type="checkbox"
                              name="program_source"
                              value={option}
                              checked={formData.program_source.includes(option)}
                              onChange={handleInputChange}
                              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              </div>

              {/* Consent Section - Always visible at the bottom */}
              <div className="mt-8 border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-4">Pernyataan Persetujuan</h4>
                
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-2 hover:bg-white rounded-md transition-colors">
                    <input
                      type="checkbox"
                      name="consent_privacy"
                      checked={formData.consent_privacy}
                      onChange={handleInputChange}
                      required
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Saya menyetujui penggunaan data pribadi saya sesuai dengan kebijakan privasi yang berlaku. *
                    </span>
                  </label>
                  
                  <label className="flex items-start gap-3 p-2 hover:bg-white rounded-md transition-colors">
                    <input
                      type="checkbox"
                      name="consent_contact"
                      checked={formData.consent_contact}
                      onChange={handleInputChange}
                      required
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Saya menyetujui untuk dihubungi melalui email atau telepon untuk keperluan program. *
                    </span>
                  </label>
                  
                  <label className="flex items-start gap-3 p-2 hover:bg-white rounded-md transition-colors">
                    <input
                      type="checkbox"
                      name="consent_terms"
                      checked={formData.consent_terms}
                      onChange={handleInputChange}
                      required
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Saya menyetujui syarat dan ketentuan yang berlaku. *
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !isAllSectionsComplete() || !formData.consent_privacy || !formData.consent_contact || !formData.consent_terms}
                  className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
                    submitting || !isAllSectionsComplete() || !formData.consent_privacy || !formData.consent_contact || !formData.consent_terms
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
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