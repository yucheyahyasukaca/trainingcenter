# 🔍 DIAGNOSIS: Login Error "Database error querying schema"

## 📊 Error Analysis

### **Error Message:**
```
Login Gagal
Database error querying schema
```

### **Root Cause Identified:**
❌ **Table `user_profiles` TIDAK ADA di database!**

---

## 🧪 Apa Yang Terjadi?

### **Login Flow:**
```
1. User memasukkan email & password
   ↓
2. Supabase Auth memverifikasi credentials
   ↓
3. ✅ Auth berhasil → User authenticated
   ↓
4. App mencoba query user_profiles table
   ↓
5. ❌ ERROR: Table user_profiles tidak ditemukan!
   ↓
6. 💥 "Database error querying schema"
```

### **Code Location:**
File: `lib/auth.ts` (line 26-30)
```typescript
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')  // ← Table ini TIDAK ADA!
    .select('*')
    .eq('id', userId)
    .single()
  // ...
}
```

---

## 🔬 Technical Details

### **Expected Database Schema:**

✅ **Tables yang HARUS ada:**
1. `trainers` ← Ada (dari schema.sql)
2. `programs` ← Ada (dari schema.sql)
3. `participants` ← Ada (dari schema.sql)
4. `enrollments` ← Ada (dari schema.sql)
5. `user_profiles` ← ❌ **MISSING!** (seharusnya dari auth-setup.sql)

### **user_profiles Table Structure:**
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMP,
  email VARCHAR(255),
  full_name VARCHAR(255),
  role VARCHAR(50) CHECK (role IN ('admin', 'manager', 'user')),
  avatar_url TEXT,
  updated_at TIMESTAMP
);
```

---

## 💡 Why This Happened?

### **Possible Causes:**

**1. Schema tidak lengkap dijalankan**
```
✅ schema.sql dijalankan (trainers, programs, dll exist)
❌ auth-setup.sql TIDAK dijalankan (user_profiles missing)
```

**2. Script dijalankan tidak berurutan**
```
Urutan yang benar:
1. schema.sql
2. auth-setup.sql     ← SKIP/LUPA
3. create-sample-users.sql
```

**3. RLS Policy conflict**
```
Table dibuat tapi RLS policy block queries
```

---

## ✅ SOLUTION: 3 Steps

### **STEP 1: Create Missing Table**
Run: `supabase/COMPLETE_FIX.sql`

**Apa yang dilakukan:**
- ✅ Create table `user_profiles`
- ✅ Disable RLS untuk development
- ✅ Create auto-trigger untuk new users
- ✅ Fix policies

### **STEP 2: Create Sample Users**
Method A: Via Dashboard (RECOMMENDED)
Method B: Via SQL Script

**Apa yang dilakukan:**
- ✅ Create 3 users di auth.users
- ✅ Create 3 profiles di user_profiles
- ✅ Set roles (admin, manager, user)

### **STEP 3: Test Login**
```
Email: admin@garuda21.com
Password: admin123
```

---

## 📋 Verification Queries

### **Check if user_profiles exists:**
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles';
```

**Expected:** 1 row (user_profiles)
**If empty:** Table tidak ada, run COMPLETE_FIX.sql

---

### **Check table structure:**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;
```

**Expected Columns:**
- id (uuid, NO)
- created_at (timestamp with time zone, NO)
- email (character varying, NO)
- full_name (character varying, NO)
- role (character varying, YES)
- avatar_url (text, YES)
- updated_at (timestamp with time zone, YES)

---

### **Check users exist:**
```sql
-- Check auth users
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email LIKE '%garuda21.com';

-- Check user profiles
SELECT id, email, full_name, role 
FROM user_profiles 
WHERE email LIKE '%garuda21.com';
```

**Expected:** 3 users in each table

---

## 🎯 Quick Fix Command

**All-in-One SQL Script:**

```sql
-- 1. Create table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Disable RLS for development
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 3. Create trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Verify
SELECT 'Table created successfully!' as status;
```

---

## 📝 After Fix Checklist

- [ ] `user_profiles` table exists
- [ ] Table has correct structure (7 columns)
- [ ] RLS disabled (untuk development)
- [ ] Trigger `on_auth_user_created` exists
- [ ] 3 sample users created in `auth.users`
- [ ] 3 profiles exist in `user_profiles`
- [ ] All profiles have correct roles
- [ ] Login works with admin@garuda21.com
- [ ] Dashboard accessible after login

---

## 🚀 Next Steps

1. **Run COMPLETE_FIX.sql** di Supabase SQL Editor
2. **Create users** via Dashboard atau SQL
3. **Test login** di aplikasi
4. **Verify access** ke dashboard

---

## 📚 Related Files

- `supabase/COMPLETE_FIX.sql` → Run this first!
- `supabase/CREATE_USERS_DASHBOARD.md` → Guide to create users
- `FIX_LOGIN_SEKARANG.md` → Step-by-step fix guide
- `TROUBLESHOOT_LOGIN.md` → Comprehensive troubleshooting

---

**Diagnosis Complete! Follow the fix steps above to resolve the issue. 🎯**

