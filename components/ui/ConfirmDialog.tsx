'use client'

import React, { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

// Hook for managing confirm dialog state
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<{
    title: string
    message: string
    onConfirm: () => void
    confirmText?: string
    cancelText?: string
    type?: 'danger' | 'warning' | 'info'
  } | null>(null)

  const openDialog = (dialogConfig: typeof config) => {
    setConfig(dialogConfig)
    setIsOpen(true)
  }

  const closeDialog = () => {
    setIsOpen(false)
    setConfig(null)
  }

  const confirm = () => {
    if (config?.onConfirm) {
      config.onConfirm()
    }
    closeDialog()
  }

  return {
    isOpen,
    config,
    openDialog,
    closeDialog,
    confirm
  }
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Ya, Hapus',
  cancelText = 'Batal',
  type = 'danger',
  isLoading = false
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-red-600',
          confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          iconBg: 'bg-red-100'
        }
      case 'warning':
        return {
          icon: 'text-yellow-600',
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          iconBg: 'bg-yellow-100'
        }
      case 'info':
        return {
          icon: 'text-blue-600',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          iconBg: 'bg-blue-100'
        }
      default:
        return {
          icon: 'text-red-600',
          confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          iconBg: 'bg-red-100'
        }
    }
  }

  const styles = getTypeStyles()

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        
        {/* Dialog */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${styles.iconBg} sm:mx-0 sm:h-10 sm:w-10`}>
                <AlertTriangle className={`h-6 w-6 ${styles.icon}`} />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className={`
                w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm
                ${styles.confirmButton}
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </>
              ) : (
                confirmText
              )}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Default export for backward compatibility
export default ConfirmDialog

// Component that uses the hook
export function ConfirmDialogWithHook() {
  const { isOpen, config, closeDialog, confirm } = useConfirmDialog()

  if (!config) return null

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={closeDialog}
      onConfirm={confirm}
      title={config.title}
      message={config.message}
      confirmText={config.confirmText}
      cancelText={config.cancelText}
      type={config.type}
    />
  )
}