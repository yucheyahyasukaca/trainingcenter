'use client'

import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BookOpen,
  Award
} from 'lucide-react'

export function MyEnrollments() {
  const enrollments = [
    {
      id: 1,
      program: 'Leadership Excellence Program',
      status: 'enrolled',
      startDate: '2025-11-01',
      endDate: '2025-11-05',
      progress: 75,
      instructor: 'Dr. Budi Santoso'
    },
    {
      id: 2,
      program: 'Digital Marketing Mastery',
      status: 'completed',
      startDate: '2025-10-15',
      endDate: '2025-10-17',
      progress: 100,
      instructor: 'Siti Nurhaliza',
      certificate: true
    },
    {
      id: 3,
      program: 'Full Stack Web Development',
      status: 'pending',
      startDate: '2025-11-15',
      endDate: '2025-11-28',
      progress: 0,
      instructor: 'Ahmad Dahlan'
    }
  ]

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'enrolled':
        return { label: 'Enrolled', color: 'bg-blue-100 text-blue-800', icon: BookOpen }
      case 'completed':
        return { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle }
      case 'pending':
        return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Kelas Terdaftar</h3>
        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          Lihat Semua
        </button>
      </div>

      <div className="space-y-4">
        {enrollments.map((enrollment) => {
          const statusInfo = getStatusInfo(enrollment.status)
          const StatusIcon = statusInfo.icon

          return (
            <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{enrollment.program}</h4>
                  <p className="text-sm text-gray-600">Instruktur: {enrollment.instructor}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                  <StatusIcon className="w-3 h-3 inline mr-1" />
                  {statusInfo.label}
                </span>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Mulai: {enrollment.startDate}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Selesai: {enrollment.endDate}</span>
                  </div>
                </div>
                {enrollment.certificate && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <Award className="w-4 h-4" />
                    <span className="text-sm font-medium">Sertifikat</span>
                  </div>
                )}
              </div>

              {enrollment.status === 'enrolled' && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{enrollment.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${enrollment.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {enrollment.status === 'enrolled' && (
                    <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium">
                      Lanjutkan
                    </button>
                  )}
                  {enrollment.status === 'completed' && (
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                      Lihat Sertifikat
                    </button>
                  )}
                  {enrollment.status === 'pending' && (
                    <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium">
                      Menunggu Konfirmasi
                    </button>
                  )}
                </div>
                <button className="text-gray-600 hover:text-gray-800 text-sm">
                  Detail
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
