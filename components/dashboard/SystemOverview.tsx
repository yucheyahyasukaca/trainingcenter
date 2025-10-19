'use client'

import { 
  Server, 
  Database, 
  Cpu, 
  HardDrive,
  Activity,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

export function SystemOverview() {
  const systemStats = [
    {
      title: 'Server Status',
      value: 'Online',
      status: 'healthy',
      icon: Server,
      color: 'green'
    },
    {
      title: 'Database',
      value: 'Connected',
      status: 'healthy',
      icon: Database,
      color: 'green'
    },
    {
      title: 'CPU Usage',
      value: '45%',
      status: 'normal',
      icon: Cpu,
      color: 'blue'
    },
    {
      title: 'Storage',
      value: '2.1GB / 10GB',
      status: 'normal',
      icon: HardDrive,
      color: 'blue'
    }
  ]

  const recentActivities = [
    {
      id: 1,
      action: 'User login',
      user: 'admin@garuda21.com',
      time: '2 minutes ago',
      status: 'success'
    },
    {
      id: 2,
      action: 'Database backup',
      user: 'System',
      time: '1 hour ago',
      status: 'success'
    },
    {
      id: 3,
      action: 'New program created',
      user: 'manager@garuda21.com',
      time: '3 hours ago',
      status: 'success'
    },
    {
      id: 4,
      action: 'Payment processed',
      user: 'System',
      time: '5 hours ago',
      status: 'success'
    }
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">System Overview</h3>
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-600 font-medium">All Systems Operational</span>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {systemStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                stat.color === 'green' ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                <Icon className={`w-5 h-5 ${
                  stat.color === 'green' ? 'text-green-600' : 'text-blue-600'
                }`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-600">{stat.title}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activities */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Activities</h4>
        <div className="space-y-2">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-600">{activity.user}</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
