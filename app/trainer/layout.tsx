'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { useState } from 'react'

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[9999] lg:hidden">
          <div 
            className="absolute inset-0 bg-gray-600 opacity-75"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="relative z-[9999]">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 lg:p-6">
          {children}
        </main>
        {/* Footer */}
        <footer className="flex-shrink-0 bg-white border-t border-gray-200 py-2 sm:py-3 px-4 lg:px-6">
          <div className="text-center text-xs sm:text-sm text-gray-600">
            © {new Date().getFullYear()} <span className="font-semibold text-primary-600">GARUDA-21</span>. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  )
}
