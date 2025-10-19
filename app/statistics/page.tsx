'use client'

import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { ProgramsChart } from '@/components/dashboard/ProgramsChart'
import { EnrollmentStatusChart } from '@/components/dashboard/EnrollmentStatusChart'
import { MonthlyEnrollmentsChart } from '@/components/statistics/MonthlyEnrollmentsChart'
import { TrainerPerformance } from '@/components/statistics/TrainerPerformance'
import { ProgramRevenue } from '@/components/statistics/ProgramRevenue'

export default function StatisticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Statistik & Analytics</h1>
        <p className="text-gray-600 mt-1">Laporan dan analisis data training center</p>
      </div>

      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgramsChart />
        <EnrollmentStatusChart />
      </div>

      <MonthlyEnrollmentsChart />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrainerPerformance />
        <ProgramRevenue />
      </div>
    </div>
  )
}

