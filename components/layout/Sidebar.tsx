'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  UserCog, 
  Calendar, 
  BarChart3,
  GraduationCap
} from 'lucide-react'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: GraduationCap, label: 'Program', href: '/programs' },
  { icon: Users, label: 'Peserta', href: '/participants' },
  { icon: UserCog, label: 'Trainer', href: '/trainers' },
  { icon: Calendar, label: 'Pendaftaran', href: '/enrollments' },
  { icon: BarChart3, label: 'Statistik', href: '/statistics' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Garuda Academy</h1>
            <p className="text-xs text-gray-500">GARUDA-21 Training Center</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                ${isActive 
                  ? 'bg-primary-50 text-primary-700 font-medium' 
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="card bg-primary-50 border-primary-200">
          <p className="text-sm text-primary-900 font-medium">Butuh Bantuan?</p>
          <p className="text-xs text-primary-700 mt-1">
            Hubungi support kami untuk bantuan
          </p>
          <button className="mt-3 w-full btn-primary text-sm py-2">
            Hubungi Support
          </button>
        </div>
      </div>
    </aside>
  )
}

