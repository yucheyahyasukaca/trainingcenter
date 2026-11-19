'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getUserProfile, onAuthStateChange } from '@/lib/auth'
import type { UserProfile } from '@/lib/auth'

interface AuthContextType {
  user: any | null
  profile: UserProfile | null
  loading: boolean
  refreshUser: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshUser: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadUser() {
    try {
      console.log('🔄 Loading user...')
      const currentUser = await getCurrentUser()
      console.log('👤 Current user:', currentUser)
      setUser(currentUser)
      
      if (currentUser) {
        // Pasang profil sementara segera setelah sesi terbaca. Bila server lambat dan
        // timeout memutus loading, pengguna tidak salah dianggap belum login.
        setProfile(prev => prev ?? {
          id: currentUser.id,
          email: currentUser.email || '',
          full_name: currentUser.user_metadata?.full_name || currentUser.email || 'User',
          role: 'user' as const,
          avatar_url: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        console.log('📋 Loading user profile...')
        try {
          const userProfile = await getUserProfile(currentUser.id)
          console.log('👤 User profile:', userProfile)
          
          if (userProfile) {
            setProfile(userProfile)
          } else {
            console.log('⚠️ Profile not found, creating default...')
            const defaultProfile = {
              id: currentUser.id,
              email: currentUser.email || '',
              full_name: currentUser.user_metadata?.full_name || currentUser.email || 'User',
              role: 'user' as const,
              avatar_url: undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            setProfile(defaultProfile)
          }
        } catch (profileError) {
          console.error('❌ Error fetching user profile:', profileError)
          // Create default profile on error
          const defaultProfile = {
            id: currentUser.id,
            email: currentUser.email || '',
            full_name: currentUser.user_metadata?.full_name || currentUser.email || 'User',
            role: 'user' as const,
            avatar_url: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          setProfile(defaultProfile)
        }
      } else {
        console.log('❌ No current user')
        setProfile(null)
      }
    } catch (error) {
      console.error('❌ Error loading user:', error)
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('🔄 AuthProvider useEffect triggered')
    loadUser()

    // Add timeout to prevent infinite loading
    let timeoutId: NodeJS.Timeout
    const checkLoading = () => {
      timeoutId = setTimeout(() => {
        setLoading(prev => {
          if (prev) {
            console.log('⚠️ Loading timeout, forcing loading to false')
            return false
          }
          return prev
        })
      }, 10000) // 10 seconds timeout (server bisa lambat saat ramai)
    }
    checkLoading()

    // Listen to auth changes
    const { data: { subscription } } = onAuthStateChange((user) => {
      console.log('🔄 Auth state changed:', user?.email || 'No user')
      if (user) {
        loadUser()
      } else {
        setUser(null)
        setProfile(null)
        // Don't redirect to login automatically
        // router.push('/login')
      }
    })

    return () => {
      clearTimeout(timeoutId)
      subscription?.unsubscribe()
    }
  }, [])

  async function refreshProfile() {
    if (user) {
      try {
        const userProfile = await getUserProfile(user.id)
        if (userProfile) {
          setProfile(userProfile)
        }
      } catch (error) {
        console.error('Error refreshing profile:', error)
      }
    }
  }

  const value = {
    user,
    profile,
    loading,
    refreshUser: loadUser,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

