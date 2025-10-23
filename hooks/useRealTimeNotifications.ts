'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminNotifications } from '@/components/admin/AdminNotificationSystem'

export function useRealTimeNotifications() {
  const { addNotification } = useAdminNotifications()

  useEffect(() => {
    // Real-time notifications for new enrollments
    const enrollmentSubscription = supabase
      .channel('enrollments_changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'enrollments' 
        }, 
        (payload) => {
          const enrollment = payload.new as any
          
          addNotification({
            type: 'user',
            priority: 'medium',
            title: 'Pendaftaran Baru',
            message: `Peserta baru mendaftar program dengan status ${enrollment.status}`,
            actionRequired: enrollment.status === 'pending',
            data: { enrollmentId: enrollment.id }
          })
        }
      )
      .subscribe()

    // Real-time notifications for program updates
    const programSubscription = supabase
      .channel('programs_changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'programs' 
        }, 
        (payload) => {
          const program = payload.new as any
          const oldProgram = payload.old as any
          
          // Check if status changed to published
          if (program.status === 'published' && oldProgram.status !== 'published') {
            addNotification({
              type: 'program',
              priority: 'medium',
              title: 'Program Dipublikasikan',
              message: `Program "${program.title}" telah dipublikasikan`,
              actionRequired: false,
              data: { programId: program.id }
            })
          }
        }
      )
      .subscribe()

    // Real-time notifications for payment updates
    const paymentSubscription = supabase
      .channel('enrollments_payment_changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'enrollments',
          filter: 'payment_status=eq.paid'
        }, 
        (payload) => {
          const enrollment = payload.new as any
          const oldEnrollment = payload.old as any
          
          // Check if payment status changed to paid
          if (enrollment.payment_status === 'paid' && oldEnrollment.payment_status !== 'paid') {
            addNotification({
              type: 'payment',
              priority: 'medium',
              title: 'Pembayaran Diterima',
              message: `Pembayaran sebesar Rp ${enrollment.amount_paid?.toLocaleString('id-ID')} telah diterima`,
              actionRequired: false,
              data: { enrollmentId: enrollment.id }
            })
          }
        }
      )
      .subscribe()

    // Check for programs approaching deadline
    const checkProgramDeadlines = async () => {
      try {
        const { data: programs, error } = await supabase
          .from('programs')
          .select('id, title, end_date')
          .eq('status', 'published')
          .lt('end_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()) // 7 days from now
          .gt('end_date', new Date().toISOString()) // Not yet ended

        if (error) throw error

        programs?.forEach((program: any) => {
          const endDate = new Date((program as any).end_date)
          const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          
          if (daysLeft <= 3) {
            addNotification({
              type: 'program',
              priority: 'high',
              title: 'Program Mendekati Deadline',
              message: `Program "${(program as any).title}" akan berakhir dalam ${daysLeft} hari`,
              actionRequired: true,
              data: { programId: (program as any).id }
            })
          }
        })
      } catch (error) {
        console.error('Error checking program deadlines:', error)
      }
    }

    // Check deadlines on mount and every hour
    checkProgramDeadlines()
    const deadlineInterval = setInterval(checkProgramDeadlines, 60 * 60 * 1000) // Every hour

    // System health check
    const systemHealthCheck = async () => {
      try {
        const { data, error } = await supabase
          .from('programs')
          .select('count')
          .limit(1)

        if (error) throw error

        addNotification({
          type: 'system',
          priority: 'low',
          title: 'Sistem Berjalan Normal',
          message: 'Semua layanan berfungsi dengan baik',
          actionRequired: false
        })
      } catch (error) {
        addNotification({
          type: 'system',
          priority: 'critical',
          title: 'Error Sistem',
          message: 'Terjadi masalah dengan koneksi database',
          actionRequired: true
        })
      }
    }

    // Health check every 30 minutes
    const healthInterval = setInterval(systemHealthCheck, 30 * 60 * 1000)

    return () => {
      enrollmentSubscription.unsubscribe()
      programSubscription.unsubscribe()
      paymentSubscription.unsubscribe()
      clearInterval(deadlineInterval)
      clearInterval(healthInterval)
    }
  }, [addNotification])
}
