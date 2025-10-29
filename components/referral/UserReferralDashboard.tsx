'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { 
  Gift, 
  Users, 
  CheckCircle, 
  DollarSign, 
  Copy, 
  Share2, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  Star
} from 'lucide-react'
import { useNotification } from '@/components/ui/Notification'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface UserReferralStats {
  total_referrals: number
  confirmed_referrals: number
  pending_referrals: number
  cancelled_referrals: number
  total_commission_earned: number
  confirmed_commission: number
  total_discount_given: number
  conversion_rate: number
  period_stats: {
    total_referrals: number
    confirmed_referrals: number
    pending_referrals: number
    cancelled_referrals: number
    total_commission_earned: number
    confirmed_commission: number
    total_discount_given: number
  }
  recent_referrals: Array<{
    id: string
    participant_name: string
    program_title: string
    status: string
    commission_earned: number
    discount_applied: number
    created_at: string
  }>
}

interface UserReferralCode {
  id: string
  code: string
  description: string
  max_uses: number | null
  current_uses: number
  discount_percentage: number
  discount_amount: number
  commission_percentage: number
  commission_amount: number
  is_active: boolean
  valid_until: string | null
  created_at: string
  stats: {
    total_referrals: number
    confirmed_referrals: number
    total_commission: number
    total_discount: number
  }
}

interface UserReferralDashboardProps {
  period?: 'all' | 'week' | 'month' | 'year'
}

