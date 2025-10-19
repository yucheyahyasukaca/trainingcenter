# 🚨 FIX LOGIN SEKARANG - INSTRUKSI SUPER SIMPLE

## ❌ ERROR:
```
Login Gagal
Database error querying schema
```

---

## ✅ SOLUSI (Ikuti Step-by-Step):

### 📍 **STEP 1: Buka Supabase Dashboard**

1. Buka browser baru
2. Go to: **https://app.supabase.com**
3. Login dengan akun Supabase Anda
4. **Pilih project Anda** (GARUDA-21 Training Center)

---

### 📍 **STEP 2: Buka SQL Editor**

1. Di sidebar kiri, cari dan klik: **"SQL Editor"**
2. Klik tombol: **"+ New Query"**

---

### 📍 **STEP 3: Copy & Paste SQL**

**IMPORTANT:** Copy **SEMUA** text di bawah ini (Ctrl+A, Ctrl+C):

```sql
-- Create table user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles';
```

**Paste** di SQL Editor (Ctrl+V)

---

### 📍 **STEP 4: Run SQL**

1. Klik tombol **"RUN"** (atau tekan Ctrl+Enter)
2. Tunggu beberapa detik

**✅ EXPECTED RESULT:**
```
tablename
-----------
user_profiles
```

Jika muncul ini, BERHASIL! ✅

---

### 📍 **STEP 5: Create Users**

Masih di Supabase Dashboard:

1. Klik **"Authentication"** di sidebar kiri
2. Klik **"Users"**
3. Klik tombol **"Add User"** (hijau, kanan atas)

**CREATE USER INI:**
```
Email: admin@garuda21.com
Password: admin123
Auto Confirm User: ✅ TURN ON (PENTING!)
```

4. Klik **"Create User"**

✅ User created!

---

### 📍 **STEP 6: Set Role Admin**

1. Kembali ke **SQL Editor**
2. Klik **"+ New Query"**
3. Copy paste SQL ini:

```sql
-- Insert profile untuk admin
INSERT INTO user_profiles (id, email, full_name, role)
SELECT id, email, 'Admin GARUDA-21', 'admin'
FROM auth.users 
WHERE email = 'admin@garuda21.com'
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT email, full_name, role FROM user_profiles;
```

4. Klik **"RUN"**

**✅ EXPECTED RESULT:**
```
email                  | full_name        | role
-----------------------|------------------|------
admin@garuda21.com     | Admin GARUDA-21  | admin
```

---

### 📍 **STEP 7: Test Login**

1. **Di terminal, restart dev server:**
   ```bash
   npm run dev
   ```

2. **Buka browser:** http://localhost:3000/login

3. **Login dengan:**
   ```
   Email: admin@garuda21.com
   Password: admin123
   ```

4. **Klik "Login"**

---

## ✅ **EXPECTED RESULT:**

```
✅ Login berhasil!
✅ Redirect ke /dashboard
✅ Tidak ada error di console
✅ Muncul nama "Admin GARUDA-21" di header
```

---

## 🚨 **JIKA MASIH ERROR:**

### **Error: "Table already exists"**
```
✅ Table sudah ada, skip ke STEP 5
```

### **Error: "Invalid login credentials"**

Run SQL ini di SQL Editor:
```sql
-- Check if user exists
SELECT id, email, email_confirmed_at FROM auth.users 
WHERE email = 'admin@garuda21.com';

-- If email_confirmed_at is NULL, fix it:
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'admin@garuda21.com';
```

### **Error: masih "Database error querying schema"**

Verify table exists:
```sql
-- Check tables
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Harus ada: `user_profiles`

Jika TIDAK ADA, ulangi STEP 3

---

## 📊 **VERIFICATION CHECKLIST:**

Sebelum test login, pastikan:

- [ ] Table `user_profiles` ada di database
- [ ] User `admin@garuda21.com` ada di Authentication
- [ ] Email confirmed (email_confirmed_at NOT NULL)
- [ ] Profile ada di user_profiles table
- [ ] Role = 'admin'
- [ ] Dev server sudah restart

---

## 🎯 **QUICK VERIFICATION:**

Run query ini untuk check semua:

```sql
-- Check everything
SELECT 
  'Tables' as check_type,
  COUNT(*)::text as result
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'user_profiles'

UNION ALL

SELECT 
  'Auth Users',
  COUNT(*)::text
FROM auth.users 
WHERE email = 'admin@garuda21.com'

UNION ALL

SELECT 
  'User Profiles',
  COUNT(*)::text
FROM user_profiles
WHERE email = 'admin@garuda21.com';
```

**EXPECTED:**
```
check_type     | result
---------------|-------
Tables         | 1
Auth Users     | 1
User Profiles  | 1
```

Semua harus = 1 ✅

---

## 📞 **MASIH BUTUH BANTUAN?**

Beri tahu saya hasil dari:

1. ✅ Apakah table `user_profiles` berhasil dibuat? (STEP 3)
2. ✅ Apakah user berhasil dibuat? (STEP 5)
3. ✅ Apakah profile berhasil di-insert? (STEP 6)
4. ❌ Error apa yang muncul saat login? (STEP 7)

---

**Ikuti STEP 1-7 dengan teliti, login pasti berhasil! 🚀**

