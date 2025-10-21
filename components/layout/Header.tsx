'use client'

import { Bell, Search, User, LogOut, ChevronDown, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { signOut } from '@/lib/auth'
import { useNotification } from '@/components/ui/Notification'
import { AdminNotificationProvider, useAdminNotifications } from '@/components/admin/AdminNotificationSystem'

interface HeaderProps {
  onMenuClick?: () => void
}

function HeaderContent({ onMenuClick }: HeaderProps) {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const { notifications } = useNotification()
  const [showDropdown, setShowDropdown] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  // Try to get admin notifications if user is admin
  let adminNotifications: any[] = []
  let adminUnreadCount = 0
  try {
    if (profile?.role === 'admin') {
      const adminNotif = useAdminNotifications()
      adminNotifications = adminNotif.notifications
      adminUnreadCount = adminNotif.getUnreadCount()
    }
  } catch (error) {
    // Not in admin context, ignore
  }

  // Combine regular and admin notifications
  const allNotifications = [...notifications, ...adminNotifications]
  const totalUnreadCount = notifications.length + adminUnreadCount

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
        {/* Mobile Menu Button - Hidden when search is open */}
        {!isMobileSearchOpen && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
        )}

        {/* Search Bar */}
        <div className={`flex-1 max-w-xl mx-4 ${isMobileSearchOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari program, peserta, atau trainer..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              autoFocus={isMobileSearchOpen}
            />
            {/* Close button for mobile search */}
            {isMobileSearchOpen && (
              <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Button - Only visible on mobile when search is closed */}
        {!isMobileSearchOpen && (
          <button
            onClick={() => setIsMobileSearchOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Search className="w-6 h-6 text-gray-600" />
          </button>
        )}

        {/* Right side buttons - Hidden when mobile search is open */}
        {!isMobileSearchOpen && (
          <div className="flex items-center space-x-4 ml-6">
          {/* Notifications Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {totalUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Notifikasi</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {allNotifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Tidak ada notifikasi</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {allNotifications.map((notification, index) => (
                        <div
                          key={notification.id || index}
                          className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {/* Regular notifications */}
                              {notification.type === 'success' && (
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              )}
                              {notification.type === 'error' && (
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              )}
                              {notification.type === 'warning' && (
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              )}
                              {notification.type === 'info' && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                              {/* Admin notifications */}
                              {notification.priority === 'critical' && (
                                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                              )}
                              {notification.priority === 'high' && (
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              )}
                              {notification.priority === 'medium' && (
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              )}
                              {notification.priority === 'low' && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {notification.title}
                              </p>
                              {notification.message && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                              )}
                              {notification.actionRequired && (
                                <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                                  Tindakan Diperlukan
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

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
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(showDropdown || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowDropdown(false)
            setShowNotifications(false)
          }}
        />
      )}
    </header>
  )
}

// Wrapper component with AdminNotificationProvider
export function Header({ onMenuClick }: HeaderProps) {
  return (
    <AdminNotificationProvider>
      <HeaderContent onMenuClick={onMenuClick} />
    </AdminNotificationProvider>
  )
}

