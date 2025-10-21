'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, MessageSquare } from 'lucide-react'

export interface ToastNotification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  icon?: React.ReactNode
}

interface ToastProps {
  toast: ToastNotification
  onRemove: (id: string) => void
}

function ToastComponent({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleRemove()
      }, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast.duration])

  const handleRemove = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 300)
  }

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-white',
          border: 'border-l-4 border-green-500',
          icon: 'text-green-600',
          iconBg: 'bg-green-100',
          title: 'text-green-800',
          message: 'text-green-700'
        }
      case 'error':
        return {
          bg: 'bg-white',
          border: 'border-l-4 border-red-500',
          icon: 'text-red-600',
          iconBg: 'bg-red-100',
          title: 'text-red-800',
          message: 'text-red-700'
        }
      case 'warning':
        return {
          bg: 'bg-white',
          border: 'border-l-4 border-yellow-500',
          icon: 'text-yellow-600',
          iconBg: 'bg-yellow-100',
          title: 'text-yellow-800',
          message: 'text-yellow-700'
        }
      case 'info':
        return {
          bg: 'bg-white',
          border: 'border-l-4 border-blue-500',
          icon: 'text-blue-600',
          iconBg: 'bg-blue-100',
          title: 'text-blue-800',
          message: 'text-blue-700'
        }
      default:
        return {
          bg: 'bg-white',
          border: 'border-l-4 border-gray-500',
          icon: 'text-gray-600',
          iconBg: 'bg-gray-100',
          title: 'text-gray-800',
          message: 'text-gray-700'
        }
    }
  }

  const styles = getStyles()

  return (
    <div
      className={`
        ${styles.bg} ${styles.border} rounded-lg shadow-lg p-4 mb-3
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${styles.iconBg} rounded-full p-2 mr-3`}>
          {toast.icon || (
            <>
              {toast.type === 'success' && <CheckCircle className={`h-5 w-5 ${styles.icon}`} />}
              {toast.type === 'error' && <AlertCircle className={`h-5 w-5 ${styles.icon}`} />}
              {toast.type === 'warning' && <AlertTriangle className={`h-5 w-5 ${styles.icon}`} />}
              {toast.type === 'info' && <Info className={`h-5 w-5 ${styles.icon}`} />}
            </>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${styles.title} mb-1`}>
            {toast.title}
          </p>
          <p className={`text-sm ${styles.message}`}>
            {toast.message}
          </p>
        </div>
        
        <button
          onClick={handleRemove}
          className="flex-shrink-0 ml-3 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </button>
      </div>
    </div>
  )
}

export function ToastNotificationContainer({ toasts, onRemove }: { toasts: ToastNotification[], onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] w-80 max-w-sm">
      {toasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}

// Hook untuk toast notifications
export function useToastNotification() {
  const [toasts, setToasts] = useState<ToastNotification[]>([])

  const addToast = (toast: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastNotification = {
      id,
      duration: 5000,
      ...toast
    }
    
    setToasts(prev => [...prev, newToast])
    return id
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const success = (title: string, message: string, duration?: number) => {
    return addToast({ type: 'success', title, message, duration })
  }

  const error = (title: string, message: string, duration?: number) => {
    return addToast({ type: 'error', title, message, duration })
  }

  const warning = (title: string, message: string, duration?: number) => {
    return addToast({ type: 'warning', title, message, duration })
  }

  const info = (title: string, message: string, duration?: number) => {
    return addToast({ type: 'info', title, message, duration })
  }

  const forum = (title: string, message: string, duration?: number) => {
    return addToast({ 
      type: 'info', 
      title, 
      message, 
      duration,
      icon: <MessageSquare className="h-5 w-5 text-indigo-600" />
    })
  }

  return {
    toasts,
    success,
    error,
    warning,
    info,
    forum,
    removeToast
  }
}
