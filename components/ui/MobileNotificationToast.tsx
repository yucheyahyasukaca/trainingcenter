'use client'

import React, { useState, useEffect } from 'react'
import { useAdminNotifications } from '@/components/admin/AdminNotificationSystem'
import { getNotificationIcon, getPriorityColor } from '@/components/admin/AdminNotificationSystem'
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

export function MobileNotificationToast() {
  const { 
    notifications, 
    markAsRead, 
    removeNotification, 
    getUnreadCount 
  } = useAdminNotifications()

  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const unreadCount = getUnreadCount()
  const recentNotifications = notifications.slice(0, 3) // Show only 3 most recent

  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Baru'
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}j`
    return `${days}h`
  }

  // Auto-open when there are unread notifications
  useEffect(() => {
    if (unreadCount > 0) {
      setIsOpen(true)
    }
  }, [unreadCount])

  // Auto-close after 5 seconds if not interacted with
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      const timer = setTimeout(() => {
        setIsOpen(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, unreadCount])

  if (!isOpen || unreadCount === 0) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-50 sm:hidden">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <div className="w-6 h-6 flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {unreadCount} Notifikasi Baru
              </h3>
              <p className="text-xs text-gray-600">
                {isExpanded ? 'Ketuk untuk menutup' : 'Ketuk untuk melihat'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
              }}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </div>

        {/* Notifications List */}
        {isExpanded && (
          <div className="max-h-80 overflow-y-auto">
            {recentNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type)
              const priorityColor = getPriorityColor(notification.priority)
              
              return (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-gray-100 last:border-b-0 ${
                    notification.read 
                      ? 'bg-gray-50' 
                      : 'bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg ${priorityColor} flex-shrink-0`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={`font-medium text-xs ${
                          notification.read ? 'text-gray-600' : 'text-gray-900'
                        } truncate`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-1">
                          {notification.actionRequired && (
                            <AlertCircle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                          )}
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                      
                      <p className={`text-xs ${
                        notification.read ? 'text-gray-500' : 'text-gray-700'
                      } leading-relaxed mb-2`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-green-600 hover:text-green-800 font-medium px-2 py-1 rounded hover:bg-green-50 transition-colors"
                          >
                            Tandai Dibaca
                          </button>
                        )}
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {notifications.length > 3 && (
              <div className="p-3 bg-gray-50 text-center">
                <p className="text-xs text-gray-500">
                  +{notifications.length - 3} notifikasi lainnya
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
