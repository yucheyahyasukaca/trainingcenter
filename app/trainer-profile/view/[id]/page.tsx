'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { X, User, Mail, Phone, Briefcase, Award, Star, Calendar, BookOpen } from 'lucide-react'
import Image from 'next/image'

interface Trainer {
  id: string
  name: string
  email: string
  phone: string
  specialization: string
  bio: string | null
  experience_years: number
  certification: string | null
  status: string
  avatar_url: string | null
  created_at: string
}

export default function ViewTrainerProfilePublicPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [trainer, setTrainer] = useState<Trainer | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTrainer()
  }, [params.id])

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  async function fetchTrainer() {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('trainers')
        .select('*')
        .eq('id', params.id)
        .single()

      if (fetchError) {
        console.error('Error fetching trainer:', fetchError)
        setError('Trainer tidak ditemukan')
        return
      }

      if (!data) {
        setError('Trainer tidak ditemukan')
        return
      }

      setTrainer(data)
    } catch (err: any) {
      console.error('Error:', err)
      setError('Gagal memuat data trainer')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    router.back()
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  if (loading) {
    return (
      <div 
        className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-center p-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat profil trainer...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !trainer) {
    return (
      <div 
        className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Trainer Tidak Ditemukan</h2>
            <p className="text-gray-600 mb-6">{error || 'Trainer tidak ditemukan'}</p>
            <button
              onClick={handleClose}
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden my-auto">
        {/* Header with Close Button */}
        <div className="relative bg-gradient-to-r from-primary-600 to-primary-700 p-6">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-6 pr-12">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {trainer.avatar_url ? (
                <Image
                  src={trainer.avatar_url}
                  alt={trainer.name}
                  width={100}
                  height={100}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
            </div>

            {/* Name and Basic Info */}
            <div className="flex-1 text-white">
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">{trainer.name}</h1>
              <p className="text-lg text-primary-100 mb-3">{trainer.specialization}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {trainer.experience_years > 0 && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{trainer.experience_years} tahun pengalaman</span>
                  </div>
                )}
                {trainer.status === 'active' && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Tersedia</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6 space-y-6">
            {/* Bio */}
            {trainer.bio && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-primary-600" />
                  Tentang Trainer
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap pl-7">
                  {trainer.bio}
                </p>
              </div>
            )}

            {/* Grid Layout for Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Specialization */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center">
                  <Briefcase className="w-4 h-4 mr-2 text-primary-600" />
                  Spesialisasi
                </h3>
                <p className="text-gray-900 font-medium">{trainer.specialization}</p>
              </div>

              {/* Experience */}
              {trainer.experience_years > 0 && (
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center">
                    <Star className="w-4 h-4 mr-2 text-primary-600" />
                    Pengalaman
                  </h3>
                  <p className="text-gray-900 font-medium text-xl">
                    {trainer.experience_years} tahun
                  </p>
                </div>
              )}
            </div>

            {/* Certification */}
            {trainer.certification && (
              <div className="bg-primary-50 rounded-xl p-5 border border-primary-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                  <Award className="w-4 h-4 mr-2 text-primary-600" />
                  Sertifikasi & Kualifikasi
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {trainer.certification}
                </p>
              </div>
            )}

            {/* Contact Info */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <Phone className="w-4 h-4 mr-2 text-primary-600" />
                Informasi Kontak
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center">
                    <Mail className="w-3 h-3 mr-1" />
                    Email
                  </label>
                  <a 
                    href={`mailto:${trainer.email}`}
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm break-all"
                  >
                    {trainer.email}
                  </a>
                </div>

                {trainer.phone && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      Telepon
                    </label>
                    <a 
                      href={`tel:${trainer.phone}`}
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      {trainer.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="text-gray-500">Status: </span>
            <span className={`font-medium ${
              trainer.status === 'active' ? 'text-green-600' : 'text-gray-600'
            }`}>
              {trainer.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}