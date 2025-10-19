'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = ['#f59e0b', '#10b981', '#ef4444', '#0ea5e9']

export function EnrollmentStatusChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEnrollmentsByStatus() {
      try {
        const { data: enrollments, error } = await supabase
          .from('enrollments')
          .select('status')

        if (error) throw error

        const statusCounts = enrollments?.reduce((acc: any, enrollment: any) => {
          acc[enrollment.status] = (acc[enrollment.status] || 0) + 1
          return acc
        }, {})

        const chartData = Object.entries(statusCounts || {}).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
        }))

        setData(chartData)
      } catch (error) {
        console.error('Error fetching enrollments by status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEnrollmentsByStatus()
  }, [])

  if (loading) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Status Pendaftaran</h2>
        <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Status Pendaftaran</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

