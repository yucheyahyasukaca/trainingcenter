'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, User, MapPin, Building, Mail, Phone, Briefcase, Search, ChevronDown, Camera, X } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/useToast'
import Image from 'next/image'

// Indonesia provinces data
const provinces = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Jambi',
  'Sumatera Selatan', 'Bangka Belitung', 'Bengkulu', 'Lampung', 'DKI Jakarta',
  'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur', 'Banten',
  'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Kalimantan Barat',
  'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara',
  'Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Tenggara',
  'Gorontalo', 'Sulawesi Barat', 'Maluku', 'Maluku Utara', 'Papua Barat', 'Papua'
]

// Indonesia kabupaten/kota data (comprehensive list)
const kabupatenKota = {
  'Aceh': [
    'Banda Aceh', 'Langsa', 'Lhokseumawe', 'Sabang', 'Subulussalam', 'Aceh Besar', 'Aceh Jaya', 'Aceh Selatan', 
    'Aceh Singkil', 'Aceh Tamiang', 'Aceh Tengah', 'Aceh Tenggara', 'Aceh Timur', 'Aceh Utara', 'Bener Meriah', 
    'Bireuen', 'Gayo Lues', 'Nagan Raya', 'Pidie', 'Pidie Jaya', 'Simeulue'
  ],
  'Sumatera Utara': [
    'Medan', 'Binjai', 'Pematangsiantar', 'Tebing Tinggi', 'Tanjungbalai', 'Sibolga', 'Padang Sidempuan', 
    'Gunungsitoli', 'Asahan', 'Batubara', 'Dairi', 'Deli Serdang', 'Humbang Hasundutan', 'Karo', 'Labuhanbatu', 
    'Labuhanbatu Selatan', 'Labuhanbatu Utara', 'Langkat', 'Mandailing Natal', 'Nias', 'Nias Barat', 'Nias Selatan', 
    'Nias Utara', 'Padang Lawas', 'Padang Lawas Utara', 'Pakpak Bharat', 'Samosir', 'Serdang Bedagai', 'Simalungun', 
    'Tapanuli Selatan', 'Tapanuli Tengah', 'Tapanuli Utara', 'Toba Samosir'
  ],
  'Sumatera Barat': [
    'Padang', 'Payakumbuh', 'Bukittinggi', 'Pariaman', 'Solok', 'Sawahlunto', 'Padang Panjang', 'Dharmasraya', 
    'Pasaman', 'Pasaman Barat', 'Pesisir Selatan', 'Sijunjung', 'Solok Selatan', 'Tanah Datar', 'Agam', 'Lima Puluh Kota', 
    'Kepulauan Mentawai', 'Padang Pariaman', 'Solok'
  ],
  'Riau': [
    'Pekanbaru', 'Dumai', 'Bengkalis', 'Rengat', 'Tembilahan', 'Indragiri Hilir', 'Indragiri Hulu', 'Kampar', 
    'Kepulauan Meranti', 'Kuantan Singingi', 'Pelalawan', 'Rokan Hilir', 'Rokan Hulu', 'Siak'
  ],
  'Kepulauan Riau': [
    'Batam', 'Tanjung Pinang', 'Bintan', 'Karimun', 'Kepulauan Anambas', 'Lingga', 'Natuna'
  ],
  'Jambi': [
    'Jambi', 'Sungai Penuh', 'Batanghari', 'Bungo', 'Kerinci', 'Merangin', 'Muaro Jambi', 'Sarolangun', 
    'Tanjung Jabung Barat', 'Tanjung Jabung Timur', 'Tebo'
  ],
  'Sumatera Selatan': [
    'Palembang', 'Prabumulih', 'Lubuklinggau', 'Pagar Alam', 'Banyuasin', 'Empat Lawang', 'Lahat', 'Muara Enim', 
    'Musi Banyuasin', 'Musi Rawas', 'Musi Rawas Utara', 'Ogan Ilir', 'Ogan Komering Ilir', 'Ogan Komering Ulu', 
    'Ogan Komering Ulu Selatan', 'Ogan Komering Ulu Timur', 'Penukal Abab Lematang Ilir'
  ],
  'Bangka Belitung': [
    'Pangkal Pinang', 'Bangka', 'Bangka Barat', 'Bangka Selatan', 'Bangka Tengah', 'Belitung', 'Belitung Timur'
  ],
  'Bengkulu': [
    'Bengkulu', 'Bengkulu Selatan', 'Bengkulu Tengah', 'Bengkulu Utara', 'Kaur', 'Kepahiang', 'Lebong', 
    'Mukomuko', 'Rejang Lebong', 'Seluma'
  ],
  'Lampung': [
    'Bandar Lampung', 'Metro', 'Lampung Barat', 'Lampung Selatan', 'Lampung Tengah', 'Lampung Timur', 
    'Lampung Utara', 'Mesuji', 'Pesawaran', 'Pringsewu', 'Tanggamus', 'Tulang Bawang', 'Tulang Bawang Barat', 
    'Way Kanan', 'Pesisir Barat'
  ],
  'DKI Jakarta': [
    'Jakarta Pusat', 'Jakarta Utara', 'Jakarta Barat', 'Jakarta Selatan', 'Jakarta Timur', 'Kepulauan Seribu'
  ],
  'Jawa Barat': [
    'Bandung', 'Bekasi', 'Bogor', 'Cirebon', 'Depok', 'Sukabumi', 'Tasikmalaya', 'Banjar', 'Cimahi', 'Cirebon', 
    'Bandung', 'Bandung Barat', 'Bekasi', 'Bogor', 'Ciamis', 'Cianjur', 'Cirebon', 'Garut', 'Indramayu', 'Karawang', 
    'Kuningan', 'Majalengka', 'Pangandaran', 'Purwakarta', 'Subang', 'Sukabumi', 'Sumedang', 'Tasikmalaya'
  ],
  'Jawa Tengah': [
    'Semarang', 'Surakarta', 'Salatiga', 'Magelang', 'Pekalongan', 'Tegal', 'Banjarnegara', 'Banyumas', 'Batang', 
    'Blora', 'Boyolali', 'Brebes', 'Cilacap', 'Demak', 'Grobogan', 'Jepara', 'Karanganyar', 'Kebumen', 'Kendal', 
    'Klaten', 'Kudus', 'Pati', 'Pemalang', 'Purbalingga', 'Purworejo', 'Rembang', 'Sragen', 'Sukoharjo', 'Temanggung', 
    'Wonogiri', 'Wonosobo'
  ],
  'DI Yogyakarta': [
    'Yogyakarta', 'Bantul', 'Gunung Kidul', 'Kulon Progo', 'Sleman'
  ],
  'Jawa Timur': [
    'Surabaya', 'Malang', 'Kediri', 'Blitar', 'Mojokerto', 'Pasuruan', 'Probolinggo', 'Batu', 'Bangkalan', 
    'Banyuwangi', 'Blitar', 'Bojonegoro', 'Bondowoso', 'Gresik', 'Jember', 'Jombang', 'Kediri', 'Lamongan', 
    'Lumajang', 'Madiun', 'Magetan', 'Nganjuk', 'Ngawi', 'Pacitan', 'Pamekasan', 'Pasuruan', 'Ponorogo', 
    'Probolinggo', 'Sampang', 'Sidoarjo', 'Situbondo', 'Sumenep', 'Trenggalek', 'Tuban', 'Tulungagung'
  ],
  'Banten': [
    'Serang', 'Tangerang', 'Cilegon', 'Tangerang Selatan', 'Lebak', 'Pandeglang', 'Serang', 'Tangerang'
  ],
  'Bali': [
    'Denpasar', 'Badung', 'Bangli', 'Buleleng', 'Gianyar', 'Jembrana', 'Karangasem', 'Klungkung', 'Tabanan'
  ],
  'Nusa Tenggara Barat': [
    'Mataram', 'Bima', 'Dompu', 'Lombok Barat', 'Lombok Tengah', 'Lombok Timur', 'Lombok Utara', 'Sumbawa', 
    'Sumbawa Barat', 'Bima'
  ],
  'Nusa Tenggara Timur': [
    'Kupang', 'Ende', 'Flores Timur', 'Kupang', 'Malaka', 'Manggarai', 'Manggarai Barat', 'Manggarai Timur', 
    'Nagekeo', 'Ngada', 'Rote Ndao', 'Sabu Raijua', 'Sikka', 'Sumba Barat', 'Sumba Barat Daya', 'Sumba Tengah', 
    'Sumba Timur', 'Timor Tengah Selatan', 'Timor Tengah Utara'
  ],
  'Kalimantan Barat': [
    'Pontianak', 'Singkawang', 'Bengkayang', 'Kapuas Hulu', 'Kayong Utara', 'Ketapang', 'Kubu Raya', 'Landak', 
    'Melawi', 'Mempawah', 'Sambas', 'Sanggau', 'Sintang'
  ],
  'Kalimantan Tengah': [
    'Palangka Raya', 'Barito Selatan', 'Barito Timur', 'Barito Utara', 'Gunung Mas', 'Kapuas', 'Katingan', 
    'Kotawaringin Barat', 'Kotawaringin Timur', 'Lamandau', 'Murung Raya', 'Pulang Pisau', 'Sukamara', 'Seruyan'
  ],
  'Kalimantan Selatan': [
    'Banjarmasin', 'Banjar Baru', 'Balangan', 'Hulu Sungai Selatan', 'Hulu Sungai Tengah', 'Hulu Sungai Utara', 
    'Kotabaru', 'Tabalong', 'Tanah Bumbu', 'Tanah Laut', 'Tapin', 'Barito Kuala'
  ],
  'Kalimantan Timur': [
    'Samarinda', 'Balikpapan', 'Bontang', 'Berau', 'Kutai Barat', 'Kutai Kartanegara', 'Kutai Timur', 'Penajam Paser Utara', 
    'Paser', 'Mahakam Ulu'
  ],
  'Kalimantan Utara': [
    'Tanjung Selor', 'Bulungan', 'Malinau', 'Nunukan', 'Tana Tidung'
  ],
  'Sulawesi Utara': [
    'Manado', 'Bitung', 'Kotamobagu', 'Tomohon', 'Bolaang Mongondow', 'Bolaang Mongondow Selatan', 'Bolaang Mongondow Timur', 
    'Bolaang Mongondow Utara', 'Kepulauan Sangihe', 'Kepulauan Siau Tagulandang Biaro', 'Kepulauan Talaud', 'Minahasa', 
    'Minahasa Selatan', 'Minahasa Tenggara', 'Minahasa Utara'
  ],
  'Sulawesi Tengah': [
    'Palu', 'Banggai', 'Banggai Kepulauan', 'Banggai Laut', 'Buol', 'Donggala', 'Morowali', 'Morowali Utara', 
    'Parigi Moutong', 'Poso', 'Sigi', 'Tojo Una-Una', 'Tolitoli'
  ],
  'Sulawesi Selatan': [
    'Makassar', 'Parepare', 'Palopo', 'Bantaeng', 'Barru', 'Bone', 'Bulukumba', 'Enrekang', 'Gowa', 'Jeneponto', 
    'Kepulauan Selayar', 'Luwu', 'Luwu Timur', 'Luwu Utara', 'Maros', 'Pangkajene dan Kepulauan', 'Pinrang', 
    'Sidenreng Rappang', 'Sinjai', 'Soppeng', 'Takalar', 'Tana Toraja', 'Toraja Utara', 'Wajo'
  ],
  'Sulawesi Tenggara': [
    'Kendari', 'Bau-Bau', 'Bombana', 'Buton', 'Buton Selatan', 'Buton Tengah', 'Buton Utara', 'Kolaka', 
    'Kolaka Timur', 'Kolaka Utara', 'Konawe', 'Konawe Kepulauan', 'Konawe Selatan', 'Konawe Utara', 'Muna', 
    'Muna Barat', 'Wakatobi'
  ],
  'Gorontalo': [
    'Gorontalo', 'Boalemo', 'Bone Bolango', 'Gorontalo', 'Gorontalo Utara', 'Pohuwato'
  ],
  'Sulawesi Barat': [
    'Mamuju', 'Majene', 'Mamasa', 'Mamuju Tengah', 'Mamuju Utara', 'Polewali Mandar'
  ],
  'Maluku': [
    'Ambon', 'Tual', 'Buru', 'Buru Selatan', 'Kepulauan Aru', 'Kepulauan Tanimbar', 'Maluku Barat Daya', 
    'Maluku Tengah', 'Maluku Tenggara', 'Seram Bagian Barat', 'Seram Bagian Timur'
  ],
  'Maluku Utara': [
    'Sofifi', 'Ternate', 'Tidore Kepulauan', 'Halmahera Barat', 'Halmahera Tengah', 'Halmahera Utara', 
    'Halmahera Selatan', 'Halmahera Timur', 'Kepulauan Sula', 'Pulau Morotai', 'Pulau Taliabu'
  ],
  'Papua Barat': [
    'Manokwari', 'Sorong', 'Fakfak', 'Kaimana', 'Manokwari', 'Maybrat', 'Pegunungan Arfak', 'Raja Ampat', 
    'Sorong', 'Sorong Selatan', 'Tambrauw', 'Teluk Bintuni', 'Teluk Wondama'
  ],
  'Papua': [
    'Jayapura', 'Merauke', 'Biak Numfor', 'Jayapura', 'Keerom', 'Kepulauan Yapen', 'Mamberamo Raya', 
    'Mamberamo Tengah', 'Mappi', 'Mimika', 'Nabire', 'Nduga', 'Paniai', 'Pegunungan Bintang', 'Puncak', 
    'Puncak Jaya', 'Sarmi', 'Supiori', 'Tolikara', 'Waropen', 'Yahukimo', 'Yalimo'
  ]
}

