'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      setIsLoading(true)
      
      // Wait a bit for session to be available after redirect/login
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Check if user is logged in - try multiple times
      let session = null
      let attempts = 0
      const maxAttempts = 10 // Increased attempts
      
      while (attempts < maxAttempts && !session) {
        try {
          const { data, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            console.error('❌ Session error (attempt', attempts + 1, '):', sessionError)
          }
          
          if (data?.session) {
            session = data.session
            console.log('✅ Session found on attempt', attempts + 1, ':', session.user.email)
            break
          }
        } catch (err) {
          console.error('❌ Error getting session:', err)
        }
        
        attempts++
        if (attempts < maxAttempts) {
          console.log('⏳ Waiting for session... (attempt', attempts + 1, '/', maxAttempts, ')')
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }
      
      if (!session) {
        console.log('❌ No session found after', maxAttempts, 'attempts, redirecting to login')
        // Use window.location to force full page reload
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
        return
      }

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profileError || !profile) {
        console.error('❌ Error fetching profile:', profileError)
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
        return
      }

      if (profile.role !== 'admin') {
        console.log('❌ User is not admin, redirecting to unauthorized')
        window.location.href = '/unauthorized'
        return
      }

      console.log('✅ Admin access granted for:', profile.role)
      setIsAuthorized(true)
    } catch (error) {
      console.error('❌ Auth check error:', error)
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Memverifikasi akses admin...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null // Will redirect
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 px-4 lg:px-6">
          <div className="text-center text-sm text-gray-600">
            © {new Date().getFullYear()} <span className="font-semibold text-primary-600">GARUDA-21</span>. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  )
}
