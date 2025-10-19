'use client'

import { 
  GraduationCap, 
  Clock, 
  Users, 
  Star,
  Calendar,
  BookOpen
} from 'lucide-react'

export function AvailablePrograms() {
  const programs = [
    {
      id: 1,
      title: 'Leadership Excellence Program',
      description: 'Program pelatihan kepemimpinan untuk level manajer dan direktur',
      category: 'Leadership',
      duration: '5 hari',
      price: 'Rp 5,000,000',
      participants: 15,
      maxParticipants: 30,
      rating: 4.9,
      startDate: '2025-11-01',
      instructor: 'Dr. Budi Santoso',
      level: 'Advanced',
      status: 'available'
    },
    {
      id: 2,
      title: 'Digital Marketing Mastery',
      description: 'Pelatihan digital marketing dari basic hingga advanced',
      category: 'Marketing',
      duration: '3 hari',
      price: 'Rp 3,500,000',
      participants: 22,
      maxParticipants: 25,
      rating: 4.7,
      startDate: '2025-11-10',
      instructor: 'Siti Nurhaliza',
      level: 'Intermediate',
      status: 'available'
    },
    {
      id: 3,
      title: 'Full Stack Web Development',
      description: 'Bootcamp intensive web development dengan React dan Node.js',
      category: 'Technology',
      duration: '14 hari',
      price: 'Rp 8,000,000',
      participants: 18,
      maxParticipants: 20,
      rating: 4.8,
      startDate: '2025-11-15',
      instructor: 'Ahmad Dahlan',
      level: 'Beginner',
      status: 'available'
    }
  ]

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'bg-green-100 text-green-800'
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'Advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Leadership':
        return 'bg-purple-100 text-purple-800'
      case 'Marketing':
        return 'bg-blue-100 text-blue-800'
      case 'Technology':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Program Tersedia</h3>
        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          Lihat Semua
        </button>
      </div>

      <div className="space-y-4">
        {programs.map((program) => (
          <div key={program.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-semibold text-gray-900">{program.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(program.level)}`}>
                    {program.level}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{program.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{program.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{program.participants}/{program.maxParticipants}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>{program.rating}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{program.price}</p>
                <p className="text-sm text-gray-600">Mulai: {program.startDate}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(program.category)}`}>
                  {program.category}
                </span>
                <span className="text-sm text-gray-600">Instruktur: {program.instructor}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium">
                  Daftar Sekarang
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                  Detail
                </button>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{program.startDate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
