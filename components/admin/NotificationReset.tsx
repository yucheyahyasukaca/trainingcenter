'use client'

import React from 'react'
import { useAdminNotifications } from './AdminNotificationSystem'
import { Trash2, RotateCcw } from 'lucide-react'

export function NotificationReset() {
  const { clearAll } = useAdminNotifications()

  const resetAll = () => {
    // Clear all notifications
    clearAll()
    
    // Clear session storage
    sessionStorage.removeItem('admin-notifications-initialized')
    sessionStorage.removeItem('admin-auto-notifications')
    
    // Reload page to reset everything
    window.location.reload()
  }

  const clearNotifications = () => {
    clearAll()
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={clearNotifications}
        className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        title="Clear All Notifications"
      >
        <Trash2 className="w-4 h-4" />
        <span>Clear</span>
      </button>
      
      <button
        onClick={resetAll}
        className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        title="Reset All (Reload Page)"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Reset</span>
      </button>
    </div>
  )
}