export default function UserReferralDashboard({ period = 'all' }: UserReferralDashboardProps) {
  const { profile } = useAuth()
  const { addNotification } = useNotification()
  const [stats, setStats] = useState<UserReferralStats | null>(null)
  const [referralCodes, setReferralCodes] = useState<UserReferralCode[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(period)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCode, setEditingCode] = useState<UserReferralCode | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  useEffect(() => {
    if (profile?.id) {
      fetchStats()
      fetchReferralCodes()
    }
  }, [selectedPeriod, profile?.id])

  const fetchStats = async () => {
    if (!profile?.id) return

    try {
      console.log('Fetching user referral stats for:', profile.id)
      
      // Get referral codes count
      const { data: referralCodes, error: codesError } = await supabase
        .from('referral_codes')
        .select('id')
        .eq('trainer_id', profile.id)

      if (codesError) {
        console.error('Error fetching referral codes:', codesError)
        throw codesError
      }

      // Get referral tracking data
      const { data: referralTracking, error: trackingError } = await supabase
        .from('referral_tracking')
        .select('*')
        .in('referral_code_id', referralCodes?.map(code => (code as any).id) || [])
        .order('created_at', { ascending: false })

      if (trackingError) {
        console.error('Error fetching referral tracking:', trackingError)
        throw trackingError
      }

      // Sync referral tracking status with enrollment status
      // If enrollment is approved but referral tracking is still pending, update it
      if (referralTracking && referralTracking.length > 0) {
        // Get enrollment IDs
        const enrollmentIds = [...new Set(referralTracking.map((t: any) => t.enrollment_id).filter(Boolean))]
        
        if (enrollmentIds.length > 0) {
          // Fetch enrollments to check their status
          const { data: enrollments, error: enrollmentsError } = await supabase
            .from('enrollments')
            .select('id, status, payment_status')
            .in('id', enrollmentIds)

          if (!enrollmentsError && enrollments) {
            // Create a map for quick lookup
            const enrollmentMap = new Map(enrollments.map((e: any) => [e.id, e]))

            // Find tracking records that need updating
            const trackingToUpdate = referralTracking.filter((tracking: any) => {
              const enrollment = enrollmentMap.get(tracking.enrollment_id)
              return enrollment && 
                     enrollment.status === 'approved' && 
                     tracking.status === 'pending'
            })

            // Update referral tracking status for approved enrollments
            for (const tracking of trackingToUpdate) {
              try {
                const { error: updateError } = await supabase
                  .from('referral_tracking')
                  .update({ status: 'confirmed', updated_at: new Date().toISOString() })
                  .eq('id', tracking.id)
                
                if (!updateError) {
                  console.log(`Updated referral tracking ${tracking.id} to confirmed (enrollment already approved)`)
                  
                  // Update local tracking data
                  const index = referralTracking.findIndex((t: any) => t.id === tracking.id)
                  if (index !== -1) {
                    referralTracking[index].status = 'confirmed'
                  }
                } else {
                  console.error('Error updating referral tracking:', updateError)
                }
              } catch (updateError) {
                console.error('Error updating referral tracking status:', updateError)
              }
            }
            
            // If we updated any tracking, refresh the data to get latest status
            if (trackingToUpdate.length > 0) {
              // Re-fetch referral tracking after updates
              const { data: refreshedTracking } = await supabase
                .from('referral_tracking')
                .select('*')
                .in('referral_code_id', referralCodes?.map(code => (code as any).id) || [])
                .order('created_at', { ascending: false })
              
              if (refreshedTracking) {
                referralTracking.length = 0
                referralTracking.push(...refreshedTracking)
              }
            }
          }
        }
      }

      // Fetch participant and program data separately if tracking data exists
      let enrichedTracking: any[] = []
      if (referralTracking && referralTracking.length > 0) {
        // Get unique participant and program IDs
        const participantIds = [...new Set(referralTracking.map(t => (t as any).participant_id))].filter(Boolean)
        const programIds = [...new Set(referralTracking.map(t => (t as any).program_id))].filter(Boolean)
        const enrollmentIds = [...new Set(referralTracking.map(t => (t as any).enrollment_id))].filter(Boolean)

        // Fetch participants data
        // Strategy: Get enrollments first (which we have access to via referral_tracking),
        // then try to get participant info through user_profiles if participant has user_id
        let participants: any[] = []
        
        // First, get enrollments to find participant_ids
        if (enrollmentIds.length > 0) {
          console.log('Fetching enrollments for participant info:', enrollmentIds)
          const { data: enrollmentsData, error: enrollmentsError } = await supabase
            .from('enrollments')
            .select('id, participant_id, notes')
            .in('id', enrollmentIds)
          
          if (enrollmentsError) {
            console.error('Error fetching enrollments:', enrollmentsError)
          } else if (enrollmentsData) {
            console.log('Fetched enrollments:', enrollmentsData)
            
            // Try to get participants by querying with specific IDs
            // Use a different approach: try to get via user_profiles if participant has user_id
            const allParticipantIds = [...new Set(enrollmentsData.map(e => e.participant_id).filter(Boolean))]
            
            if (allParticipantIds.length > 0) {
              console.log('Attempting to fetch participants for IDs:', allParticipantIds)
              
              // Try query participants with a workaround
              // Since RLS might block, we'll try to get user info from enrollments notes or use participant_id as fallback
              const { data: participantsData, error: participantsError } = await supabase
                .from('participants')
                .select('id, name, email, user_id')
                .in('id', allParticipantIds)
              
              if (participantsError) {
                console.error('Error fetching participants (RLS may be blocking):', participantsError)
              }
              
              // Handle the results - whether successful or failed
              if (participantsData && participantsData.length > 0) {
                participants = participantsData
                console.log('Successfully fetched participants:', participants)
              } else {
                // No participants returned (either RLS blocked or data doesn't exist)
                console.warn('No participants returned from query. This might be due to RLS policy restrictions.')
              }
              
              // Always ensure we have participant objects for all participant_ids
              // Create fallback entries for any missing participants
              allParticipantIds.forEach(participantId => {
                const existingParticipant = participants.find(p => p.id === participantId)
                if (!existingParticipant) {
                  // Try to extract info from enrollment notes
                  const enrollment = enrollmentsData.find((e: any) => e.participant_id === participantId)
                  let participantName = 'Peserta'
                  let participantEmail = ''
                  
                  // Try to extract info from notes
                  if (enrollment?.notes) {
                    const emailMatch = enrollment.notes.match(/email[:\s]+([^\s,\n]+)/i) || enrollment.notes.match(/([\w\.-]+@[\w\.-]+\.\w+)/i)
                    if (emailMatch) {
                      participantEmail = emailMatch[1] || emailMatch[0]
                      participantName = participantEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                    }
                    
                    const nameMatch = enrollment.notes.match(/name[:\s]+([^\n,]+)/i) || enrollment.notes.match(/nama[:\s]+([^\n,]+)/i)
                    if (nameMatch) {
                      participantName = nameMatch[1].trim()
                    }
                  }
                  
                  // Create participant entry with available or fallback data
                  participants.push({
                    id: participantId,
                    name: participantName,
                    email: participantEmail || `${participantId.substring(0, 8)}...`
                  })
                  
                  console.log(`Created fallback participant entry for ID: ${participantId}`)
                }
              })
            }
          }
        }
        
        // Verify all participant IDs have corresponding entries
        const foundParticipantIds = participants.map(p => p.id)
        const missingParticipantIds = participantIds.filter(id => !foundParticipantIds.includes(id))
        if (missingParticipantIds.length > 0) {
          console.warn('Still missing participants after all attempts:', missingParticipantIds)
          // This should not happen if above logic works correctly, but just in case
          missingParticipantIds.forEach(id => {
            if (!participants.find(p => p.id === id)) {
              participants.push({
                id: id,
                name: 'Peserta',
                email: `${id.substring(0, 8)}...`
              })
            }
          })
        }

        // Fetch programs (only if we have IDs)
        let programs: any[] = []
        if (programIds.length > 0) {
          const { data: programsData, error: programsError } = await supabase
            .from('programs')
            .select('id, title')
            .in('id', programIds)
          
          if (!programsError) {
            programs = programsData || []
          }
        }

        // Enrich tracking data
        enrichedTracking = referralTracking.map(tracking => {
          const participant = participants.find((p: any) => p.id === (tracking as any).participant_id)
          const program = programs.find((p: any) => p.id === (tracking as any).program_id)
          
          if (!participant && (tracking as any).participant_id) {
            console.warn(`Participant not found for ID: ${(tracking as any).participant_id}`)
          }
          
          return {
            ...tracking,
            participant,
            program
          }
        })
        
        console.log('Enriched tracking data:', enrichedTracking)
      } else {
        enrichedTracking = []
      }

      // Calculate stats using enriched tracking data
      const totalReferrals = enrichedTracking?.length || 0
      const confirmedReferrals = enrichedTracking?.filter(tracking => (tracking as any).status === 'confirmed').length || 0
      const pendingReferrals = enrichedTracking?.filter(tracking => (tracking as any).status === 'pending').length || 0
      const cancelledReferrals = enrichedTracking?.filter(tracking => (tracking as any).status === 'cancelled').length || 0
      const totalCommissionEarned = enrichedTracking?.reduce((sum, tracking) => sum + ((tracking as any).commission_earned || 0), 0) || 0
      const confirmedCommission = enrichedTracking?.filter(tracking => (tracking as any).status === 'confirmed').reduce((sum, tracking) => sum + ((tracking as any).commission_earned || 0), 0) || 0
      const totalDiscountGiven = enrichedTracking?.reduce((sum, tracking) => sum + ((tracking as any).discount_applied || 0), 0) || 0
      const conversionRate = totalReferrals > 0 ? (confirmedReferrals / totalReferrals) * 100 : 0

      const statsData: UserReferralStats = {
        total_referrals: totalReferrals,
        confirmed_referrals: confirmedReferrals,
        pending_referrals: pendingReferrals,
        cancelled_referrals: cancelledReferrals,
        total_commission_earned: totalCommissionEarned,
        confirmed_commission: confirmedCommission,
        total_discount_given: totalDiscountGiven,
        conversion_rate: conversionRate,
        period_stats: {
          total_referrals: totalReferrals,
          confirmed_referrals: confirmedReferrals,
          pending_referrals: pendingReferrals,
          cancelled_referrals: cancelledReferrals,
          total_commission_earned: totalCommissionEarned,
          confirmed_commission: confirmedCommission,
          total_discount_given: totalDiscountGiven
        },
        recent_referrals: enrichedTracking?.slice(0, 5).map(tracking => ({
          id: (tracking as any).id,
          participant_name: (tracking as any).participant?.name || (tracking as any).participant?.email || 'Participant',
          program_title: (tracking as any).program?.title || 'Program',
          status: (tracking as any).status,
          commission_earned: (tracking as any).commission_earned || 0,
          discount_applied: (tracking as any).discount_applied || 0,
          created_at: (tracking as any).created_at
        })) || []
      }

      console.log('User referral stats:', statsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching user stats:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal memuat statistik referral'
      })
    }
  }

  const fetchReferralCodes = async () => {
    if (!profile?.id) return

    try {
      console.log('Fetching user referral codes for:', profile.id)
      
      const { data, error } = await supabase
        .from('referral_codes')
        .select(`
          *,
          referral_tracking (
            id,
            status,
            commission_earned,
            created_at
          )
        `)
        .eq('trainer_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching referral codes:', error)
        throw error
      }

      console.log('User referral codes:', data)
      setReferralCodes(data || [])
    } catch (error) {
      console.error('Error fetching user referral codes:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal memuat kode referral'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCode = async (codeData: any) => {
    if (!profile?.id) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Autentikasi diperlukan untuk membuat kode referral.'
      })
      return
    }

    try {
      console.log('Creating user referral code:', codeData)
      
      // Generate referral code
      const generateReferralCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let result = ''
        for (let i = 0; i < 8; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
      }

      const referralCode = generateReferralCode()

      const { data, error } = await (supabase as any)
        .from('referral_codes')
        .insert({
          code: referralCode,
          trainer_id: profile.id,
          program_id: codeData.program_id,
          description: codeData.description || '',
          is_active: true,
          discount_percentage: 0,
          discount_amount: 0,
          commission_percentage: 0,
          commission_amount: 0
        })
        .select()

      if (error) {
        console.error('Error creating referral code:', error)
        throw error
      }

      console.log('User referral code created:', data)
      addNotification({
        type: 'success',
        title: 'Berhasil',
        message: 'Kode referral berhasil dibuat'
      })
      setShowCreateForm(false)
      fetchReferralCodes()
      fetchStats()
    } catch (error) {
      console.error('Error creating user code:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal membuat kode referral'
      })
    }
  }

  const handleUpdateCode = async (id: string, codeData: any) => {
    if (!profile?.id) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Autentikasi diperlukan untuk memperbarui kode referral.'
      })
      return
    }

    try {
      console.log('Updating user referral code:', { id, codeData })
      
      const { data, error } = await (supabase as any)
        .from('referral_codes')
        .update({
          program_id: codeData.program_id,
          description: codeData.description || '',
        })
        .eq('id', id)
        .eq('trainer_id', profile.id)
        .select()

      if (error) {
        console.error('Error updating referral code:', error)
        throw error
      }

      console.log('User referral code updated:', data)
      addNotification({
        type: 'success',
        title: 'Berhasil',
        message: 'Kode referral berhasil diperbarui'
      })
      setEditingCode(null)
      fetchReferralCodes()
      fetchStats()
    } catch (error) {
      console.error('Error updating user code:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal memperbarui kode referral'
      })
    }
  }

  const handleDeleteCode = async (id: string) => {
    if (!profile?.id) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Autentikasi diperlukan untuk menghapus kode referral.'
      })
      return
    }

    // Show confirmation dialog
    setConfirmDialog({
      isOpen: true,
      title: 'Konfirmasi Penghapusan',
      message: 'Apakah Anda yakin ingin menghapus kode referral ini? Tindakan ini tidak dapat dibatalkan.',
      onConfirm: async () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })
        
        console.log('Attempting to delete user referral code:', { codeId: id, userId: profile.id })

        try {
          // First, let's check if the code exists and belongs to this user
          const { data: existingCode, error: checkError } = await supabase
            .from('referral_codes')
            .select('id, trainer_id')
            .eq('id', id)
            .eq('trainer_id', profile.id)
            .single()

          if (checkError || !existingCode) {
            console.error('Code not found or access denied:', checkError)
            addNotification({
              type: 'error',
              title: 'Error',
              message: 'Kode referral tidak ditemukan atau Anda tidak memiliki akses untuk menghapusnya'
            })
            return
          }

          // Now delete the code
          const { data, error } = await supabase
            .from('referral_codes')
            .delete()
            .eq('id', id)
            .eq('trainer_id', profile.id)
            .select()

          console.log('Delete result:', { data, error })

          if (error) {
            console.error('Error deleting referral code:', error)
            addNotification({
              type: 'error',
              title: 'Error',
              message: `Gagal menghapus kode referral: ${error.message}`
            })
          } else if (data && data.length > 0) {
            console.log('Successfully deleted referral code:', data)
            addNotification({
              type: 'success',
              title: 'Berhasil',
              message: 'Kode referral berhasil dihapus'
            })
            // Force refresh the list
            setTimeout(() => {
              fetchReferralCodes()
              fetchStats()
            }, 100)
          } else {
            console.log('No rows deleted')
            addNotification({
              type: 'error',
              title: 'Error',
              message: 'Kode referral tidak dapat dihapus'
            })
          }
        } catch (error) {
          console.error('Error deleting code:', error)
          addNotification({
            type: 'error',
            title: 'Error',
            message: 'Gagal menghapus kode referral'
          })
        }
      }
    })
  }

  const copyToClipboard = (code: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const referralUrl = `${baseUrl}/referral/${code}`
    
    navigator.clipboard.writeText(referralUrl).then(() => {
      addNotification({
        type: 'success',
        title: 'Berhasil',
        message: 'Link referral berhasil disalin ke clipboard'
      })
    }).catch(() => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal menyalin link referral'
      })
    })
  }

  const shareReferralCode = (code: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const referralUrl = `${baseUrl}/referral/${code}`
    const shareText = `Hai! Saya ingin mengundang Anda untuk bergabung di program pelatihan GARUDA-21. Gunakan link referral saya untuk mendapatkan diskon khusus: ${referralUrl}`
    
    if (navigator.share) {
      navigator.share({
        title: 'Undangan Program GARUDA-21',
        text: shareText,
        url: referralUrl
      })
    } else {
      copyToClipboard(code)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Referral Saya</h1>
          <p className="text-sm md:text-base text-gray-600">Bagikan kode referral dan dapatkan komisi</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          >
            <option value="all">Semua Waktu</option>
            <option value="week">Minggu Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="year">Tahun Ini</option>
          </select>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Buat Kode Referral
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Referral</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.period_stats.total_referrals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Berhasil</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.period_stats.confirmed_referrals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-yellow-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Komisi</p>
                <p className="text-sm md:text-2xl font-bold text-gray-900 truncate">{formatCurrency(stats.period_stats.confirmed_commission)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Konversi</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.conversion_rate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Referral Codes */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Kode Referral Saya</h2>
        </div>
        <div className="p-3 sm:p-4 md:p-6">
          {referralCodes.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada kode referral</h3>
              <p className="mt-1 text-sm text-gray-500">Buat kode referral pertama Anda untuk mulai mendapatkan komisi</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Buat Kode Referral
              </button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {referralCodes.map((code) => (
                <div key={code.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col space-y-3">
                    {/* Header dengan kode dan status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{code.code}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          code.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {code.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => copyToClipboard(code.code)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Salin link referral"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => shareReferralCode(code.code)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Bagikan"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingCode(code)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCode(code.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    {code.description && (
                      <p className="text-sm text-gray-600">{code.description}</p>
                    )}
                    
                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 text-sm">
                      <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                        <span className="text-gray-600 block text-xs">Penggunaan</span>
                        <span className="font-medium">{code.current_uses}{code.max_uses ? `/${code.max_uses}` : ''}</span>
                      </div>
                      <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                        <span className="text-gray-600 block text-xs">Diskon</span>
                        <span className="font-medium text-blue-600">
                          Ditentukan Admin
                        </span>
                      </div>
                      <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                        <span className="text-gray-600 block text-xs">Komisi</span>
                        <span className="font-medium text-blue-600">
                          Ditentukan Admin
                        </span>
                      </div>
                      <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                        <span className="text-gray-600 block text-xs">Total Komisi</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(
                            (code as any).referral_stats?.reduce((sum: number, stat: any) => 
                              sum + (stat.commission_earned || 0), 0
                            ) || 0
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Valid until */}
                    {code.valid_until && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        Berlaku hingga: {formatDate(code.valid_until)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Referrals */}
      {stats && stats.recent_referrals.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Referral Terbaru</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peserta
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Program
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Komisi
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recent_referrals.map((referral) => (
                  <tr key={referral.id}>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-[150px] md:max-w-none">
                        {referral.participant_name}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 truncate max-w-[150px] md:max-w-none">
                        {referral.program_title}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        referral.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800'
                          : referral.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {referral.status === 'confirmed' ? 'Dikonfirmasi' : 
                         referral.status === 'pending' ? 'Menunggu' : 'Dibatalkan'}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(referral.commission_earned)}
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                      {formatDate(referral.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingCode) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
              setShowCreateForm(false)
              setEditingCode(null)
            }}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {editingCode ? 'Edit Kode Referral' : 'Buat Kode Referral Baru'}
                    </h3>
                    
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.target as HTMLFormElement)
                      const data = {
                        description: formData.get('description'),
                        max_uses: formData.get('max_uses') ? parseInt(formData.get('max_uses') as string) : null,
                        valid_until: formData.get('valid_until') || null
                      }
                      
                      if (editingCode) {
                        handleUpdateCode(editingCode.id, data)
                      } else {
                        handleCreateCode(data)
                      }
                    }}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Deskripsi
                          </label>
                          <input
                            type="text"
                            name="description"
                            defaultValue={editingCode?.description || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Deskripsi kode referral"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Maksimal Penggunaan
                          </label>
                          <input
                            type="number"
                            name="max_uses"
                            defaultValue={editingCode?.max_uses || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Kosongkan untuk tidak terbatas"
                          />
                        </div>

                        {/* Info about referral policies */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-blue-800">
                                Informasi Komisi & Diskon
                              </h3>
                              <div className="mt-2 text-sm text-blue-700">
                                <p>
                                  Komisi dan diskon untuk kode referral Anda ditentukan oleh admin berdasarkan program yang dipilih. 
                                  Anda hanya perlu membuat kode referral dan membagikannya untuk mendapatkan komisi sesuai dengan policy yang berlaku.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Berlaku Hingga
                          </label>
                          <input
                            type="date"
                            name="valid_until"
                            defaultValue={editingCode?.valid_until ? editingCode.valid_until.split('T')[0] : ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 md:pt-6 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateForm(false)
                            setEditingCode(null)
                          }}
                          className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          {editingCode ? 'Perbarui' : 'Buat'} Kode Referral
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
      />
    </div>
  )
}
