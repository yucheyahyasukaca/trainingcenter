import { useToast as useToastContext } from '@/contexts/ToastContext'

export function useToast() {
  const { addToast, removeToast, clearToasts } = useToastContext()

  const toast = {
    success: (title: string, message?: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
      return addToast({
        type: 'success',
        title,
        message,
        ...options
      })
    },
    error: (title: string, message?: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
      return addToast({
        type: 'error',
        title,
        message,
        ...options
      })
    },
    warning: (title: string, message?: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
      return addToast({
        type: 'warning',
        title,
        message,
        ...options
      })
    },
    info: (title: string, message?: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
      return addToast({
        type: 'info',
        title,
        message,
        ...options
      })
    },
    remove: removeToast,
    clear: clearToasts
  }

  return toast
}