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
  FileText
} from 'lucide-react'

import { useAuth } from '@/components/AuthProvider'

const getMenuItems = (role: string, trainerLevel?: string) => {
  const baseItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['admin', 'manager', 'user'] },
  ]

  if (role === 'admin') {
    return [
      ...baseItems,
      { icon: BarChart3, label: 'Program', href: '/programs', roles: ['admin'] },
      { icon: Users, label: 'Peserta', href: '/participants', roles: ['admin'] },
      { icon: UserCog, label: 'Trainer', href: '/trainers', roles: ['admin'] },
      { icon: Calendar, label: 'Pendaftaran', href: '/enrollments', roles: ['admin'] },
      { icon: CreditCard, label: 'Pembayaran', href: '/payments', roles: ['admin'] },
      { icon: FileText, label: 'Sertifikat', href: '/admin/certificates', roles: ['admin'] },
      { icon: FileText, label: 'Template Sertifikat', href: '/admin/certificate-templates', roles: ['admin'] },
      { icon: FileText, label: 'Syarat Sertifikat', href: '/admin/certificate-requirements', roles: ['admin'] },
      { icon: BarChart3, label: 'Statistik', href: '/statistics', roles: ['admin'] },
      { icon: Trophy, label: 'Leaderboard Referral', href: '/admin/referral-leaderboard', roles: ['admin'] },
      { icon: User, label: 'Leaderboard User', href: '/admin/user-referral-leaderboard', roles: ['admin'] },
      { icon: Settings, label: 'Policy Referral', href: '/admin/referral-policies', roles: ['admin'] },
      { icon: Settings, label: 'Pengaturan', href: '/settings', roles: ['admin'] },
    ]
  }

  if (role === 'manager') {
    return [
      ...baseItems,
      { icon: BarChart3, label: 'Program', href: '/programs', roles: ['manager'] },
      { icon: Users, label: 'Peserta', href: '/participants', roles: ['manager'] },
      { icon: UserCog, label: 'Trainer', href: '/trainers', roles: ['manager'] },
      { icon: Calendar, label: 'Pendaftaran', href: '/enrollments', roles: ['manager'] },
      { icon: CreditCard, label: 'Pembayaran', href: '/payments', roles: ['manager'] },
      { icon: BarChart3, label: 'Laporan', href: '/reports', roles: ['manager'] },
    ]
  }

  if (role === 'user') {
    const userItems = [
      ...baseItems,
      { icon: BarChart3, label: 'Program', href: '/programs', roles: ['user'] },
      { icon: Calendar, label: 'Kelas Terdaftar', href: '/my-enrollments', roles: ['user'] },
      { icon: FileText, label: 'Sertifikat Saya', href: '/my-certificates', roles: ['user'] },
      { icon: Gift, label: 'Referral Saya', href: '/my-referral', roles: ['user'] },
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
  
  const menuItems = getMenuItems(profile?.role || 'user', (profile as any)?.trainer_level)

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full relative z-[9999] lg:z-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-20 h-20 flex items-center justify-center">
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
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              (profile as any).role === 'admin' ? 'bg-red-500' :
              (profile as any).role === 'manager' ? 'bg-blue-500' : 
              (profile as any).role === 'trainer' ? 'bg-purple-500' : 'bg-green-500'
            }`}></div>
            <span className="text-sm font-medium text-gray-700 capitalize">
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

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`
                group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 font-semibold shadow-sm border border-primary-200' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-primary-600 rounded-full"></div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        {/* Support Card */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-primary-900">Butuh Bantuan?</p>
              <p className="text-xs text-primary-700 mt-1">
                Hubungi dukungan kami untuk bantuan
              </p>
              <button className="mt-3 w-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                Hubungi Dukungan
              </button>
            </div>
          </div>
        </div>

      </div>
    </aside>
  )
}

