'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { User, MapPin, Briefcase, GraduationCap, Phone, Mail, Calendar, Edit, Building } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState<any>(null)
  const [participantData, setParticipantData] = useState<any>(null)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const { data: authUser } = await supabase.auth.getUser()
        const userId = authUser?.user?.id
        if (!userId) {
          router.push('/register')
          return
        }
        
        const [{ data: userProfile }, { data: participant }] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle(),
          supabase
            .from('participants')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle()
        ])

        setProfileData(userProfile)
        setParticipantData(participant)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

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

  const programSources = participantData?.program_source 
    ? JSON.parse(participantData.program_source) 
    : []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profil Saya</h1>
            <p className="text-gray-600 mt-1">Informasi lengkap data peserta</p>
          </div>
          <Link
            href="/profile/edit"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Data
          </Link>
        </div>

        <div className="space-y-6">
          {/* Informasi Personal */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Informasi Personal</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Nama Lengkap</label>
                <p className="text-base text-gray-900 mt-1">{profileData?.full_name || '-'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-base text-gray-900 mt-1">{profileData?.email || '-'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Jenis Kelamin</label>
                <p className="text-base text-gray-900 mt-1">
                  {profileData?.gender === 'male' ? 'Laki-laki' : profileData?.gender === 'female' ? 'Perempuan' : '-'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Tanggal Lahir</label>
                <p className="text-base text-gray-900 mt-1">
                  {participantData?.date_of_birth 
                    ? new Date(participantData.date_of_birth).toLocaleDateString('id-ID', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : '-'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">No WhatsApp</label>
                <p className="text-base text-gray-900 mt-1">{participantData?.phone || profileData?.phone || '-'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Latar Belakang</label>
                <p className="text-base text-gray-900 mt-1">
                  {participantData?.background === 'student' ? 'Mahasiswa' :
                   participantData?.background === 'fresh_graduate' ? 'Fresh Graduate' :
                   participantData?.background === 'professional' ? 'Profesional' :
                   participantData?.background === 'entrepreneur' ? 'Entrepreneur' :
                   participantData?.background === 'other' ? 'Lainnya' : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Lokasi */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Lokasi</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Provinsi</label>
                <p className="text-base text-gray-900 mt-1">{profileData?.provinsi || '-'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Kabupaten/Kota</label>
                <p className="text-base text-gray-900 mt-1">{profileData?.kabupaten || '-'}</p>
              </div>
              
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500">Alamat Lengkap</label>
                <p className="text-base text-gray-900 mt-1">{profileData?.address || participantData?.address || '-'}</p>
              </div>
            </div>
          </div>

          {/* Informasi Karier dan Pendidikan */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Informasi Karier dan Pendidikan</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Pendidikan Terakhir</label>
                <p className="text-base text-gray-900 mt-1">{participantData?.education || '-'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Status Pendidikan</label>
                <p className="text-base text-gray-900 mt-1">
                  {participantData?.education_status === 'sedang' ? 'Sedang Menempuh Pendidikan' :
                   participantData?.education_status === 'tidak' ? 'Tidak Menempuh Pendidikan' : '-'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Status Pekerjaan</label>
                <p className="text-base text-gray-900 mt-1">
                  {participantData?.employment_status === 'bekerja' ? 'Sedang Bekerja' :
                   participantData?.employment_status === 'tidak_bekerja' ? 'Tidak Bekerja' : '-'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Jenjang</label>
                <p className="text-base text-gray-900 mt-1">{profileData?.jenjang || '-'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Instansi/Perusahaan</label>
                <p className="text-base text-gray-900 mt-1">{participantData?.company || '-'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Jabatan/Posisi</label>
                <p className="text-base text-gray-900 mt-1">{participantData?.position || '-'}</p>
              </div>
              
              {participantData?.career_info && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Informasi Karier</label>
                  <p className="text-base text-gray-900 mt-1">{participantData.career_info}</p>
                </div>
              )}
            </div>
          </div>

          {/* Informasi Lainnya */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Informasi Lainnya</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Pemahaman IT</label>
                <p className="text-base text-gray-900 mt-1">
                  {participantData?.it_background === 'ya' ? 'Ya' :
                   participantData?.it_background === 'tidak' ? 'Tidak' : '-'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Status Disabilitas</label>
                <p className="text-base text-gray-900 mt-1">
                  {participantData?.disability === 'ya' ? 'Ya' :
                   participantData?.disability === 'tidak' ? 'Tidak' : '-'}
                </p>
              </div>
              
              {programSources.length > 0 && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Sumber Informasi Program</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {programSources.map((source: string, index: number) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-500">Kontak Darurat</label>
                <p className="text-base text-gray-900 mt-1">{participantData?.emergency_contact_name || '-'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">No Telepon Kontak Darurat</label>
                <p className="text-base text-gray-900 mt-1">{participantData?.emergency_contact_phone || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

