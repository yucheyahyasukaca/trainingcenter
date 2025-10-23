'use client'

import { useToast } from '@/hooks/useToast'
import { useState } from 'react'

export default function TestToastPage() {
  const addToast = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const showSuccessToast = () => {
    addToast.success('Berhasil!', 'Data berhasil disimpan')
  }

  const showErrorToast = () => {
    addToast.error('Error!', 'Terjadi kesalahan saat memproses data')
  }

  const showWarningToast = () => {
    addToast.warning('Peringatan!', 'Data akan dihapus dalam 30 hari')
  }

  const showInfoToast = () => {
    addToast.info('Informasi', 'Sistem akan maintenance pada pukul 02:00 WIB')
  }

  const showToastWithAction = () => {
    addToast.success('Berhasil!', 'File berhasil diupload', {
      action: {
        label: 'Lihat File',
        onClick: () => alert('Membuka file...')
      }
    })
  }

  const showLoadingToast = () => {
    setIsLoading(true)
    addToast.info('Memproses...', 'Sedang menyimpan data, harap tunggu')
    
    setTimeout(() => {
      setIsLoading(false)
      addToast.success('Selesai!', 'Data berhasil diproses')
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Test Toast Notification System
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={showSuccessToast}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Success Toast
            </button>
            
            <button
              onClick={showErrorToast}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Error Toast
            </button>
            
            <button
              onClick={showWarningToast}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Warning Toast
            </button>
            
            <button
              onClick={showInfoToast}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Info Toast
            </button>
            
            <button
              onClick={showToastWithAction}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Toast with Action
            </button>
            
            <button
              onClick={showLoadingToast}
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Loading Toast'}
            </button>
          </div>
          
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Features:
            </h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>4 types: Success, Error, Warning, Info</li>
              <li>Auto-dismiss after 5 seconds</li>
              <li>Progress bar animation</li>
              <li>Slide-in animation</li>
              <li>Action buttons support</li>
              <li>Manual close button</li>
              <li>Multiple toasts support</li>
              <li>Responsive design</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