// Sectors data
const sectors = [
  'Pendidikan',
  'Kesehatan', 
  'Teknologi Informasi',
  'Keuangan & Perbankan',
  'Pemerintahan',
  'Bisnis & Manajemen',
  'Pertanian',
  'Industri',
  'Pariwisata',
  'Hukum',
  'Media & Komunikasi',
  'Lainnya'
]

export default function EditTrainerProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const router = useRouter()
  const addToast = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    instansi: '',
    alamat_instansi: '',
    alamat_pribadi: '',
    provinsi: '',
    kabupaten: '',
    sektor: '',
    whatsapp: ''
  })
  const [provinceSearch, setProvinceSearch] = useState('')
  const [kabupatenSearch, setKabupatenSearch] = useState('')
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false)
  const [showKabupatenDropdown, setShowKabupatenDropdown] = useState(false)
  const provinceRef = useRef<HTMLDivElement>(null)
  const kabupatenRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: (profile as any).phone || '',
        instansi: (profile as any).instansi || '',
        alamat_instansi: (profile as any).alamat_instansi || '',
        alamat_pribadi: (profile as any).alamat_pribadi || '',
        provinsi: (profile as any).provinsi || '',
        kabupaten: (profile as any).kabupaten || '',
        sektor: (profile as any).sektor || '',
        whatsapp: (profile as any).whatsapp || ''
      })
      setProvinceSearch((profile as any).provinsi || '')
      setKabupatenSearch((profile as any).kabupaten || '')
      setAvatarPreview(profile.avatar_url || null)
    }
  }, [profile])

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (provinceRef.current && !provinceRef.current.contains(event.target as Node)) {
        setShowProvinceDropdown(false)
      }
      if (kabupatenRef.current && !kabupatenRef.current.contains(event.target as Node)) {
        setShowKabupatenDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Filter provinces based on search
  const filteredProvinces = provinces.filter(province =>
    province.toLowerCase().includes(provinceSearch.toLowerCase())
  )

  // Get kabupaten options based on selected province
  const getKabupatenOptions = () => {
    if (!formData.provinsi) return []
    return kabupatenKota[formData.provinsi as keyof typeof kabupatenKota] || []
  }

  // Filter kabupaten based on search and selected province
  const filteredKabupaten = getKabupatenOptions().filter(kabupaten =>
    kabupaten.toLowerCase().includes(kabupatenSearch.toLowerCase())
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleProvinceSelect = (province: string) => {
    setFormData(prev => ({
      ...prev,
      provinsi: province,
      kabupaten: '' // Reset kabupaten when province changes
    }))
    setProvinceSearch(province)
    setKabupatenSearch('')
    setShowProvinceDropdown(false)
  }

  const handleKabupatenSelect = (kabupaten: string) => {
    setFormData(prev => ({
      ...prev,
      kabupaten: kabupaten
    }))
    setKabupatenSearch(kabupaten)
    setShowKabupatenDropdown(false)
  }

  const handleProvinceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowProvinceDropdown(false)
    }
  }

  const handleKabupatenKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowKabupatenDropdown(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      addToast.error('Format file tidak valid. Silakan upload file gambar.', 'Error!')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast.error('Ukuran file terlalu besar. Maksimal 5MB.', 'Error!')
      return
    }

    setUploading(true)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

            // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile?.id}_${Date.now()}.${fileExt}`
      // Use user_id as folder name to match RLS policy
      const filePath = `${profile?.id}/avatars/${fileName}`

      let bucketName = 'payment-proofs'
      let avatarUrl = ''
      
      // Upload to payment-proofs bucket (using user_id folder to match RLS)
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })
      
      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      // Get public URL
      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath)
      avatarUrl = data.publicUrl

      // Update profile with avatar URL
      const { error: updateError } = await (supabase as any)
        .from('user_profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', profile?.id)

      if (updateError) throw updateError

      // Also update trainers table if user is a trainer
      const { data: trainerData } = await supabase
        .from('trainers')
        .select('id')
        .eq('user_id', profile?.id)
        .single()

      if (trainerData) {
        await supabase
          .from('trainers')
          .update({ avatar_url: avatarUrl })
          .eq('id', trainerData.id)
      }

      addToast.success('Foto profil berhasil diupload.', 'Berhasil!')
      await refreshProfile()

    } catch (error) {
      console.error('Error uploading avatar:', error)
      addToast.error('Gagal mengupload foto profil. Silakan coba lagi.', 'Error!')
      setAvatarPreview(profile?.avatar_url || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    try {
      const { error } = await (supabase as any)
        .from('user_profiles')
        .update({ avatar_url: null })
        .eq('id', profile?.id)

      if (error) throw error

      // Also update trainers table if user is a trainer
      const { data: trainerData } = await supabase
        .from('trainers')
        .select('id')
        .eq('user_id', profile?.id)
        .single()

      if (trainerData) {
        await supabase
          .from('trainers')
          .update({ avatar_url: null })
          .eq('id', trainerData.id)
      }

      setAvatarPreview(null)
      addToast.success('Foto profil berhasil dihapus.', 'Berhasil!')
      await refreshProfile()

    } catch (error) {
      console.error('Error removing avatar:', error)
      addToast.error('Gagal menghapus foto profil.', 'Error!')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted!', formData)
    setSaving(true)

    try {
      console.log('Updating profile for user:', profile?.id)
      
      // First try to update with all fields
      const updateData: any = {
        full_name: formData.full_name,
        phone: formData.phone,
        updated_at: new Date().toISOString()
      }

      // Only add new fields if they have values to avoid database errors
      if (formData.instansi) updateData.instansi = formData.instansi
      if (formData.alamat_instansi) updateData.alamat_instansi = formData.alamat_instansi
      if (formData.alamat_pribadi) updateData.alamat_pribadi = formData.alamat_pribadi
      if (formData.provinsi) updateData.provinsi = formData.provinsi
      if (formData.kabupaten) updateData.kabupaten = formData.kabupaten
      if (formData.sektor) updateData.sektor = formData.sektor
      if (formData.whatsapp) updateData.whatsapp = formData.whatsapp

      console.log('Update data:', updateData)

      const { error } = await (supabase as any)
        .from('user_profiles')
        .update(updateData)
        .eq('id', profile?.id)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Profile updated successfully!')
      addToast.success('Profil trainer berhasil diperbarui.', 'Berhasil!')

      // Refresh profile data
      await refreshProfile()
      
      // Redirect to view profile page
      router.push('/trainer-profile/view')
      
    } catch (err) {
      console.error('Error updating profile:', err)
      addToast.error('Gagal memperbarui profil. Silakan coba lagi.', 'Error!')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat profil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-8">
          <Link 
            href="/trainer-profile/view" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Profil
          </Link>
          
          {/* Page Title */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Profil Trainer</h1>
              <p className="text-gray-600">Ubah informasi profil dan data pribadi Anda</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Profile Photo Upload */}
            <div className="flex items-center space-x-6 pb-8 border-b border-gray-200">
              <div className="relative">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Profile Avatar"
                    width={120}
                    height={120}
                    className="w-30 h-30 rounded-full object-cover border-4 border-primary-100"
                  />
                ) : (
                  <div className="w-30 h-30 rounded-full bg-gray-200 flex items-center justify-center border-4 border-primary-100">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Foto Profil</h3>
                <p className="text-sm text-gray-600 mb-4">Upload foto profil Anda (Maksimal 5MB)</p>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Uploading...' : 'Pilih Foto'}
                  </button>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-primary-600" />
                Informasi Pribadi
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    placeholder="Email tidak dapat diubah"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    No. Telepon
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    No. WhatsApp
                  </label>
                  <input
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>
            </div>

            {/* Institution Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Building className="w-5 h-5 mr-2 text-primary-600" />
                Informasi Instansi
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Instansi
                  </label>
                  <input
                    type="text"
                    name="instansi"
                    value={formData.instansi}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Nama instansi tempat bekerja"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alamat Instansi
                  </label>
                  <textarea
                    name="alamat_instansi"
                    value={formData.alamat_instansi}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Alamat lengkap instansi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sektor
                  </label>
                  <select
                    name="sektor"
                    value={formData.sektor}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Pilih Sektor</option>
                    {sectors.map((sector) => (
                      <option key={sector} value={sector}>
                        {sector}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-primary-600" />
                Alamat Pribadi
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alamat Pribadi Lengkap
                  </label>
                  <textarea
                    name="alamat_pribadi"
                    value={formData.alamat_pribadi}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Alamat lengkap tempat tinggal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provinsi
                  </label>
                  <div className="relative" ref={provinceRef}>
                    <div className="relative">
                      <input
                        type="text"
                        value={provinceSearch}
                        onChange={(e) => {
                          setProvinceSearch(e.target.value)
                          setShowProvinceDropdown(true)
                        }}
                        onFocus={() => setShowProvinceDropdown(true)}
                        onKeyDown={handleProvinceKeyDown}
                        placeholder="Cari atau pilih provinsi..."
                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    
                    {showProvinceDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredProvinces.length > 0 ? (
                          filteredProvinces.map((province) => (
                            <button
                              key={province}
                              type="button"
                              onClick={() => handleProvinceSelect(province)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                            >
                              {province}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500">Tidak ada provinsi yang ditemukan</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kabupaten/Kota
                  </label>
                  <div className="relative" ref={kabupatenRef}>
                    <div className="relative">
                      <input
                        type="text"
                        value={kabupatenSearch}
                        onChange={(e) => {
                          setKabupatenSearch(e.target.value)
                          setShowKabupatenDropdown(true)
                        }}
                        onFocus={() => setShowKabupatenDropdown(true)}
                        onKeyDown={handleKabupatenKeyDown}
                        placeholder={formData.provinsi ? "Cari atau pilih kabupaten/kota..." : "Pilih provinsi terlebih dahulu"}
                        disabled={!formData.provinsi}
                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    
                    {showKabupatenDropdown && formData.provinsi && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredKabupaten.length > 0 ? (
                          filteredKabupaten.map((kabupaten) => (
                            <button
                              key={kabupaten}
                              type="button"
                              onClick={() => handleKabupatenSelect(kabupaten)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                            >
                              {kabupaten}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500">Tidak ada kabupaten/kota yang ditemukan</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
