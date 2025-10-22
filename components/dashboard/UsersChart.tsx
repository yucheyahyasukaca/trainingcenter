'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { supabase } from '@/lib/supabase'

export function UsersChart() {
  const [userData, setUserData] = useState<any[]>([])
  const [roleData, setRoleData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserData() {
      try {
        // Fetch monthly user growth
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('created_at')
          .order('created_at', { ascending: true })

        if (profilesError) throw profilesError

        console.log('User profiles data:', profiles)

        // Group by month
        const monthlyData = profiles?.reduce((acc: any, profile: any) => {
          const date = new Date(profile.created_at)
          const month = date.toLocaleDateString('en-US', { month: 'short' })
          const year = date.getFullYear()
          const key = `${month} ${year}`
          
          if (!acc[key]) {
            acc[key] = 0
          }
          acc[key]++
          return acc
        }, {})

        console.log('Monthly data:', monthlyData)

        // Convert to chart data format
        let chartData = Object.entries(monthlyData || {}).map(([name, users]) => ({
          name,
          users: users as number
        }))

        // If no data, show last 6 months with 0 values
        if (chartData.length === 0) {
          const now = new Date()
          chartData = []
          for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const month = date.toLocaleDateString('en-US', { month: 'short' })
            const year = date.getFullYear()
            chartData.push({
              name: `${month} ${year}`,
              users: 0
            })
          }
        } else {
          // Sort by date
          chartData.sort((a, b) => {
            const dateA = new Date(a.name)
            const dateB = new Date(b.name)
            return dateA.getTime() - dateB.getTime()
          })
        }

        setUserData(chartData)

        // Fetch role distribution
        const { data: roleCounts, error: roleError } = await supabase
          .from('user_profiles')
          .select('role')

        if (roleError) throw roleError

        console.log('Role data:', roleCounts)

        const roleDistribution = roleCounts?.reduce((acc: any, profile: any) => {
          acc[profile.role] = (acc[profile.role] || 0) + 1
          return acc
        }, {})

        let roleChartData = Object.entries(roleDistribution || {}).map(([name, value]) => {
          let color = '#10b981' // Default green
          switch (name) {
            case 'admin':
              color = '#ef4444' // Red
              break
            case 'manager':
              color = '#3b82f6' // Blue
              break
            case 'user':
              color = '#10b981' // Green
              break
            default:
              color = '#6b7280' // Gray
          }
          
          return {
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: value as number,
            color
          }
        })

        // If no role data, show default structure
        if (roleChartData.length === 0) {
          roleChartData = [
            { name: 'Admin', value: 0, color: '#ef4444' },
            { name: 'Manager', value: 0, color: '#3b82f6' },
            { name: 'User', value: 0, color: '#10b981' }
          ]
        }

        setRoleData(roleChartData)
      } catch (error) {
        console.error('Error fetching user data:', error)
        // Set fallback data on error
        setUserData([
          { name: 'Jan 2024', users: 0 },
          { name: 'Feb 2024', users: 0 },
          { name: 'Mar 2024', users: 0 },
          { name: 'Apr 2024', users: 0 },
          { name: 'May 2024', users: 0 },
          { name: 'Jun 2024', users: 0 }
        ])
        setRoleData([
          { name: 'Admin', value: 0, color: '#ef4444' },
          { name: 'Manager', value: 0, color: '#3b82f6' },
          { name: 'User', value: 0, color: '#10b981' }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">User Growth & Distribution</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>
    )
  }
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">User Growth & Distribution</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">Monthly User Growth</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={userData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Role Distribution */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">Role Distribution</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={roleData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {roleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {roleData.map((role, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: role.color }}
                  ></div>
                  <span className="text-sm text-gray-700">{role.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{role.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
