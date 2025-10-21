'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNotification } from '@/components/ui/Notification'
import { 
  Users, 
  GraduationCap, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Shield,
  Database,
  Server
} from 'lucide-react'

export interface AdminNotification {
  id: string
  type: 'system' | 'user' | 'program' | 'payment' | 'security' | 'maintenance'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionRequired?: boolean
  data?: any
}

interface AdminNotificationContextType {
  notifications: AdminNotification[]
  addNotification: (notification: Omit<AdminNotification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
  getUnreadCount: () => number
  getNotificationsByType: (type: AdminNotification['type']) => AdminNotification[]
  getNotificationsByPriority: (priority: AdminNotification['priority']) => AdminNotification[]
}

const AdminNotificationContext = createContext<AdminNotificationContextType | undefined>(undefined)

export function AdminNotificationProvider({ children }: { children: React.ReactNode }) {
  const { addNotification: showToast } = useNotification()
  const [notifications, setNotifications] = useState<AdminNotification[]>([])

  const addNotification = (notification: Omit<AdminNotification, 'id' | 'timestamp' | 'read'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification: AdminNotification = {
      ...notification,
      id,
      timestamp: new Date(),
      read: false
    }
    
    setNotifications(prev => [newNotification, ...prev])
    
    // Show toast notification for high priority items
    if (notification.priority === 'high' || notification.priority === 'critical') {
      showToast({
        type: notification.priority === 'critical' ? 'error' : 'warning',
        title: notification.title,
        message: notification.message,
        duration: 8000
      })
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const getUnreadCount = () => {
    return notifications.filter(notif => !notif.read).length
  }

  const getNotificationsByType = (type: AdminNotification['type']) => {
    return notifications.filter(notif => notif.type === type)
  }

  const getNotificationsByPriority = (priority: AdminNotification['priority']) => {
    return notifications.filter(notif => notif.priority === priority)
  }

  // Simulate real-time notifications (disabled by default to prevent spam)
  useEffect(() => {
    // Only enable auto-notifications if explicitly enabled
    const autoNotificationsEnabled = sessionStorage.getItem('admin-auto-notifications') === 'true'
    
    if (!autoNotificationsEnabled) return

    const interval = setInterval(() => {
      // Simulate random system notifications
      const randomNotifications = [
        {
          type: 'user' as const,
          priority: 'medium' as const,
          title: 'Pendaftaran Baru',
          message: '5 peserta baru mendaftar program AI Fundamentals',
          actionRequired: false
        },
        {
          type: 'program' as const,
          priority: 'high' as const,
          title: 'Program Mendekati Deadline',
          message: 'Program "Digital Marketing" akan berakhir dalam 3 hari',
          actionRequired: true
        },
        {
          type: 'payment' as const,
          priority: 'medium' as const,
          title: 'Pembayaran Diterima',
          message: 'Pembayaran Rp 2.500.000 dari John Doe telah diterima',
          actionRequired: false
        },
        {
          type: 'system' as const,
          priority: 'low' as const,
          title: 'Backup Harian',
          message: 'Backup data harian telah berhasil diselesaikan',
          actionRequired: false
        }
      ]

      // Randomly add notifications (5% chance every 60 seconds)
      if (Math.random() < 0.05) {
        const randomNotif = randomNotifications[Math.floor(Math.random() * randomNotifications.length)]
        addNotification(randomNotif)
      }
    }, 60000) // Check every 60 seconds

    return () => clearInterval(interval)
  }, [addNotification])

  return (
    <AdminNotificationContext.Provider value={{
      notifications,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAll,
      getUnreadCount,
      getNotificationsByType,
      getNotificationsByPriority
    }}>
      {children}
    </AdminNotificationContext.Provider>
  )
}

export function useAdminNotifications() {
  const context = useContext(AdminNotificationContext)
  if (context === undefined) {
    throw new Error('useAdminNotifications must be used within an AdminNotificationProvider')
  }
  return context
}

// Notification type icons
export const getNotificationIcon = (type: AdminNotification['type']) => {
  switch (type) {
    case 'user':
      return Users
    case 'program':
      return GraduationCap
    case 'payment':
      return DollarSign
    case 'security':
      return Shield
    case 'maintenance':
      return Server
    case 'system':
      return Database
    default:
      return Info
  }
}

// Priority colors
export const getPriorityColor = (priority: AdminNotification['priority']) => {
  switch (priority) {
    case 'critical':
      return 'text-red-600 bg-red-100'
    case 'high':
      return 'text-orange-600 bg-orange-100'
    case 'medium':
      return 'text-yellow-600 bg-yellow-100'
    case 'low':
      return 'text-blue-600 bg-blue-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

// Notification type colors
export const getTypeColor = (type: AdminNotification['type']) => {
  switch (type) {
    case 'user':
      return 'text-blue-600 bg-blue-100'
    case 'program':
      return 'text-green-600 bg-green-100'
    case 'payment':
      return 'text-purple-600 bg-purple-100'
    case 'security':
      return 'text-red-600 bg-red-100'
    case 'maintenance':
      return 'text-orange-600 bg-orange-100'
    case 'system':
      return 'text-gray-600 bg-gray-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}
