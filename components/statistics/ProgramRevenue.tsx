'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

export function ProgramRevenue() {
  const [programs, setPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProgramRevenue() {
      try {
        const { data, error } = await supabase
          .from('programs')
          .select(`
            id,
            title,
            price,
            enrollments(amount_paid)
          `)
          .limit(5)

        if (error) throw error

        const programsWithRevenue = data?.map((program) => ({
          title: program.title,
          price: program.price,
          revenue: program.enrollments?.reduce((sum: number, e: any) => sum + (e.amount_paid || 0), 0) || 0,
          enrollments: program.enrollments?.length || 0,
        }))

        programsWithRevenue?.sort((a, b) => b.revenue - a.revenue)
        setPrograms(programsWithRevenue || [])
      } catch (error) {
        console.error('Error fetching program revenue:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProgramRevenue()
  }, [])

  if (loading) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue per Program</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue per Program</h2>
      <div className="space-y-4">
        {programs.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Belum ada data revenue</p>
        ) : (
          programs.map((program, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{program.title}</p>
                <p className="text-sm text-gray-500">{program.enrollments} pendaftaran</p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(program.revenue)}
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  dari {formatCurrency(program.price * program.enrollments)} potensial
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

