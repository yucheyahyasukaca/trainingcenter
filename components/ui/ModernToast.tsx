'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react'

export interface ModernToast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'loading'
  title?: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ModernToastProps {
  toast: ModernToast
  onRemove: (id: string) => void
}

function ModernToastComponent({ toast, onRemove }: ModernToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (toast.duration! / 100))
          if (newProgress <= 0) {
            clearInterval(interval)
            handleRemove()
            return 0
          }
          return newProgress
        })
      }, 100)
      return () => clearInterval(interval)
    }
  }, [toast.duration])

  const handleRemove = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 300)
  }

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
          border: 'border-green-200',
          icon: 'text-green-600',
          iconBg: 'bg-green-100',
          progress: 'bg-green-500',
          iconComponent: CheckCircle,
          shadow: 'shadow-green-100'
        }
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-50 to-rose-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          iconBg: 'bg-red-100',
          progress: 'bg-red-500',
          iconComponent: AlertCircle,
          shadow: 'shadow-red-100'
        }
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          iconBg: 'bg-yellow-100',
          progress: 'bg-yellow-500',
          iconComponent: AlertTriangle,
          shadow: 'shadow-yellow-100'
        }
      case 'info':
        return {
          bg: 'bg-gradient-to-r from-blue-50 to-cyan-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          iconBg: 'bg-blue-100',
          progress: 'bg-blue-500',
          iconComponent: Info,
          shadow: 'shadow-blue-100'
        }
      case 'loading':
        return {
          bg: 'bg-gradient-to-r from-gray-50 to-slate-50',
          border: 'border-gray-200',
          icon: 'text-gray-600',
          iconBg: 'bg-gray-100',
          progress: 'bg-gray-500',
          iconComponent: Loader2,
          shadow: 'shadow-gray-100'
        }
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-50 to-slate-50',
          border: 'border-gray-200',
          icon: 'text-gray-600',
          iconBg: 'bg-gray-100',
          progress: 'bg-gray-500',
          iconComponent: Info,
          shadow: 'shadow-gray-100'
        }
    }
  }

  const styles = getToastStyles()
  const IconComponent = styles.iconComponent

  return (
    <div
      className={`
        relative max-w-sm w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden
        transform transition-all duration-300 ease-in-out backdrop-blur-sm
        ${styles.shadow}
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
      `}
    >
      {/* Progress Bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
          <div 
            className={`h-full ${styles.progress} transition-all duration-100 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className={`p-4 ${styles.bg} border-l-4 ${styles.border}`}>
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 ${styles.iconBg} rounded-full p-2 shadow-sm`}>
            <IconComponent 
              className={`h-5 w-5 ${styles.icon} ${toast.type === 'loading' ? 'animate-spin' : ''}`} 
            />
          </div>
          
          <div className="flex-1 min-w-0">
            {toast.title && (
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {toast.title}
              </p>
            )}
            <p className={`text-sm ${toast.title ? 'text-gray-600' : 'text-gray-900'} leading-relaxed`}>
              {toast.message}
            </p>
            
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 underline"
              >
                {toast.action.label}
              </button>
            )}
          </div>
          
          <div className="flex-shrink-0">
            <button
              className="rounded-full p-1 hover:bg-gray-100 transition-colors duration-200"
              onClick={handleRemove}
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ModernToastContainer({ toasts, onRemove }: { toasts: ModernToast[], onRemove: (id: string) => void }) {
  return (
    <div
      aria-live="assertive"
      className="fixed top-4 right-4 z-[9999] space-y-3 w-full max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ModernToastComponent
            toast={toast}
            onRemove={onRemove}
          />
        </div>
      ))}
    </div>
  )
}

// Hook untuk menggunakan modern toast
export function useModernToast() {
  const [toasts, setToasts] = useState<ModernToast[]>([])

  const addToast = (toast: Omit<ModernToast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ModernToast = {
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

  const success = (message: string, title?: string, duration?: number) => {
    return addToast({ type: 'success', message, title, duration })
  }

  const error = (message: string, title?: string, duration?: number) => {
    return addToast({ type: 'error', message, title, duration })
  }

  const warning = (message: string, title?: string, duration?: number) => {
    return addToast({ type: 'warning', message, title, duration })
  }

  const info = (message: string, title?: string, duration?: number) => {
    return addToast({ type: 'info', message, title, duration })
  }

  const loading = (message: string, title?: string) => {
    return addToast({ type: 'loading', message, title, duration: 0 })
  }

  return {
    toasts,
    success,
    error,
    warning,
    info,
    loading,
    removeToast
  }
}
