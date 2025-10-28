'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, User, MapPin, Building, Mail, Phone, Briefcase } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function ViewTrainerProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      setLoading(false)
    }
  }, [profile])

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
            href="/trainer/dashboard" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Dashboard
          </Link>
          
          {/* Page Title and Edit Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profil Trainer</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-0.5">Informasi profil dan data pribadi Anda</p>
              </div>
            </div>
            
            <Link
              href="/trainer-profile/edit"
              className="flex-shrink-0 inline-flex items-center justify-center px-4 py-2.5 bg-primary-600 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm whitespace-nowrap"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profil
            </Link>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-8 space-y-8">
            {/* Profile Photo */}
            <div className="flex items-center justify-center py-6 border-b border-gray-200">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt="Profile Avatar"
                  width={150}
                  height={150}
                  className="w-40 h-40 rounded-full object-cover border-4 border-primary-100"
                />
              ) : (
                <div className="w-40 h-40 rounded-full bg-gray-200 flex items-center justify-center border-4 border-primary-100">
                  <User className="w-20 h-20 text-gray-400" />
                </div>
              )}
            </div>

            {/* Personal Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-primary-600" />
                Informasi Pribadi
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Nama Lengkap
                  </label>
                  <p className="text-gray-900 font-medium">
                    {profile?.full_name || '-'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900 font-medium">
                    {profile?.email || '-'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    No. Telepon
                  </label>
                  <p className="text-gray-900 font-medium">
                    {(profile as any)?.phone || '-'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    No. WhatsApp
                  </label>
                  <p className="text-gray-900 font-medium">
                    {(profile as any)?.whatsapp || '-'}
                  </p>
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
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Nama Instansi
                  </label>
                  <p className="text-gray-900 font-medium">
                    {(profile as any)?.instansi || '-'}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Alamat Instansi
                  </label>
                  <p className="text-gray-900 font-medium">
                    {(profile as any)?.alamat_instansi || '-'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Sektor
                  </label>
                  <p className="text-gray-900 font-medium">
                    {(profile as any)?.sektor || '-'}
                  </p>
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
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Alamat Pribadi Lengkap
                  </label>
                  <p className="text-gray-900 font-medium">
                    {(profile as any)?.alamat_pribadi || '-'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Provinsi
                  </label>
                  <p className="text-gray-900 font-medium">
                    {(profile as any)?.provinsi || '-'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Kabupaten/Kota
                  </label>
                  <p className="text-gray-900 font-medium">
                    {(profile as any)?.kabupaten || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Trainer Level Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-primary-600" />
                Informasi Trainer
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Level Trainer
                  </label>
                  <p className="text-gray-900 font-medium">
                    {(profile as any)?.trainer_level === 'master' ? 'Master Trainer' :
                     (profile as any)?.trainer_level === 'expert' ? 'Expert Trainer' :
                     (profile as any)?.trainer_level === 'senior' ? 'Senior Trainer' :
                     (profile as any)?.trainer_level === 'junior' ? 'Junior Trainer' :
                     'User Level 0'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Pengalaman (Tahun)
                  </label>
                  <p className="text-gray-900 font-medium">
                    {(profile as any)?.trainer_experience_years || 0} tahun
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
