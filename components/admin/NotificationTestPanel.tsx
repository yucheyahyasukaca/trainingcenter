'use client'

import React from 'react'
import { useAdminNotifications } from './AdminNotificationSystem'
import { AdminNotificationTemplates } from './AdminNotificationUtils'
import { NotificationReset } from './NotificationReset'
import { 
  Play, 
  Users, 
  GraduationCap, 
  DollarSign, 
  Shield, 
  Server,
  Database
} from 'lucide-react'

export function NotificationTestPanel() {
  const { addNotification, clearAll } = useAdminNotifications()
  const [autoNotificationsEnabled, setAutoNotificationsEnabled] = useState(
    sessionStorage.getItem('admin-auto-notifications') === 'true'
  )

  const testNotifications = [
    {
      icon: Users,
      label: 'User Notifications',
      notifications: [
        () => addNotification(AdminNotificationTemplates.userRegistered('John Doe', 'AI Fundamentals')),
        () => addNotification(AdminNotificationTemplates.userProfileUpdated('Jane Smith')),
        () => addNotification(AdminNotificationTemplates.userStatusChanged('Bob Wilson', 'Aktif')),
      ]
    },
    {
      icon: GraduationCap,
      label: 'Program Notifications',
      notifications: [
        () => addNotification(AdminNotificationTemplates.programCreated('Machine Learning Advanced')),
        () => addNotification(AdminNotificationTemplates.programUpdated('Data Science Bootcamp')),
        () => addNotification(AdminNotificationTemplates.programDeadlineApproaching('Digital Marketing', 2)),
      ]
    },
    {
      icon: DollarSign,
      label: 'Payment Notifications',
      notifications: [
        () => addNotification(AdminNotificationTemplates.paymentReceived(2500000, 'Alice Johnson')),
        () => addNotification(AdminNotificationTemplates.paymentFailed(1500000, 'Charlie Brown')),
        () => addNotification(AdminNotificationTemplates.paymentRefunded(1000000, 'David Lee')),
      ]
    },
    {
      icon: Database,
      label: 'System Notifications',
      notifications: [
        () => addNotification(AdminNotificationTemplates.systemBackupCompleted()),
        () => addNotification(AdminNotificationTemplates.systemUpdateAvailable('v2.1.0')),
        () => addNotification(AdminNotificationTemplates.systemMaintenanceScheduled('25 Januari 2024', '02:00 WIB')),
      ]
    },
    {
      icon: Shield,
      label: 'Security Notifications',
      notifications: [
        () => addNotification(AdminNotificationTemplates.securityAlert('Suspicious Activity', 'Multiple failed login attempts detected')),
        () => addNotification(AdminNotificationTemplates.loginAttemptFailed('suspicious@email.com', 7)),
      ]
    },
    {
      icon: Server,
      label: 'Manager Notifications',
      notifications: [
        () => addNotification(AdminNotificationTemplates.managerCreated('Sarah Manager', 'Program')),
        () => addNotification(AdminNotificationTemplates.managerUpdated('Mike Manager')),
        () => addNotification(AdminNotificationTemplates.managerStatusChanged('Lisa Manager', 'Tidak Aktif')),
      ]
    }
  ]

  const toggleAutoNotifications = () => {
    const newValue = !autoNotificationsEnabled
    setAutoNotificationsEnabled(newValue)
    sessionStorage.setItem('admin-auto-notifications', newValue.toString())
    
    addNotification({
      type: 'system',
      priority: 'medium',
      title: 'Auto Notifications',
      message: `Auto notifications ${newValue ? 'diaktifkan' : 'dinonaktifkan'}`,
      actionRequired: false
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Test Notification System</h3>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={autoNotificationsEnabled}
              onChange={toggleAutoNotifications}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Auto Notifications</span>
          </label>
          <NotificationReset />
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        Klik tombol di bawah untuk menguji berbagai jenis notifikasi admin
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {testNotifications.map((category, categoryIndex) => {
          const Icon = category.icon
          return (
            <div key={categoryIndex} className="space-y-3">
              <div className="flex items-center space-x-2">
                <Icon className="w-5 h-5 text-gray-600" />
                <h4 className="font-medium text-gray-900">{category.label}</h4>
              </div>
              
              <div className="space-y-2">
                {category.notifications.map((notification, index) => (
                  <button
                    key={index}
                    onClick={notification}
                    className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Play className="w-3 h-3 inline mr-2" />
                    Test {index + 1}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
