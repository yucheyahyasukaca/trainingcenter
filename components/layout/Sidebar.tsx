'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  UserCog,
  Calendar,
  BarChart3,
  X,
  Settings,
  HelpCircle,
  UserCheck,
  Award,
  CreditCard,
  BookOpen,
  Gift,
  Trophy,
  User,
  FileText,
  Link2,
  Ticket,
  AlertTriangle
} from 'lucide-react'

import { useAuth } from '@/components/AuthProvider'
import { SupportDialog } from '@/components/support/SupportDialog'
import { useState } from 'react'

const getMenuItems = (role: string, trainerLevel?: string) => {
  const baseItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['admin', 'manager', 'user'] },
  ]

  if (role === 'admin') {
    return [
      ...baseItems,
      { icon: BarChart3, label: 'Program', href: '/admin/programs', roles: ['admin'] },
      { icon: Calendar, label: 'Webinar', href: '/admin/webinars', roles: ['admin'] },
      { icon: Users, label: 'Peserta', href: '/participants', roles: ['admin'] },
      { icon: UserCog, label: 'Trainer', href: '/admin/trainers', roles: ['admin'] },
      { icon: BookOpen, label: 'Modul HEBAT', href: '/admin/hebat/modules', roles: ['admin'] },
      { icon: Award, label: 'Submisi HEBAT', href: '/admin/hebat/submissions', roles: ['admin'] },
      { icon: Calendar, label: 'Pendaftaran', href: '/enrollments', roles: ['admin'] },
      { icon: CreditCard, label: 'Pembayaran', href: '/payments', roles: ['admin'] },
      { icon: AlertTriangle, label: 'Konflik Pendaftaran', href: '/admin/enrollments/conflicts', roles: ['admin'] },
      { icon: Settings, label: 'Atur Sertifikat', href: '/admin/certificate-management', roles: ['admin'] },
      { icon: BarChart3, label: 'Statistik', href: '/statistics', roles: ['admin'] },
      { icon: Trophy, label: 'Program Referral', href: '/admin/referral-management', roles: ['admin'] },
      { icon: Award, label: 'Manajemen BERBAGI', href: '/admin/berbagi', roles: ['admin'] },
      { icon: FileText, label: 'Broadcast Email', href: '/admin/email-broadcast', roles: ['admin'] },
      { icon: Link2, label: 'URL Shortener', href: '/admin/url-shortener', roles: ['admin'] },
      { icon: Ticket, label: 'Tiket', href: '/admin/tickets', roles: ['admin'] },
      { icon: Settings, label: 'Pengaturan', href: '/settings', roles: ['admin'] },
    ]
  }

  if (role === 'manager') {
    return [
      ...baseItems,
      { icon: BarChart3, label: 'Program', href: '/admin/programs', roles: ['manager'] },
      { icon: Users, label: 'Peserta', href: '/participants', roles: ['manager'] },
      { icon: UserCog, label: 'Trainer', href: '/admin/trainers', roles: ['manager'] },
      { icon: Calendar, label: 'Pendaftaran', href: '/enrollments', roles: ['manager'] },
      { icon: CreditCard, label: 'Pembayaran', href: '/payments', roles: ['manager'] },
      { icon: BarChart3, label: 'Laporan', href: '/reports', roles: ['manager'] },
    ]
  }

  if (role === 'user') {
    const userItems = [
      ...baseItems,
      { icon: BarChart3, label: 'Program', href: '/dashboard/programs', roles: ['user'] },
      { icon: Calendar, label: 'Webinar Saya', href: '/my-webinars', roles: ['user'] },
      { icon: Calendar, label: 'Kelas Terdaftar', href: '/my-enrollments', roles: ['user'] },
      { icon: FileText, label: 'Sertifikat Saya', href: '/my-certificates', roles: ['user'] },
      { icon: Gift, label: 'Referral Saya', href: '/my-referral', roles: ['user'] },
      { icon: User, label: 'Profil Saya', href: '/profile', roles: ['user'] },
    ]

    // Add trainer-specific items if user is a trainer
    if (trainerLevel && trainerLevel !== 'user') {
      userItems.push(
        { icon: UserCheck, label: 'Profil Trainer', href: '/trainer-profile', roles: ['user'] }
      )
    }

    return userItems
  }

  if (role === 'trainer') {
    return [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/trainer/dashboard', roles: ['trainer'] },
      { icon: BarChart3, label: 'Program', href: '/dashboard/programs', roles: ['trainer'] },
      { icon: Calendar, label: 'Webinar', href: '/my-webinars', roles: ['trainer'] },
      { icon: BookOpen, label: 'Kelas Saya', href: '/trainer/classes', roles: ['trainer'] },
      { icon: Gift, label: 'Referral', href: '/trainer/referral', roles: ['trainer'] },
      { icon: UserCheck, label: 'Profil Trainer', href: '/trainer-profile/view', roles: ['trainer'] },
      { icon: FileText, label: 'Sertifikat Saya', href: '/my-certificates', roles: ['trainer'] },
    ]
  }

  return baseItems
}

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const { profile } = useAuth()
  const [showSupportDialog, setShowSupportDialog] = useState(false)

  const menuItems = getMenuItems(profile?.role || 'user', (profile as any)?.trainer_level)

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen lg:h-full relative z-[9999] lg:z-auto">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
              <Image
                src="/logo-06.png"
                alt="Garuda Academy Logo"
                width={80}
                height={80}
                className="object-contain w-full h-full"
              />
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* User Role Badge */}
      {profile && (
        <div className="px-4 sm:px-6 py-2 sm:py-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${(profile as any).role === 'admin' ? 'bg-red-500' :
              (profile as any).role === 'manager' ? 'bg-blue-500' :
                (profile as any).role === 'trainer' ? 'bg-purple-500' : 'bg-green-500'
              }`}></div>
            <span className="text-xs sm:text-sm font-medium text-gray-700 capitalize">
              {(profile as any).role === 'admin' ? 'Administrator' :
                (profile as any).role === 'manager' ? 'Manager' :
                  (profile as any).role === 'trainer' ? 'Trainer' : 'User Level 0'}
            </span>
            {(profile as any).trainer_level && (profile as any).trainer_level !== 'user' && (
              <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                {(profile as any).trainer_level === 'master' ? 'Master' :
                  (profile as any).trainer_level === 'expert' ? 'Expert' :
                    (profile as any).trainer_level === 'senior' ? 'Senior' :
                      (profile as any).trainer_level === 'junior' ? 'Junior' : 'Trainer'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-1.5 sm:space-y-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 min-h-0">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`
                group flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-200
                ${isActive
                  ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 font-semibold shadow-sm border border-primary-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
              <span className="font-medium text-sm sm:text-base">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-primary-600 rounded-full"></div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer - Support Section */}
      <div className="p-3 sm:p-4 border-t border-gray-200 space-y-3 flex-shrink-0 bg-white sticky bottom-0">
        <div
          onClick={() => setShowSupportDialog(true)}
          className="bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-3 sm:p-4 cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-start space-x-2 sm:space-x-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-primary-900">Butuh Bantuan?</p>
              <p className="text-[10px] sm:text-xs text-primary-700 mt-0.5 sm:mt-1">
                Hubungi dukungan kami
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Support Dialog */}
      <SupportDialog
        isOpen={showSupportDialog}
        onClose={() => setShowSupportDialog(false)}
      />
    </aside>
  )
}

