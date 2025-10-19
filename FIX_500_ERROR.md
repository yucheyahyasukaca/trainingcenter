# 🚨 FIX: 500 Internal Server Error

## ❌ Error yang Terjadi:
```
POST https://hrxhnlzdtzyvoxzqznnl.supabase.co/auth/v1/token?grant_type=password 500 (Internal Server Error)
```

## 🔍 Root Cause:
Supabase server error saat authentication. Kemungkinan:
1. Database schema tidak lengkap
2. RLS policies conflict
3. Missing tables

---

## ⚡ QUICK FIX (3 Steps):

### **STEP 1: Check Supabase Project Status**

1. **Buka:** https://app.supabase.com
2. **Pilih project Anda**
3. **Check status** di dashboard (harus hijau/active)

**Jika project tidak aktif:**
- Tunggu beberapa menit
- Atau restart project

---

### **STEP 2: Run Complete Fix Script**

**Buka SQL Editor di Supabase Dashboard:**

```sql
-- Copy paste SEMUA content dari file: supabase/COMPLETE_FIX.sql
-- Kemudian klik RUN
```

**Expected Result:**
```
✅ Table created successfully!
```

---

### **STEP 3: Verify Database**

**Run query ini di SQL Editor:**

```sql
-- Check if all tables exist
SELECT 
  schemaname,
  tablename
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('trainers', 'programs', 'participants', 'enrollments', 'user_profiles')
ORDER BY tablename;

-- Expected: 5 tables (user_profiles PENTING!)
```

**Jika user_profiles tidak ada:**
- Ulangi STEP 2
- Pastikan COMPLETE_FIX.sql dijalankan dengan benar

---

## 🔧 Alternative Fix (Jika masih error):

### **Method 1: Reset RLS Policies**

```sql
-- Disable RLS untuk semua tables
ALTER TABLE IF EXISTS trainers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "Enable read access for all users" ON trainers;
DROP POLICY IF EXISTS "Enable insert for all users" ON trainers;
DROP POLICY IF EXISTS "Enable update for all users" ON trainers;
DROP POLICY IF EXISTS "Enable delete for all users" ON trainers;

-- Repeat for other tables...
```

### **Method 2: Check Environment Variables**

**File:** `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://hrxhnlzdtzyvoxzqznnl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Verify di Supabase Dashboard:**
- Settings → API
- Copy URL dan anon key yang benar

---

## 🧪 Test After Fix:

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **Test login:**
   - Email: `admin@garuda21.com`
   - Password: `admin123`

3. **Check console:**
   - Tidak ada error 500
   - Login berhasil

---

## 📊 Verification Queries:

```sql
-- 1. Check tables
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles';

-- 2. Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles';

-- 3. Test basic query
SELECT COUNT(*) FROM user_profiles;
```

---

## 🚨 If Still Error 500:

### **Check Supabase Logs:**

1. **Dashboard → Logs**
2. **Filter by "Error"**
3. **Look for specific error message**

### **Common Issues:**

**Issue 1: "relation does not exist"**
```sql
-- Re-run schema.sql
-- File: supabase/schema.sql
```

**Issue 2: "permission denied"**
```sql
-- Disable RLS (already in COMPLETE_FIX.sql)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
```

**Issue 3: "function does not exist"**
```sql
-- Re-run auth-setup.sql
-- File: supabase/auth-setup.sql
```

---

## ✅ Success Indicators:

- [ ] No 500 error in console
- [ ] Login successful
- [ ] Dashboard accessible
- [ ] All 5 tables exist
- [ ] RLS disabled for development

---

## 🎯 Next Steps:

1. **Run COMPLETE_FIX.sql** (paling penting!)
2. **Check project status** di Supabase
3. **Test login** lagi
4. **Check console** - tidak ada error

---

**Error 500 biasanya fixed setelah run COMPLETE_FIX.sql! 🚀**
