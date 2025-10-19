'use client'

import { 
  DollarSign, 
  CreditCard, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  TrendingUp
} from 'lucide-react'

export function PaymentOverview() {
  const paymentStats = [
    {
      title: 'Total Revenue',
      value: 'Rp 1.8B',
      change: '+15%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Pending Payments',
      value: '8',
      change: '-3',
      changeType: 'positive',
      icon: Clock,
      color: 'orange'
    },
    {
      title: 'Completed Payments',
      value: '156',
      change: '+12',
      changeType: 'positive',
      icon: CheckCircle,
      color: 'blue'
    },
    {
      title: 'Failed Payments',
      value: '3',
      change: '-1',
      changeType: 'positive',
      icon: AlertTriangle,
      color: 'red'
    }
  ]

  const recentPayments = [
    {
      id: 1,
      user: 'Andi Wijaya',
      program: 'Leadership Excellence',
      amount: 'Rp 5,000,000',
      status: 'completed',
      date: '2 hours ago'
    },
    {
      id: 2,
      user: 'Dewi Lestari',
      program: 'Digital Marketing',
      amount: 'Rp 3,500,000',
      status: 'pending',
      date: '4 hours ago'
    },
    {
      id: 3,
      user: 'Rudi Hermawan',
      program: 'Web Development',
      amount: 'Rp 8,000,000',
      status: 'completed',
      date: '6 hours ago'
    },
    {
      id: 4,
      user: 'Maya Sari',
      program: 'Project Management',
      amount: 'Rp 4,200,000',
      status: 'failed',
      date: '8 hours ago'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Payment Overview</h3>
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-600 font-medium">+15% from last month</span>
        </div>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {paymentStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                stat.color === 'green' ? 'bg-green-100' :
                stat.color === 'orange' ? 'bg-orange-100' :
                stat.color === 'blue' ? 'bg-blue-100' : 'bg-red-100'
              }`}>
                <Icon className={`w-5 h-5 ${
                  stat.color === 'green' ? 'text-green-600' :
                  stat.color === 'orange' ? 'text-orange-600' :
                  stat.color === 'blue' ? 'text-blue-600' : 'text-red-600'
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

      {/* Recent Payments */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Payments</h4>
        <div className="space-y-2">
          {recentPayments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{payment.user}</p>
                  <p className="text-xs text-gray-600">{payment.program}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{payment.amount}</p>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                    {payment.status}
                  </span>
                  <span className="text-xs text-gray-500">{payment.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
