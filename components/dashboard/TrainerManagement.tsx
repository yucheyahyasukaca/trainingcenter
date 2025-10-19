'use client'

import { 
  UserPlus, 
  UserMinus, 
  Star, 
  Award,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

export function TrainerManagement() {
  const trainers = [
    {
      id: 1,
      name: 'Dr. Budi Santoso',
      email: 'budi.santoso@email.com',
      level: 'master_trainer',
      status: 'active',
      programs: 5,
      rating: 4.9,
      specializations: ['Leadership', 'Management']
    },
    {
      id: 2,
      name: 'Siti Nurhaliza',
      email: 'siti.nurhaliza@email.com',
      level: 'trainer_l2',
      status: 'active',
      programs: 3,
      rating: 4.7,
      specializations: ['Digital Marketing', 'Social Media']
    },
    {
      id: 3,
      name: 'Ahmad Dahlan',
      email: 'ahmad.dahlan@email.com',
      level: 'trainer_l1',
      status: 'pending',
      programs: 1,
      rating: 4.5,
      specializations: ['Web Development']
    },
    {
      id: 4,
      name: 'Maya Sari',
      email: 'maya.sari@email.com',
      level: 'trainer_l2',
      status: 'suspended',
      programs: 2,
      rating: 4.2,
      specializations: ['Project Management']
    }
  ]

  const getLevelInfo = (level: string) => {
    switch (level) {
      case 'master_trainer':
        return { label: 'Master Trainer', color: 'bg-purple-100 text-purple-800', icon: Star }
      case 'trainer_l2':
        return { label: 'Level 2', color: 'bg-blue-100 text-blue-800', icon: Award }
      case 'trainer_l1':
        return { label: 'Level 1', color: 'bg-green-100 text-green-800', icon: Award }
      default:
        return { label: 'User', color: 'bg-gray-100 text-gray-800', icon: Award }
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle }
      case 'pending':
        return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
      case 'suspended':
        return { label: 'Suspended', color: 'bg-red-100 text-red-800', icon: AlertCircle }
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Trainer Management</h3>
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <UserPlus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Trainer</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {trainers.map((trainer) => {
          const levelInfo = getLevelInfo(trainer.level)
          const statusInfo = getStatusInfo(trainer.status)
          const LevelIcon = levelInfo.icon
          const StatusIcon = statusInfo.icon

          return (
            <div key={trainer.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary-700">
                    {trainer.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{trainer.name}</h4>
                  <p className="text-sm text-gray-600">{trainer.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelInfo.color}`}>
                      <LevelIcon className="w-3 h-3 inline mr-1" />
                      {levelInfo.label}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      <StatusIcon className="w-3 h-3 inline mr-1" />
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{trainer.programs} Programs</p>
                  <p className="text-xs text-gray-600">Rating: {trainer.rating}/5</p>
                </div>
                <div className="flex items-center space-x-2">
                  {trainer.status === 'active' ? (
                    <button className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                      <UserMinus className="w-4 h-4" />
                      <span className="text-sm">Suspend</span>
                    </button>
                  ) : trainer.status === 'suspended' ? (
                    <button className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                      <UserPlus className="w-4 h-4" />
                      <span className="text-sm">Activate</span>
                    </button>
                  ) : (
                    <button className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Approve</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
