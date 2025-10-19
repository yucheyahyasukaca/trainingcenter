'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const userData = [
  { name: 'Jan', users: 120 },
  { name: 'Feb', users: 150 },
  { name: 'Mar', users: 180 },
  { name: 'Apr', users: 200 },
  { name: 'May', users: 250 },
  { name: 'Jun', users: 300 },
]

const roleData = [
  { name: 'Admin', value: 5, color: '#ef4444' },
  { name: 'Manager', value: 15, color: '#3b82f6' },
  { name: 'User', value: 280, color: '#10b981' },
]

export function UsersChart() {
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
