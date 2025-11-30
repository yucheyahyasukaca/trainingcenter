'use client'

import {
  Server,
  Database,
  Cpu,
  HardDrive,
  Activity
} from 'lucide-react'
import { useState, useEffect } from 'react'

export function SystemOverview() {
  const [stats, setStats] = useState({
    server: { value: 'Checking...', status: 'normal', color: 'gray' },
    database: { value: 'Checking...', status: 'normal', color: 'gray' },
    cpu: { value: 'Checking...', status: 'normal', color: 'gray' },
    storage: { value: 'Checking...', status: 'normal', color: 'gray' }
  })

  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Stats
        const statsRes = await fetch('/api/system/stats')
        const statsData = await statsRes.json()

        if (statsData && !statsData.error) {
          setStats({
            server: {
              value: statsData.server.status,
              status: statsData.server.healthy ? 'healthy' : 'danger',
              color: statsData.server.healthy ? 'green' : 'red'
            },
            database: {
              value: statsData.database.status,
              status: statsData.database.healthy ? 'healthy' : 'danger',
              color: statsData.database.healthy ? 'green' : 'red'
            },
            cpu: {
              value: statsData.cpu.value,
              status: statsData.cpu.status,
              color: statsData.cpu.status === 'warning' ? 'orange' : 'blue'
            },
            storage: {
              value: statsData.storage.value,
              status: statsData.storage.status,
              color: statsData.storage.status === 'warning' ? 'orange' : 'blue'
            }
          })
        }

        // Fetch Activities
        const activitiesRes = await fetch('/api/system/activities')
        const activitiesData = await activitiesRes.json()

        if (Array.isArray(activitiesData)) {
          setActivities(activitiesData)
        }

      } catch (error) {
        console.error('Error fetching system data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const systemStats = [
    {
      title: 'Server Status',
      value: stats.server.value,
      status: stats.server.status,
      icon: Server,
      color: stats.server.color
    },
    {
      title: 'Database',
      value: stats.database.value,
      status: stats.database.status,
      icon: Database,
      color: stats.database.color
    },
    {
      title: 'CPU Usage',
      value: stats.cpu.value,
      status: stats.cpu.status,
      icon: Cpu,
      color: stats.cpu.color
    },
    {
      title: 'Storage',
      value: stats.storage.value,
      status: stats.storage.status,
      icon: HardDrive,
      color: stats.storage.color
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
          // Map color strings to tailwind classes dynamically or use a lookup
          const getColorClasses = (color: string) => {
            switch (color) {
              case 'green': return { bg: 'bg-green-100', text: 'text-green-600' }
              case 'blue': return { bg: 'bg-blue-100', text: 'text-blue-600' }
              case 'orange': return { bg: 'bg-orange-100', text: 'text-orange-600' }
              case 'red': return { bg: 'bg-red-100', text: 'text-red-600' }
              default: return { bg: 'bg-gray-100', text: 'text-gray-600' }
            }
          }
          const colors = getColorClasses(stat.color)

          return (
            <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg}`}>
                <Icon className={`w-5 h-5 ${colors.text}`} />
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
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          ) : activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${activity.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-600">{activity.user}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No recent activities</p>
          )}
        </div>
      </div>
    </div>
  )
}
