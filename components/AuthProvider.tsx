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
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      
      if (currentUser) {
        const userProfile = await getUserProfile(currentUser.id)
        setProfile(userProfile)
      } else {
        setProfile(null)
      }
    } catch (error) {
      console.error('Error loading user:', error)
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUser()

    // Listen to auth changes
    const { data: { subscription } } = onAuthStateChange((user) => {
      if (user) {
        loadUser()
      } else {
        setUser(null)
        setProfile(null)
        router.push('/login')
      }
    })

    return () => {
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

