# 🎯 ACTION PLAN: Fix Login Error

## ❌ Current Problem
```
Login Gagal
Database error querying schema
```

## ✅ Solution: Follow 3 Simple Steps Below

---

## 🚀 STEP 1: Fix Database Schema (2 menit)

### **Action:**
1. Buka **Supabase Dashboard**: https://app.supabase.com
2. Pilih **Project Anda**
3. Klik **SQL Editor** di sidebar
4. Klik **"+ New Query"**
5. Copy paste **SEMUA** content dari file: `supabase/COMPLETE_FIX.sql`
6. Klik **RUN** atau tekan `Ctrl + Enter`

### **Expected Result:**
```
✅ Table created successfully!
```

### **Verify:**
Scroll ke bawah, Anda akan melihat list tables:
```
- enrollments
- participants
- programs
- trainers
- user_profiles  ← PENTING! Harus ada!
```

---

## 👥 STEP 2: Create Users (3 menit)

### **Method A: Via Dashboard (RECOMMENDED)** ⭐

1. Di Supabase Dashboard, klik **"Authentication"** → **"Users"**
2. Klik tombol **"Add User"** (hijau)

**Create 3 users berikut:**

#### **Admin User:**
```
Email: admin@garuda21.com
Password: admin123
Auto Confirm User: ✅ ON (PENTING!)
```
Klik "Create User"

#### **Manager User:**
```
Email: manager@garuda21.com
Password: manager123
Auto Confirm User: ✅ ON
```
Klik "Create User"

#### **Regular User:**
```
Email: user@garuda21.com
Password: user123
Auto Confirm User: ✅ ON
```
Klik "Create User"

3. **Set Roles:**
   - Kembali ke **SQL Editor**
   - Run query ini:

```sql
UPDATE user_profiles SET role = 'admin', full_name = 'Admin GARUDA-21'
WHERE email = 'admin@garuda21.com';

UPDATE user_profiles SET role = 'manager', full_name = 'Manager GARUDA-21'
WHERE email = 'manager@garuda21.com';

UPDATE user_profiles SET role = 'user', full_name = 'User GARUDA-21'
WHERE email = 'user@garuda21.com';

-- Verify
SELECT email, full_name, role FROM user_profiles;
```

### **Expected Result:**
```
3 rows updated successfully
3 users dengan roles: admin, manager, user
```

---

## 🧪 STEP 3: Test Login (1 menit)

### **Action:**
1. **Restart Development Server:**
   ```bash
   # Di terminal, tekan Ctrl+C untuk stop
   # Kemudian jalankan lagi:
   npm run dev
   ```

2. **Open Browser:** http://localhost:3000/login

3. **Test Login:**
   ```
   Email: admin@garuda21.com
   Password: admin123
   ```

4. **Klik "Login"**

### **Expected Result:**
```
✅ Login berhasil!
✅ Redirect ke /dashboard
✅ Muncul nama "Admin GARUDA-21" di header
✅ Dashboard menampilkan data
```

---

## ✅ Success Indicators

Jika SEMUA checklist ini terpenuhi, login sudah fix:

- [ ] Table `user_profiles` exists di Supabase
- [ ] 3 users created (admin, manager, user)
- [ ] 3 profiles in user_profiles dengan roles yang benar
- [ ] Login dengan admin@garuda21.com berhasil
- [ ] Dashboard accessible tanpa error
- [ ] Tidak ada error "Database error querying schema"

---

## 🚨 Troubleshooting

### Jika STEP 1 gagal:

**Error: "relation already exists"**
```sql
-- Table sudah ada, cukup verify:
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'user_profiles';
```

**Error: "permission denied"**
```
- Pastikan Anda adalah owner project
- Coba logout/login dari Supabase Dashboard
```

---

### Jika STEP 2 gagal:

**Error: "User already exists"**
```
- User sudah ada, skip ke step set roles
- Atau delete user lama di Authentication → Users
```

**Error: "UPDATE 0" (tidak ada rows updated)**
```sql
-- Profile belum auto-generate, insert manual:
INSERT INTO user_profiles (id, email, full_name, role)
SELECT id, email, email, 'user'
FROM auth.users 
WHERE email IN ('admin@garuda21.com', 'manager@garuda21.com', 'user@garuda21.com')
ON CONFLICT (id) DO NOTHING;

-- Kemudian update roles:
UPDATE user_profiles SET role = 'admin' WHERE email = 'admin@garuda21.com';
UPDATE user_profiles SET role = 'manager' WHERE email = 'manager@garuda21.com';
```

---

### Jika STEP 3 gagal:

**Error: "Invalid login credentials"**
```
Kemungkinan:
1. Password salah (case-sensitive!)
2. Email belum confirmed
   
Fix:
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'admin@garuda21.com';
```

**Error: masih "Database error querying schema"**
```
Berarti STEP 1 belum berhasil!

Verify table exists:
SELECT * FROM user_profiles LIMIT 1;

Jika error "table does not exist", ulangi STEP 1
```

---

## 📊 Verification Commands

### **Check Everything is OK:**

```sql
-- 1. Check tables
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('trainers', 'programs', 'participants', 'enrollments', 'user_profiles')
ORDER BY tablename;
-- Expected: 5 tables

-- 2. Check auth users
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email LIKE '%garuda21.com';
-- Expected: 3 users, all with email_confirmed_at NOT NULL

-- 3. Check profiles
SELECT email, full_name, role, created_at 
FROM user_profiles 
WHERE email LIKE '%garuda21.com'
ORDER BY role;
-- Expected: 3 profiles with roles: admin, manager, user

-- 4. Check counts
SELECT 
  (SELECT COUNT(*) FROM auth.users WHERE email LIKE '%garuda21.com') as auth_users,
  (SELECT COUNT(*) FROM user_profiles WHERE email LIKE '%garuda21.com') as profiles,
  (SELECT COUNT(*) FROM trainers) as trainers,
  (SELECT COUNT(*) FROM programs) as programs;
-- Expected: auth_users=3, profiles=3, trainers>=0, programs>=0
```

---

## 🎯 Summary

### **What We're Fixing:**
❌ Missing `user_profiles` table causing login to fail

### **How We Fix It:**
1. ✅ Create `user_profiles` table
2. ✅ Create sample users
3. ✅ Test login

### **Time Required:**
⏱️ Total: ~6 menit (jika lancar)

### **Files to Use:**
- `supabase/COMPLETE_FIX.sql` ← Run this!
- `FIX_LOGIN_SEKARANG.md` ← Detailed guide
- `DIAGNOSIS_LOGIN_ERROR.md` ← Technical details

---

## 🚀 Ready to Start?

1. **Open Supabase Dashboard**
2. **Follow STEP 1, 2, 3 above**
3. **Verify with checklist**
4. **Done!** 🎉

---

**Setelah mengikuti action plan ini, login akan berfungsi 100%! 💪**

Jika masih ada masalah, check file `TROUBLESHOOT_LOGIN.md` untuk troubleshooting lebih detail.

