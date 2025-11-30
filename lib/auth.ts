import { supabase } from './supabase'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'user' | 'trainer'
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
  console.log('🚪 Starting sign out...')

  // Clear all localStorage items first
  if (typeof window !== 'undefined') {
    try {
      // Clear all localStorage
      const keys = Object.keys(localStorage)
      keys.forEach(key => localStorage.removeItem(key))

      // Clear session storage
      sessionStorage.clear()

      console.log('✅ Local storage cleared')
    } catch (err) {
      console.warn('⚠️ Error clearing storage:', err)
    }
  }

  // Try to sign out from server (but don't fail if it errors)
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.warn('⚠️ Server sign out error (storage already cleared):', error.message)
    } else {
      console.log('✅ Server sign out successful')
    }
  } catch (err: any) {
    console.warn('⚠️ Exception in server sign out (storage already cleared):', err)
  }

  return true
}

// Sign up new user using API route (bypass email confirmation)
export async function signUp(email: string, password: string, fullName: string) {
  console.log('🚀 Starting sign up for:', email)

  try {
    // Use API route to bypass email confirmation
    const response = await fetch('/api/signup-without-email-confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        fullName
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create user')
    }

    console.log('✅ User created successfully via API route:', result.user.email)
    console.log('📧 Email confirmed:', !!result.user.confirmed_at)
    console.log('✅ User profile created:', !!result.profile)
    console.log('✅ Participant created:', !!result.participant)

    // Return data in same format as original signUp
    return {
      user: result.user,
      session: null // User needs to login after registration
    }

  } catch (error: any) {
    console.error('❌ Sign up error:', error)

    // Better error handling for common issues
    if (error.message.includes('email') || error.message.includes('already registered')) {
      throw new Error('Email sudah terdaftar. Jika Anda sudah pernah registrasi sebelumnya, silakan coba login. Jika tidak, hubungi administrator untuk reset email.')
    }
    if (error.message.includes('password')) {
      throw new Error('Password terlalu lemah. Gunakan minimal 8 karakter.')
    }
    if (error.message.includes('confirmation') || error.message.includes('sending')) {
      throw new Error('Gagal mengirim email konfirmasi. Email confirmation mungkin masih aktif di Supabase. Hubungi administrator untuk disable email confirmation.')
    }
    if (error.message.includes('rate limit')) {
      throw new Error('Terlalu banyak percobaan. Silakan tunggu beberapa menit.')
    }
    if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
      throw new Error('Server error. Kemungkinan email confirmation masih aktif di Supabase. Hubungi administrator.')
    }
    throw new Error(error.message)
  }
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

// Sign in with Google
export async function signInWithGoogle() {
  console.log('🚀 Starting Google sign in...')

  try {
    if (typeof window === 'undefined') {
      throw new Error('signInWithGoogle must be called from client-side')
    }

    // Explicitly set redirect URL to current origin + /auth/callback
    // This ensures it works on localhost:3000 even if Supabase is configured for production
    let origin = window.location.origin

    // Force HTTP for localhost to avoid SSL errors
    if (window.location.hostname === 'localhost' && origin.startsWith('https://')) {
      console.log('⚠️ Detected HTTPS on localhost, forcing HTTP for redirect URI')
      origin = origin.replace('https://', 'http://')
    }

    const redirectTo = `${origin}/auth/callback`
    console.log('🔗 Using redirect URI:', redirectTo)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        skipBrowserRedirect: false
      }
    })

    if (error) {
      console.error('❌ Google sign in error:', error)
      throw new Error(error.message)
    }

    console.log('✅ Google sign in initiated, redirecting to:', data.url)
    return data
  } catch (err: any) {
    console.error('❌ Exception in Google sign in:', err)
    throw new Error(err.message || 'Failed to sign in with Google')
  }
}

// Sign in with Google ID Token (GIS Flow)
export async function signInWithIdToken(token: string, nonce?: string) {
  console.log('🚀 Starting Google ID Token sign in...')

  try {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token,
      nonce
    })

    if (error) {
      console.error('❌ Google ID Token sign in error:', error)
      throw new Error(error.message)
    }

    console.log('✅ Google ID Token sign in successful')
    return data
  } catch (err: any) {
    console.error('❌ Exception in Google ID Token sign in:', err)
    throw new Error(err.message || 'Failed to sign in with Google ID Token')
  }
}

