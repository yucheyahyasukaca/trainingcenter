'use client'

import { Menu, X, Search, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'

interface PublicNavProps {
  activeLink?: 'programs' | 'trainers' | 'webinars' | 'about' | 'contact'
}

export function PublicNav({ activeLink }: PublicNavProps) {
  const { profile } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center transition-transform hover:scale-105">
                <Image
                  src="/logo-06.png"
                  alt="Garuda Academy Logo"
                  width={80}
                  height={80}
                  className="object-contain w-full h-full"
                />
              </div>
              <div className="hidden sm:block">
                <h3 className="text-lg font-bold text-gray-900">Garuda Academy</h3>
                <p className="text-xs text-gray-500">GARUDA-21 Training Center</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4 lg:space-x-6">
              <Link
                href="/webinars"
                className={`text-sm font-medium transition-colors ${
                  activeLink === 'webinars'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                Webinar
              </Link>
              <Link
                href="/programs"
                className={`text-sm font-medium transition-colors ${
                  activeLink === 'programs'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                Program
              </Link>
              <Link
                href="/trainers"
                className={`text-sm font-medium transition-colors ${
                  activeLink === 'trainers'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                Trainer
              </Link>
              <Link
                href="/about"
                className={`text-sm font-medium transition-colors ${
                  activeLink === 'about'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                Tentang
              </Link>
              <Link
                href="/contact"
                className={`text-sm font-medium transition-colors ${
                  activeLink === 'contact'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                Kontak
              </Link>

              {/* Auth Buttons */}
              <div className="flex items-center space-x-3 lg:space-x-4">
                {profile ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center px-4 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors border border-gray-200 hover:border-primary-600 rounded-lg"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                      Profil Saya
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="inline-flex items-center px-4 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors border border-gray-200 hover:border-primary-600 rounded-lg"
                    >
                      Masuk
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                      Daftar Sekarang
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 text-gray-600" strokeWidth={2} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[9999] bg-white overflow-y-auto">
          {/* Header with Search and Close */}
          <div className="flex items-center justify-between p-2.5 sm:p-3 border-b border-gray-200 gap-2">
            {/* Search Bar */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Apa yang ingin Anda pelajari?"
                  className="w-full pl-8 sm:pl-10 pr-2 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" strokeWidth={2} />
            </button>
          </div>

          {/* Action Buttons - Login & Register */}
          <div className="flex gap-2 sm:gap-3 px-2.5 sm:px-4 py-3 sm:py-4 border-b border-gray-200">
            {profile ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-center text-sm sm:text-base font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-center text-sm sm:text-base font-medium text-white bg-gradient-to-r from-primary-600 to-red-600 rounded-lg hover:from-primary-700 hover:to-red-700 transition-all shadow-sm"
                >
                  Profil Saya
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-center text-sm sm:text-base font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-center text-sm sm:text-base font-medium text-white bg-gradient-to-r from-primary-600 to-red-600 rounded-lg hover:from-primary-700 hover:to-red-700 transition-all shadow-sm"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>

          {/* Navigation Links */}
          <div className="px-2.5 sm:px-4 py-2">
            <nav className="space-y-1">
              <Link
                href="/webinars"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between w-full px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-sm sm:text-base">Webinar</span>
                <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
              </Link>
              <Link
                href="/programs"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between w-full px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-sm sm:text-base">Program</span>
                <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
              </Link>
              
              <Link
                href="/trainers"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between w-full px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-sm sm:text-base">Trainer</span>
                <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
              </Link>
              
              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between w-full px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-sm sm:text-base">Tentang</span>
                <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
              </Link>
              
              <Link
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between w-full px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-sm sm:text-base">Kontak</span>
                <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}

