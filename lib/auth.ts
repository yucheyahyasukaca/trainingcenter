import { supabase } from './supabase'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'user'
  avatar_url?: string
  created_at: string
  updated_at: string
}

// Get current user session
export async function getCurrentUser() {
  console.log('🔍 Getting current user session...')
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Error getting session:', error)
      return null
    }
    
    if (!session) {
      console.log('❌ No active session')
      return null
    }
    
    console.log('✅ Session found:', session.user?.email)
    return session.user
  } catch (err) {
    console.error('❌ Exception in getCurrentUser:', err)
    return null
  }
}

// Get user profile
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  console.log('🔍 Getting user profile for ID:', userId)
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('❌ Error fetching user profile:', error)
      return null
    }
    
    console.log('✅ User profile found:', data)
    return data
  } catch (err) {
    console.error('❌ Exception in getUserProfile:', err)
    return null
  }
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    throw new Error(error.message)
  }
  
  return data
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw new Error(error.message)
  }
}

// Sign up new user
export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })
  
  if (error) {
    throw new Error(error.message)
  }
  
  return data
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

// Check if user has specific role
export async function hasRole(role: 'admin' | 'manager' | 'user'): Promise<boolean> {
  const user = await getCurrentUser()
  
  if (!user) return false
  
  const profile = await getUserProfile(user.id)
  
  if (!profile) return false
  
  if (role === 'admin') {
    return profile.role === 'admin'
  } else if (role === 'manager') {
    return profile.role === 'admin' || profile.role === 'manager'
  }
  
  return true
}

// Listen to auth state changes
export function onAuthStateChange(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
}

