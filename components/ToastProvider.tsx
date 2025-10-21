'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'

interface ToastContextType {
  success: (message: string, title?: string, duration?: number) => string
  error: (message: string, title?: string, duration?: number) => string
  warning: (message: string, title?: string, duration?: number) => string
  info: (message: string, title?: string, duration?: number) => string
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, removeToast, success, error, warning, info } = useToast()

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}
