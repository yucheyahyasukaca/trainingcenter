'use client'

import { 
  Award, 
  Download, 
  Eye, 
  Calendar,
  CheckCircle,
  Clock
} from 'lucide-react'

export function MyCertificates() {
  const certificates = [
    {
      id: 1,
      title: 'Digital Marketing Mastery',
      issuer: 'GARUDA-21 Training Center',
      date: '2025-10-17',
      status: 'issued',
      type: 'Completion Certificate',
      instructor: 'Siti Nurhaliza',
      grade: 'A+',
      downloadUrl: '#'
    },
    {
      id: 2,
      title: 'Project Management Fundamentals',
      issuer: 'GARUDA-21 Training Center',
      date: '2025-09-15',
      status: 'issued',
      type: 'Completion Certificate',
      instructor: 'Dr. Budi Santoso',
      grade: 'A',
      downloadUrl: '#'
    },
    {
      id: 3,
      title: 'Leadership Excellence Program',
      issuer: 'GARUDA-21 Training Center',
      date: '2025-11-05',
      status: 'pending',
      type: 'Completion Certificate',
      instructor: 'Dr. Budi Santoso',
      grade: null,
      downloadUrl: null
    }
  ]

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'issued':
        return { 
          label: 'Issued', 
          color: 'bg-green-100 text-green-800', 
          icon: CheckCircle 
        }
      case 'pending':
        return { 
          label: 'Pending', 
          color: 'bg-yellow-100 text-yellow-800', 
          icon: Clock 
        }
      default:
        return { 
          label: 'Unknown', 
          color: 'bg-gray-100 text-gray-800', 
          icon: Clock 
        }
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Sertifikat Saya</h3>
        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          Lihat Semua
        </button>
      </div>

      <div className="space-y-4">
        {certificates.map((cert) => {
          const statusInfo = getStatusInfo(cert.status)
          const StatusIcon = statusInfo.icon

          return (
            <div key={cert.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{cert.title}</h4>
                    <p className="text-sm text-gray-600 mb-1">{cert.type}</p>
                    <p className="text-xs text-gray-500">Instruktur: {cert.instructor}</p>
                  </div>
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
                    <span>{cert.date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Award className="w-4 h-4" />
                    <span>{cert.issuer}</span>
                  </div>
                  {cert.grade && (
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-green-600">Grade: {cert.grade}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {cert.status === 'issued' ? (
                    <>
                      <button className="flex items-center space-x-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium">
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                      <button className="flex items-center space-x-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                        <Eye className="w-4 h-4" />
                        <span>Lihat</span>
                      </button>
                    </>
                  ) : (
                    <button className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      <span>Menunggu Sertifikat</span>
                    </button>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Certificate ID: #{cert.id.toString().padStart(6, '0')}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Certificate Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">2</p>
            <p className="text-sm text-gray-600">Sertifikat</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">1</p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">A+</p>
            <p className="text-sm text-gray-600">Rata-rata</p>
          </div>
        </div>
      </div>
    </div>
  )
}
