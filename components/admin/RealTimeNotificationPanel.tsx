'use client'

import React from 'react'
import { useAdminNotifications } from './AdminNotificationSystem'
import { getNotificationIcon, getPriorityColor, getTypeColor } from './AdminNotificationSystem'
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Filter
} from 'lucide-react'

export function RealTimeNotificationPanel() {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    getUnreadCount 
  } = useAdminNotifications()

  const unreadCount = getUnreadCount()
  const recentNotifications = notifications.slice(0, 5) // Show only 5 most recent

  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Baru saja'
    if (minutes < 60) return `${minutes}m yang lalu`
    if (hours < 24) return `${hours}j yang lalu`
    return `${days}h yang lalu`
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
            Notifikasi Real-time
          </h3>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
            >
              <span className="hidden sm:inline">Tandai Semua Dibaca</span>
              <span className="sm:hidden">Semua</span>
            </button>
          )}
        </div>
      </div>

      {recentNotifications.length === 0 ? (
        <div className="text-center py-6 sm:py-8">
          <Bell className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm sm:text-base text-gray-500">Belum ada notifikasi</p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {recentNotifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type)
            const priorityColor = getPriorityColor(notification.priority)
            const typeColor = getTypeColor(notification.type)
            
            return (
              <div
                key={notification.id}
                className={`p-3 sm:p-4 rounded-lg border transition-all duration-200 touch-manipulation ${
                  notification.read 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-white border-blue-200 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className={`p-1.5 sm:p-2 rounded-lg ${typeColor} flex-shrink-0`}>
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                          <h4 className={`font-medium text-xs sm:text-sm ${
                            notification.read ? 'text-gray-600' : 'text-gray-900'
                          } truncate`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span className={`px-1.5 sm:px-2 py-0.5 text-xs font-medium rounded-full ${priorityColor} whitespace-nowrap`}>
                              {notification.priority}
                            </span>
                            {notification.actionRequired && (
                              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                        <p className={`text-xs sm:text-sm ${
                          notification.read ? 'text-gray-500' : 'text-gray-700'
                        } leading-relaxed`}>
                          {notification.message}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-2 mt-2 sm:mt-0">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{formatTime(notification.timestamp)}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 sm:p-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                              title="Tandai sebagai dibaca"
                            >
                              <CheckCircle className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-gray-400 hover:text-green-500" />
                            </button>
                          )}
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="p-2 sm:p-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Hapus notifikasi"
                          >
                            <X className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {notifications.length > 5 && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
          <p className="text-xs sm:text-sm text-gray-500 text-center">
            Menampilkan 5 notifikasi terbaru dari {notifications.length} total
          </p>
        </div>
      )}
    </div>
  )
}
