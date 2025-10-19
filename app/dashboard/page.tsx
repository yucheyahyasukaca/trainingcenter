import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { RecentEnrollments } from '@/components/dashboard/RecentEnrollments'
import { ProgramsChart } from '@/components/dashboard/ProgramsChart'
import { EnrollmentStatusChart } from '@/components/dashboard/EnrollmentStatusChart'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Selamat datang di Garuda Academy GARUDA-21 Training Center</p>
      </div>

      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgramsChart />
        <EnrollmentStatusChart />
      </div>

      <RecentEnrollments />
    </div>
  )
}

