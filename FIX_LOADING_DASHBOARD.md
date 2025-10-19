# 🔄 FIX: Loading Dashboard Terus Menerus

## ❌ Problem:
- Dashboard loading terus menerus
- Tidak bisa masuk ke dashboard
- AuthProvider stuck di loading state

## 🔍 Root Cause:
Kemungkinan:
1. **getUserProfile function error** (Database error querying schema)
2. **Auth state tidak persist**
3. **User profile tidak ada** di database

---

## ✅ SOLUTION:

### **STEP 1: Check Console Logs**

Buka browser console (F12) dan lihat apa yang muncul:

**Expected logs:**
```
🔄 Loading user...
👤 Current user: [user object]
📋 Loading user profile...
👤 User profile: [profile object]
🏠 Dashboard loaded
```

**Jika stuck di:**
- `🔄 Loading user...` → Auth state problem
- `📋 Loading user profile...` → Database query problem

### **STEP 2: Fix getUserProfile Function**

**Edit file:** `lib/auth.ts`

```typescript
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
```

### **STEP 3: Add Fallback untuk Missing Profile**

**Edit file:** `components/AuthProvider.tsx`

```typescript
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
          role: 'user' as const,
          avatar_url: null,
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
```

### **STEP 4: Test Step by Step**

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **Login:**
   - Email: `admin@garuda21.com`
   - Password: `admin123`

3. **Check console logs:**
   - Apakah ada error di getUserProfile?
   - Apakah user profile ditemukan?

4. **Check dashboard:**
   - Apakah loading berhenti?
   - Apakah dashboard muncul?

---

## 🚨 **Jika Masih Loading:**

### **Quick Fix: Bypass Profile Check**

**Edit file:** `components/AuthProvider.tsx`

```typescript
async function loadUser() {
  try {
    console.log('🔄 Loading user...')
    const currentUser = await getCurrentUser()
    console.log('👤 Current user:', currentUser)
    setUser(currentUser)
    
    if (currentUser) {
      // Skip profile check for now
      console.log('⚠️ Skipping profile check...')
      const defaultProfile = {
        id: currentUser.id,
        email: currentUser.email || '',
        full_name: currentUser.user_metadata?.full_name || currentUser.email || 'User',
        role: 'admin' as const,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setProfile(defaultProfile)
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
```

---

## 📊 **Expected Result:**

Setelah fix, console harus menampilkan:

```
🔄 Loading user...
👤 Current user: [user object]
📋 Loading user profile...
✅ User profile found: [profile object]
🏠 Dashboard loaded
👤 User: [user object]
📋 Profile: [profile object]
⏳ Loading: false
```

Dan dashboard harus muncul dengan:
- Nama user
- Role (admin/manager/user)
- Data dashboard

---

## 🎯 **Next Steps:**

1. **Add debug logging** ke getUserProfile
2. **Add fallback** untuk missing profile
3. **Test step by step**
4. **Check console** untuk error

---

**Dengan fix ini, loading dashboard akan berhenti dan dashboard akan muncul! 🚀**
