# 👥 Cara Membuat Sample Users via Supabase Dashboard

## 📌 Metode Ini PALING MUDAH dan DIJAMIN BERHASIL!

---

## 🎯 Step-by-Step Guide

### **STEP 1: Buka Supabase Dashboard**

1. Go to: https://app.supabase.com
2. Login dengan akun Supabase Anda
3. Pilih project Anda (GARUDA-21 Training Center)

---

### **STEP 2: Create Users**

1. **Klik "Authentication"** di sidebar kiri
2. **Klik "Users"** 
3. **Klik tombol "Add User"** (hijau, di kanan atas)

---

### **STEP 3: Buat Admin User**

Fill in form:
- **Email**: `admin@garuda21.com`
- **Password**: `admin123`
- **Auto Confirm User?**: ✅ **TURN ON** (penting!)
- Klik **"Create User"**

✅ User admin berhasil dibuat!

---

### **STEP 4: Buat Manager User**

Klik **"Add User"** lagi:
- **Email**: `manager@garuda21.com`
- **Password**: `manager123`
- **Auto Confirm User?**: ✅ **TURN ON**
- Klik **"Create User"**

✅ User manager berhasil dibuat!

---

### **STEP 5: Buat Regular User**

Klik **"Add User"** lagi:
- **Email**: `user@garuda21.com`
- **Password**: `user123`
- **Auto Confirm User?**: ✅ **TURN ON**
- Klik **"Create User"**

✅ User biasa berhasil dibuat!

---

### **STEP 6: Update User Roles**

Setelah semua users dibuat, kita perlu set role mereka:

1. **Klik "SQL Editor"** di sidebar
2. **Klik "New Query"**
3. **Copy paste SQL ini**:

```sql
-- Update Admin Role
UPDATE user_profiles 
SET role = 'admin', full_name = 'Admin GARUDA-21'
WHERE email = 'admin@garuda21.com';

-- Update Manager Role
UPDATE user_profiles 
SET role = 'manager', full_name = 'Manager GARUDA-21'
WHERE email = 'manager@garuda21.com';

-- Update User Role
UPDATE user_profiles 
SET role = 'user', full_name = 'User GARUDA-21'
WHERE email = 'user@garuda21.com';

-- Verify
SELECT email, full_name, role, created_at 
FROM user_profiles 
WHERE email LIKE '%garuda21.com'
ORDER BY role;
```

4. **Klik "Run"** (atau Ctrl + Enter)

---

### **STEP 7: Verify Users Created**

Anda seharusnya melihat hasil query seperti ini:

| email | full_name | role | created_at |
|-------|-----------|------|------------|
| admin@garuda21.com | Admin GARUDA-21 | admin | 2025-10-19... |
| manager@garuda21.com | Manager GARUDA-21 | manager | 2025-10-19... |
| user@garuda21.com | User GARUDA-21 | user | 2025-10-19... |

✅ **Semua users berhasil dibuat dengan role yang benar!**

---

## 🧪 Test Login

1. **Buka aplikasi Anda**: http://localhost:3000/login
2. **Test dengan Admin**:
   - Email: `admin@garuda21.com`
   - Password: `admin123`
3. **Klik "Login"**

✅ **Seharusnya berhasil dan masuk ke Dashboard!**

---

## 🔍 Troubleshooting

### Jika Update Role Gagal:

**Error**: `UPDATE 0` (tidak ada rows yang diupdate)

**Penyebab**: Profile belum auto-generate

**Solusi**: Manual insert profiles

```sql
-- Check apakah user_profiles kosong
SELECT * FROM user_profiles WHERE email LIKE '%garuda21.com';

-- Jika kosong, insert manual:
INSERT INTO user_profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email),
  'user'
FROM auth.users 
WHERE email IN ('admin@garuda21.com', 'manager@garuda21.com', 'user@garuda21.com')
ON CONFLICT (id) DO NOTHING;

-- Kemudian update roles:
UPDATE user_profiles SET role = 'admin' WHERE email = 'admin@garuda21.com';
UPDATE user_profiles SET role = 'manager' WHERE email = 'manager@garuda21.com';
UPDATE user_profiles SET role = 'user' WHERE email = 'user@garuda21.com';
```

---

### Jika Login Masih Gagal:

**Check 1**: Pastikan users ada
```sql
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email LIKE '%garuda21.com';
```

**Check 2**: Pastikan email_confirmed_at tidak NULL
```sql
-- Fix unconfirmed emails
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email LIKE '%garuda21.com' 
  AND email_confirmed_at IS NULL;
```

**Check 3**: Pastikan table user_profiles ada
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles';
```

Jika tidak ada, jalankan: `supabase/COMPLETE_FIX.sql`

---

## 📊 Summary

**3 Users Created:**
1. ✅ admin@garuda21.com (role: admin)
2. ✅ manager@garuda21.com (role: manager)
3. ✅ user@garuda21.com (role: user)

**Password untuk semua**: Sesuai yang Anda set di form

**Next Steps:**
- Test login di aplikasi
- Jika berhasil, users sudah siap digunakan!
- Jika gagal, check troubleshooting di atas

---

**Metode ini 100% berhasil karena menggunakan Supabase Auth API yang sudah built-in! 🚀**

