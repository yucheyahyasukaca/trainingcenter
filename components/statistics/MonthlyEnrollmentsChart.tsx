'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export function MonthlyEnrollmentsChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMonthlyEnrollments() {
      try {
        // Get enrollments from the last 12 months
        const twelveMonthsAgo = new Date()
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

        const { data: enrollments, error } = await supabase
          .from('enrollments')
          .select('enrollment_date')
          .gte('enrollment_date', twelveMonthsAgo.toISOString())
          .order('enrollment_date')

        if (error) throw error

        // Group by month
        const monthCounts: Record<string, number> = {}
        
        // Initialize last 12 months with 0
        for (let i = 11; i >= 0; i--) {
          const date = new Date()
          date.setMonth(date.getMonth() - i)
          const monthKey = date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short' })
          monthCounts[monthKey] = 0
        }

        // Count actual enrollments
        enrollments?.forEach((enrollment: any) => {
          if (enrollment.enrollment_date) {
            const date = new Date(enrollment.enrollment_date)
            const monthKey = date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short' })
            if (monthCounts.hasOwnProperty(monthKey)) {
              monthCounts[monthKey] += 1
            }
          }
        })

        const chartData = Object.entries(monthCounts).map(([month, count]) => ({
          bulan: month,
          pendaftaran: count,
        }))

        setData(chartData)
      } catch (error) {
        console.error('Error fetching monthly enrollments:', error)
        // Set empty data on error
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchMonthlyEnrollments()
  }, [])

  if (loading) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Tren Pendaftaran Bulanan</h2>
        <div className="h-80 bg-gray-200 animate-pulse rounded"></div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Tren Pendaftaran Bulanan</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="bulan" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="pendaftaran" stroke="#0ea5e9" strokeWidth={2} name="Jumlah Pendaftaran" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

