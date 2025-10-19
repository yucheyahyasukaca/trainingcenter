# 🔍 DEBUG: Login Tidak Ada Aktivitas di Console

## ❌ Problem:
- Login form tidak ada aktivitas
- Console tidak ada error
- Tidak ada network request ke Supabase

## 🔍 Root Cause:
Kemungkinan **environment variables** tidak ter-load atau **Supabase client** tidak ter-initialize.

---

## ✅ SOLUTION:

### **STEP 1: Check Environment Variables**

**File:** `.env.local` (di root project)

```env
NEXT_PUBLIC_SUPABASE_URL=https://hrxhnlzdtzyvoxzqznnl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Verify di Supabase Dashboard:**
1. Settings → API
2. Copy URL dan anon key yang benar

### **STEP 2: Add Debug Logging**

**Edit file:** `app/login/page.tsx`

```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  setLoading(true)
  setError('')

  // Add debug logging
  console.log('🔍 Login attempt started')
  console.log('📧 Email:', formData.email)
  console.log('🔑 Password:', formData.password)
  console.log('🌐 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('🔑 Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  try {
    console.log('🚀 Calling signIn function...')
    await signIn(formData.email, formData.password)
    console.log('✅ Login successful!')
    router.push('/dashboard')
    router.refresh()
  } catch (err: any) {
    console.error('❌ Login error:', err)
    setError(err.message || 'Login gagal. Periksa email dan password Anda.')
  } finally {
    setLoading(false)
  }
}
```

### **STEP 3: Check Supabase Client**

**Edit file:** `lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Add debug logging
console.log('🔧 Supabase Config:')
console.log('URL:', supabaseUrl)
console.log('Key exists:', !!supabaseAnonKey)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Test connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase connection error:', error)
  } else {
    console.log('✅ Supabase connected successfully')
  }
})
```

### **STEP 4: Test Step by Step**

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser console** (F12)

3. **Try login** dengan email/password

4. **Check console output:**
   - Apakah ada log "Login attempt started"?
   - Apakah ada log "Supabase Config"?
   - Apakah ada error "Missing environment variables"?

### **STEP 5: Manual Test Supabase Connection**

**Di browser console, jalankan:**

```javascript
// Test Supabase connection
fetch('https://hrxhnlzdtzyvoxzqznnl.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'YOUR_ANON_KEY_HERE',
    'Authorization': 'Bearer YOUR_ANON_KEY_HERE'
  }
})
.then(response => {
  console.log('✅ Supabase API accessible:', response.status)
})
.catch(error => {
  console.error('❌ Supabase API error:', error)
})
```

---

## 🚨 **Common Issues:**

### **Issue 1: Environment Variables Not Loaded**
```
Error: Missing Supabase environment variables!
```
**Solution:** Check `.env.local` file exists and has correct values

### **Issue 2: Supabase URL/Key Wrong**
```
Error: Supabase connection error
```
**Solution:** Verify URL dan key di Supabase Dashboard

### **Issue 3: Network Blocked**
```
Error: Failed to fetch
```
**Solution:** Check firewall/proxy settings

### **Issue 4: CORS Error**
```
Error: CORS policy
```
**Solution:** Check Supabase project settings

---

## 📊 **Expected Console Output:**

Jika semua OK, console harus menampilkan:

```
🔧 Supabase Config:
URL: https://hrxhnlzdtzyvoxzqznnl.supabase.co
Key exists: true
✅ Supabase connected successfully
🔍 Login attempt started
📧 Email: admin@garuda21.com
🔑 Password: admin123
🌐 Supabase URL: https://hrxhnlzdtzyvoxzqznnl.supabase.co
🔑 Supabase Key exists: true
🚀 Calling signIn function...
✅ Login successful!
```

---

## 🎯 **Next Steps:**

1. **Add debug logging** ke login page
2. **Check environment variables**
3. **Test step by step**
4. **Check console output**
5. **Fix issues** berdasarkan error yang muncul

---

**Dengan debug logging ini, kita bisa tahu persis di mana masalahnya! 🔍**
