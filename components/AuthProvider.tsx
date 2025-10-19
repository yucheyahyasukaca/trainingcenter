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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshUser: async () => {},
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
        console.log('📋 Loading user profile...')
        const userProfile = await getUserProfile(currentUser.id)
        console.log('👤 User profile:', userProfile)
        
        // If profile not found, create a default one
        if (!userProfile) {
          console.log('⚠️ Profile not found, creating default...')
          const defaultProfile = {
            id: currentUser.id,
            email: currentUser.email || '',
            full_name: currentUser.user_metadata?.full_name || currentUser.email || 'User',
            role: 'admin' as const,
            avatar_url: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          setProfile(defaultProfile)
        } else {
          setProfile(userProfile)
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
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('⚠️ Loading timeout, forcing loading to false')
        setLoading(false)
      }
    }, 3000) // 3 seconds timeout

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
      clearTimeout(timeout)
      subscription?.unsubscribe()
    }
  }, [])

  const value = {
    user,
    profile,
    loading,
    refreshUser: loadUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

