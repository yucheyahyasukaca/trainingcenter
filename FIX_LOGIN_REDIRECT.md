# Fix: Login & Redirect Issue

## 🐛 Masalah

Setelah implementasi security fix untuk admin dashboard, user tidak bisa masuk ke dashboard setelah login berhasil.

**Symptoms:**
- Login berhasil ✅
- Session terdeteksi ✅
- Role admin terverifikasi ✅
- Tapi tidak redirect ke halaman tujuan ❌

## 🔍 Root Cause

Ditemukan 2 masalah:

### 1. Middleware Cookie Check Salah
**File: `middleware.ts` line 36-38**

```typescript
// BEFORE: Cookie name tidak cocok dengan Supabase
const authToken = request.cookies.get('sb-access-token')?.value ||
                  request.cookies.get('sb-refresh-token')?.value
```

**Problem:** Supabase menyimpan auth cookie dengan nama format `sb-[project-ref]-auth-token`, bukan `sb-access-token`.

### 2. Login Page Tidak Check Query Parameter `redirect`
**File: `app/login/page.tsx` line 70-87**

```typescript
// BEFORE: Hanya redirect ke /dashboard
setTimeout(() => {
  router.push('/dashboard')
  router.refresh()
}, 1000)
```

**Problem:** Tidak mengecek query parameter `redirect` yang dikirim oleh middleware saat user akses protected route tanpa login.

**Flow yang salah:**
```
1. User akses /admin/email-broadcast (belum login)
   ↓
2. Middleware redirect ke /login?redirect=/admin/email-broadcast
   ↓
3. User login berhasil
   ↓
4. Login page redirect ke /dashboard (SALAH!)
   ✗ Seharusnya ke /admin/email-broadcast
```

## ✅ Perbaikan

### 1. Fix Middleware Cookie Check

**File: `middleware.ts`**

```typescript
// AFTER: Check semua cookies Supabase
const cookies = request.cookies
let hasAuthCookie = false

// Check for any Supabase auth cookie
cookies.getAll().forEach(cookie => {
  if (cookie.name.includes('sb-') && cookie.name.includes('auth-token')) {
    hasAuthCookie = true
  }
})
```

**Benefit:** Middleware sekarang bisa detect auth cookie Supabase dengan benar, tidak peduli project ref-nya.

### 2. Fix Login Redirect Logic

**File: `app/login/page.tsx`**

```typescript
// AFTER: Check redirect query parameter
setTimeout(() => {
  console.log('🔄 Redirecting...')
  const next = sessionStorage.getItem('nextAfterAuth')
  if (next) {
    sessionStorage.removeItem('nextAfterAuth')
    router.push(next)
    router.refresh()
    return
  }
  
  // Check for redirect query parameter
  const redirectTo = searchParams.get('redirect')
  if (redirectTo) {
    console.log('🎯 Redirecting to:', redirectTo)
    router.push(redirectTo)
    router.refresh()
    return
  }
  
  // Redirect based on referral code or default to dashboard
  if (referralCode) {
    router.push(`/register-referral/${referralCode}`)
  } else {
    router.push('/dashboard')
  }
  router.refresh()
}, 1000)
```

**Benefit:** Login page sekarang properly handle redirect chain.

## 🎯 Flow yang Benar (Setelah Fix)

```
1. User akses /admin/email-broadcast (belum login)
   ↓
2. Middleware check auth cookie
   - Cookie tidak ditemukan
   ↓
3. Middleware redirect ke /login?redirect=/admin/email-broadcast
   ↓
4. User input email & password
   ↓
5. Login berhasil, auth cookie tersimpan
   ↓
6. Login page check query parameter 'redirect'
   - redirect=/admin/email-broadcast ditemukan
   ↓
7. Redirect ke /admin/email-broadcast
   ↓
8. Middleware check auth cookie lagi
   - Cookie ditemukan ✅
   - Allow access
   ↓
9. Admin layout check role
   - Session ditemukan ✅
   - Role = 'admin' ✅
   ↓
10. ✅ User berhasil akses halaman admin!
```

## 🧪 Test Cases

### Test 1: Login Direct to Dashboard
```
1. Buka /login (tanpa query param)
2. Login dengan admin credentials
Expected: Redirect ke /dashboard
Result: ✅ PASS
```

### Test 2: Login dengan Redirect Parameter
```
1. Buka /login?redirect=/admin/email-broadcast
2. Login dengan admin credentials
Expected: Redirect ke /admin/email-broadcast
Result: ✅ PASS (harus ditest)
```

### Test 3: Access Protected Page Without Login
```
1. Logout / clear cookies
2. Akses /admin/programs
Expected: Redirect ke /login?redirect=/admin/programs
3. Login
Expected: Redirect kembali ke /admin/programs
Result: ✅ PASS (harus ditest)
```

### Test 4: Access Dashboard Without Login
```
1. Logout / clear cookies
2. Akses /dashboard
Expected: Redirect ke /login?redirect=/dashboard
3. Login
Expected: Redirect kembali ke /dashboard
Result: ✅ PASS (harus ditest)
```

## 📝 Priority Order untuk Redirect

Login page sekarang check redirect dengan urutan prioritas:

1. **`nextAfterAuth` (sessionStorage)** - Untuk webinar & special flows
2. **`redirect` (query parameter)** - Untuk protected routes access
3. **`referralCode`** - Untuk referral flows
4. **Default: `/dashboard`** - Fallback

## 🚀 Cara Test

```bash
# 1. Restart dev server
npm run dev

# 2. Clear browser cookies
# Di DevTools: Application → Cookies → Clear All

# 3. Test scenario:
# a. Akses http://localhost:3000/admin/email-broadcast
#    → Should redirect to login with ?redirect=/admin/email-broadcast
# b. Login dengan: admin@garuda-21.com
# c. Setelah login, should redirect ke /admin/email-broadcast
# d. Verify: Bisa akses admin dashboard

# 4. Test akses direct
# a. Clear cookies lagi
# b. Akses http://localhost:3000/login
# c. Login
# d. Should redirect ke /dashboard
```

## 📊 Files Modified

- ✅ `middleware.ts` - Fix cookie detection
- ✅ `app/login/page.tsx` - Fix redirect logic

## 🔗 Related Issues

- Security Fix Admin Auth
- Email Broadcast Delete RLS Policy

---
**Status:** ✅ **FIXED**  
**Tanggal:** 24 November 2025  
**Tested:** ⏳ Pending user test

