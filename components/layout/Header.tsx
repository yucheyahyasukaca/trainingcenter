'use client'

import { Bell, Search, User, LogOut, ChevronDown, Menu } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { signOut } from '@/lib/auth'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)

  async function handleLogout() {
    try {
      await signOut()
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
      alert('Gagal logout. Silakan coba lagi.')
    }
  }

  const getRoleBadge = (role?: string) => {
    const badges: Record<string, { text: string; class: string }> = {
      admin: { text: 'Administrator', class: 'text-purple-600' },
      manager: { text: 'Manager', class: 'text-blue-600' },
      user: { text: 'User', class: 'text-gray-600' },
    }
    return badges[role || 'user'] || badges.user
  }

  const roleInfo = getRoleBadge(profile?.role)

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari program, peserta, atau trainer..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4 ml-6">
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="relative pl-4 border-l border-gray-200">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {loading ? 'Loading...' : profile?.full_name || user?.email || 'User'}
                </p>
                <p className={`text-xs ${roleInfo.class}`}>{roleInfo.text}</p>
              </div>
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                  <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full bg-gray-100 ${roleInfo.class}`}>
                    {roleInfo.text}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </header>
  )
}

