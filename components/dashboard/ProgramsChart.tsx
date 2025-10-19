'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export function ProgramsChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProgramsByCategory() {
      try {
        const { data: programs, error } = await supabase
          .from('programs')
          .select('category')

        if (error) throw error

        const categoryCounts = programs?.reduce((acc: any, program: any) => {
          acc[program.category] = (acc[program.category] || 0) + 1
          return acc
        }, {})

        const chartData = Object.entries(categoryCounts || {}).map(([category, count]) => ({
          category,
          jumlah: count,
        }))

        setData(chartData)
      } catch (error) {
        console.error('Error fetching programs by category:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProgramsByCategory()
  }, [])

  if (loading) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Program per Kategori</h2>
        <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Program per Kategori</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="jumlah" fill="#0ea5e9" name="Jumlah Program" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

