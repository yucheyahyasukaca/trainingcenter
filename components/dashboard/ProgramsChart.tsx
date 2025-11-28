'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export function ProgramsChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEnrollmentsByCategory() {
      try {
        // Get all programs with their enrollments
        const { data: programs, error } = await supabase
          .from('programs')
          .select('id, category')

        if (error) throw error

        // Get all enrollments
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('program_id')

        if (enrollmentsError) throw enrollmentsError

        // Count enrollments per category
        const categoryEnrollments: Record<string, number> = {}

        programs?.forEach((program: any) => {
          const category = program.category
          if (!categoryEnrollments[category]) {
            categoryEnrollments[category] = 0
          }
          
          // Count enrollments for this program
          const programEnrollments = enrollments?.filter(
            (e: any) => e.program_id === program.id
          ).length || 0
          
          categoryEnrollments[category] += programEnrollments
        })

        const chartData = Object.entries(categoryEnrollments || {}).map(([category, count]) => ({
          category,
          jumlah: count,
        }))

        setData(chartData)
      } catch (error) {
        console.error('Error fetching enrollments by category:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEnrollmentsByCategory()
  }, [])

  if (loading) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Pendaftar per Kategori</h2>
        <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Pendaftar per Kategori</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="jumlah" fill="#0ea5e9" name="Jumlah Pendaftar" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

