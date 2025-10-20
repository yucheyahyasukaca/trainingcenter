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
            enrollments!inner(
              amount_paid,
              payment_status
            )
          `)
          .eq('enrollments.payment_status', 'paid')

        if (error) throw error

        // Group by program and calculate revenue
        const programMap: Record<string, any> = {}
        
        data?.forEach((program: any) => {
          if (!programMap[program.id]) {
            programMap[program.id] = {
              title: program.title,
              price: program.price,
              revenue: 0,
              enrollments: 0,
            }
          }
          
          program.enrollments?.forEach((enrollment: any) => {
            programMap[program.id].revenue += enrollment.amount_paid || 0
            programMap[program.id].enrollments += 1
          })
        })

        const programsWithRevenue = Object.values(programMap)
          .sort((a: any, b: any) => b.revenue - a.revenue)
          .slice(0, 5) // Top 5 programs

        setPrograms(programsWithRevenue)
      } catch (error) {
        console.error('Error fetching program revenue:', error)
        // Fallback: get programs without revenue data
        try {
          const { data: programsData, error: programsError } = await supabase
            .from('programs')
            .select('id, title, price')
            .limit(5)

          if (!programsError && programsData) {
            setPrograms(programsData.map((program: any) => ({
              title: program.title,
              price: program.price,
              revenue: 0,
              enrollments: 0,
            })))
          }
        } catch (fallbackError) {
          console.error('Fallback error:', fallbackError)
        }
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

