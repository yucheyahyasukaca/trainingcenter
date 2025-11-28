'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Video, Users, Calendar, TrendingUp, Award, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface WebinarStats {
  totalWebinars: number
  upcomingWebinars: number
  completedWebinars: number
  totalRegistrations: number
  totalAttendees: number
  averageAttendance: number
  topWebinars: Array<{
    id: string
    title: string
    start_time: string
    registrations: number
    attendees: number
    attendance_rate: number
  }>
}

export function WebinarStatistics() {
  const [stats, setStats] = useState<WebinarStats>({
    totalWebinars: 0,
    upcomingWebinars: 0,
    completedWebinars: 0,
    totalRegistrations: 0,
    totalAttendees: 0,
    averageAttendance: 0,
    topWebinars: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchWebinarStats() {
      try {
        const now = new Date().toISOString()

        // Get all published webinars
        const { data: webinars, error: webinarsError } = await supabase
          .from('webinars')
          .select('id, title, start_time, end_time, is_published')
          .eq('is_published', true)

        if (webinarsError) throw webinarsError

        const totalWebinars = webinars?.length || 0
        const upcomingWebinars = webinars?.filter(w => new Date(w.start_time) > new Date()).length || 0
        const completedWebinars = webinars?.filter(w => new Date(w.end_time) < new Date()).length || 0

        // Get all registrations (registered users)
        const { data: registrations, error: registrationsError } = await supabase
          .from('webinar_registrations')
          .select('webinar_id, user_id')

        if (registrationsError) throw registrationsError

        // Get all uploaded participants (from Excel)
        const { data: uploadedParticipants, error: uploadedError } = await supabase
          .from('webinar_participants')
          .select('webinar_id, id')

        if (uploadedError) throw uploadedError

        // Get all certificates (both for registered users and uploaded participants)
        const { data: certificates, error: certificatesError } = await supabase
          .from('webinar_certificates')
          .select('webinar_id, user_id, participant_id')

        if (certificatesError) throw certificatesError

        // Total participants = registered + uploaded
        const registeredCount = registrations?.length || 0
        const uploadedCount = uploadedParticipants?.length || 0
        const totalRegistrations = registeredCount + uploadedCount
        
        // Count attendance based on certificates (both registered users and uploaded participants)
        const totalAttendees = certificates?.length || 0
        const averageAttendance = totalRegistrations > 0 ? (totalAttendees / totalRegistrations) * 100 : 0

        // Get top webinars by registration count (both registered and uploaded)
        if (webinars) {
          const webinarMap: Record<string, any> = {}

          webinars.forEach(webinar => {
            webinarMap[webinar.id] = {
              id: webinar.id,
              title: webinar.title,
              start_time: webinar.start_time,
              registrations: 0,
              attendees: 0,
              attendance_rate: 0
            }
          })

          // Count registered participants
          registrations?.forEach(reg => {
            if (webinarMap[reg.webinar_id]) {
              webinarMap[reg.webinar_id].registrations += 1
            }
          })

          // Count uploaded participants
          uploadedParticipants?.forEach(participant => {
            if (webinarMap[participant.webinar_id]) {
              webinarMap[participant.webinar_id].registrations += 1
            }
          })

          // Count attendance based on certificates
          certificates?.forEach(cert => {
            if (webinarMap[cert.webinar_id]) {
              webinarMap[cert.webinar_id].attendees += 1
            }
          })

          // Calculate attendance rate for each webinar
          Object.values(webinarMap).forEach((webinar: any) => {
            if (webinar.registrations > 0 && webinar.attendees > 0) {
              webinar.attendance_rate = (webinar.attendees / webinar.registrations) * 100
            }
          })

          const topWebinars = Object.values(webinarMap)
            .sort((a: any, b: any) => b.registrations - a.registrations)
            .slice(0, 5)

          setStats({
            totalWebinars,
            upcomingWebinars,
            completedWebinars,
            totalRegistrations,
            totalAttendees,
            averageAttendance,
            topWebinars: topWebinars as any
          })
        } else {
          setStats({
            totalWebinars,
            upcomingWebinars,
            completedWebinars,
            totalRegistrations,
            totalAttendees,
            averageAttendance,
            topWebinars: []
          })
        }
      } catch (error) {
        console.error('Error fetching webinar stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWebinarStats()
  }, [])

  if (loading) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Statistik Webinar</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 bg-gray-200 animate-pulse rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Statistik Webinar</h2>
        <Video className="w-6 h-6 text-primary-600" />
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <Video className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-gray-600">Total Webinar</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalWebinars}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-5 h-5 text-green-600" />
            <p className="text-sm text-gray-600">Akan Datang</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.upcomingWebinars}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center space-x-2 mb-2">
            <Award className="w-5 h-5 text-purple-600" />
            <p className="text-sm text-gray-600">Selesai</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.completedWebinars}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-5 h-5 text-orange-600" />
            <p className="text-sm text-gray-600">Total Pendaftar</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalRegistrations}</p>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-4 border border-teal-200">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-5 h-5 text-teal-600" />
            <p className="text-sm text-gray-600">Kehadiran</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalAttendees}</p>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 border border-pink-200">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-pink-600" />
            <p className="text-sm text-gray-600">Rata-rata Kehadiran</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.averageAttendance.toFixed(1)}%</p>
        </div>
      </div>

      {/* Top Webinars */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Webinar Berdasarkan Pendaftar</h3>
        <div className="space-y-3">
          {stats.topWebinars.length === 0 ? (
            <p className="text-gray-600 text-center py-8">Belum ada data webinar</p>
          ) : (
            stats.topWebinars.map((webinar, index) => (
              <div key={webinar.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary-600">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{webinar.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-500">
                        {formatDate(webinar.start_time)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Pendaftar</p>
                    <p className="text-lg font-bold text-blue-600">{webinar.registrations}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Hadir</p>
                    <p className="text-lg font-bold text-green-600">{webinar.attendees}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Tingkat Kehadiran</p>
                    <p className="text-lg font-bold text-purple-600">{webinar.attendance_rate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

