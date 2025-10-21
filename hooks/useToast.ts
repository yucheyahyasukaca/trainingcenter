'use client'

import { useState, useCallback } from 'react'
import { Toast } from '@/components/ui/Toast'

let toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = (++toastId).toString()
    const newToast: Toast = {
      id,
      duration: 5000, // Default 5 seconds
      ...toast
    }
    
    setToasts(prev => [...prev, newToast])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const success = useCallback((message: string, title?: string, duration?: number) => {
    return addToast({ type: 'success', message, title, duration })
  }, [addToast])

  const error = useCallback((message: string, title?: string, duration?: number) => {
    return addToast({ type: 'error', message, title, duration })
  }, [addToast])

  const warning = useCallback((message: string, title?: string, duration?: number) => {
    return addToast({ type: 'warning', message, title, duration })
  }, [addToast])

  const info = useCallback((message: string, title?: string, duration?: number) => {
    return addToast({ type: 'info', message, title, duration })
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
}
