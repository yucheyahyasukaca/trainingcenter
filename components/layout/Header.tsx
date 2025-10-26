'use client'

import { Bell, Search, User, LogOut, ChevronDown, Menu, X, CheckCircle, Clock } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { signOut } from '@/lib/auth'
import { useNotification } from '@/components/ui/Notification'
import { AdminNotificationProvider, useAdminNotifications, getNotificationIcon, getPriorityColor, getTypeColor } from '@/components/admin/AdminNotificationSystem'

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
  let markAsRead: any = null
  let markAllAsRead: any = null
  let removeNotification: any = null
  
  try {
    if (profile?.role === 'admin') {
      const adminNotif = useAdminNotifications()
      adminNotifications = adminNotif.notifications
      adminUnreadCount = adminNotif.getUnreadCount()
      markAsRead = adminNotif.markAsRead
      markAllAsRead = adminNotif.markAllAsRead
      removeNotification = adminNotif.removeNotification
    }
  } catch (error) {
    // Not in admin context, ignore
  }

  // Combine regular and admin notifications
  const allNotifications = [...notifications, ...adminNotifications]
  const totalUnreadCount = notifications.length + adminUnreadCount

  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Baru saja'
    if (minutes < 60) return `${minutes}m yang lalu`
    if (hours < 24) return `${hours}j yang lalu`
    return `${days}h yang lalu`
  }

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
              <div className="fixed sm:absolute top-16 sm:top-full left-4 right-4 sm:left-auto sm:right-0 sm:w-96 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-[80vh] overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Notifikasi</h3>
                      {totalUnreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {totalUnreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {adminUnreadCount > 0 && markAllAsRead && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          Tandai Semua Dibaca
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                  {allNotifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-base">Tidak ada notifikasi</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {allNotifications.map((notification, index) => {
                        const isAdminNotification = notification.priority !== undefined
                        const Icon = isAdminNotification ? getNotificationIcon(notification.type) : null
                        const priorityColor = isAdminNotification ? getPriorityColor(notification.priority) : ''
                        const typeColor = isAdminNotification ? getTypeColor(notification.type) : ''
                        
                        return (
                          <div
                            key={notification.id || index}
                            className={`p-4 hover:bg-gray-50 transition-colors ${
                              isAdminNotification && !notification.read ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">
                                {isAdminNotification && Icon ? (
                                  <div className={`p-2 rounded-lg ${typeColor}`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                ) : (
                                  <div className="w-3 h-3 rounded-full mt-1.5">
                                    {notification.type === 'success' && (
                                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    )}
                                    {notification.type === 'error' && (
                                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    )}
                                    {notification.type === 'warning' && (
                                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                    )}
                                    {notification.type === 'info' && (
                                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                      <h4 className={`font-medium text-sm ${
                                        isAdminNotification && !notification.read ? 'text-gray-900' : 'text-gray-700'
                                      } truncate`}>
                                        {notification.title}
                                      </h4>
                                      {isAdminNotification && (
                                        <div className="flex items-center gap-1">
                                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityColor} whitespace-nowrap`}>
                                            {notification.priority}
                                          </span>
                                          {notification.actionRequired && (
                                            <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                                              Tindakan Diperlukan
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <p className={`text-sm ${
                                      isAdminNotification && !notification.read ? 'text-gray-700' : 'text-gray-600'
                                    } leading-relaxed`}>
                                      {notification.message}
                                    </p>
                                    {isAdminNotification && (
                                      <span className="text-xs text-gray-400 mt-1 block">
                                        {formatTime(notification.timestamp)}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {isAdminNotification && (
                                    <div className="flex items-center gap-1 mt-2 sm:mt-0">
                                      {!notification.read && markAsRead && (
                                        <button
                                          onClick={() => markAsRead(notification.id)}
                                          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                          title="Tandai sebagai dibaca"
                                        >
                                          <CheckCircle className="w-4 h-4 text-gray-400 hover:text-green-500" />
                                        </button>
                                      )}
                                      {removeNotification && (
                                        <button
                                          onClick={() => removeNotification(notification.id)}
                                          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                          title="Hapus notifikasi"
                                        >
                                          <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {allNotifications.length > 0 && (
                  <div className="p-3 border-t border-gray-200 bg-gray-50">
                    <p className="text-xs text-gray-500 text-center">
                      Menampilkan {allNotifications.length} notifikasi
                    </p>
                  </div>
                )}
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

