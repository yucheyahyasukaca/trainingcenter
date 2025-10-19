'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { UserCog, GraduationCap, Users } from 'lucide-react'

export function TrainerPerformance() {
  const [trainers, setTrainers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTrainerPerformance() {
      try {
        const { data: programs, error } = await supabase
          .from('programs')
          .select(`
            *,
            trainer:trainers(id, name),
            enrollments(count)
          `)

        if (error) throw error

        // Group by trainer
        const trainerStats: Record<string, any> = {}
        programs?.forEach((program: any) => {
          if (program.trainer) {
            const trainerId = program.trainer.id
            if (!trainerStats[trainerId]) {
              trainerStats[trainerId] = {
                name: program.trainer.name,
                totalPrograms: 0,
                totalEnrollments: 0,
              }
            }
            trainerStats[trainerId].totalPrograms += 1
          }
        })

        const trainerList = Object.values(trainerStats)
        setTrainers(trainerList)
      } catch (error) {
        console.error('Error fetching trainer performance:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrainerPerformance()
  }, [])

  if (loading) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Performa Trainer</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Performa Trainer</h2>
      <div className="space-y-4">
        {trainers.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Belum ada data performa trainer</p>
        ) : (
          trainers.map((trainer, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <UserCog className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{trainer.name}</p>
                  <p className="text-sm text-gray-500">{trainer.totalPrograms} program</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Program</p>
                  <p className="text-lg font-bold text-gray-900">{trainer.totalPrograms}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

