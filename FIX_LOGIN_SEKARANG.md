# 🚀 FIX LOGIN ERROR - Langkah demi Langkah

## ❌ Error yang Terjadi:
```
Login Gagal
Database error querying schema
```

## ✅ Root Cause:
Table `user_profiles` tidak ada di database Anda!

---

## 📋 SOLUSI CEPAT (5 Menit):

### **STEP 1: Run Complete Fix Script**

1. **Buka Supabase Dashboard**: https://app.supabase.com
2. **Pilih Project Anda**
3. **Klik "SQL Editor"** di sidebar kiri
4. **Klik "New Query"**
5. **Copy paste SEMUA isi file**: `supabase/COMPLETE_FIX.sql`
6. **Klik "Run"** atau tekan `Ctrl + Enter`

✅ Jika berhasil, akan muncul tabel yang tersedia:
```
enrollments
participants  
programs
trainers
user_profiles  ← PENTING! Harus ada ini!
```

---

### **STEP 2: Create Sample Users**

#### **Option A: Via Supabase Dashboard (RECOMMENDED)** ⭐

1. **Klik "Authentication"** di sidebar
2. **Klik "Add User"** (tombol hijau)
3. **Buat user ini satu per satu:**

**Admin User:**
- Email: `admin@garuda21.com`
- Password: `admin123`
- ✅ Turn OFF "Auto Confirm Email"
- Klik "Create User"

**Manager User:**
- Email: `manager@garuda21.com`  
- Password: `manager123`
- ✅ Turn OFF "Auto Confirm Email"
- Klik "Create User"

**Regular User:**
- Email: `user@garuda21.com`
- Password: `user123`
- ✅ Turn OFF "Auto Confirm Email"
- Klik "Create User"

4. **Setelah semua user dibuat, update role mereka:**

Kembali ke **SQL Editor** dan jalankan:

```sql
-- Update roles
UPDATE user_profiles 
SET role = 'admin', full_name = 'Admin GARUDA-21'
WHERE email = 'admin@garuda21.com';

UPDATE user_profiles 
SET role = 'manager', full_name = 'Manager GARUDA-21'
WHERE email = 'manager@garuda21.com';

UPDATE user_profiles 
SET role = 'user', full_name = 'User GARUDA-21'
WHERE email = 'user@garuda21.com';
```

#### **Option B: Via SQL (Alternatif)**

Jika Option A tidak berhasil, jalankan script ini di SQL Editor:

```sql
-- Hanya jalankan jika Option A gagal!
-- File: supabase/create-sample-users-fixed.sql
```

---

### **STEP 3: Verify Setup**

Jalankan query ini di SQL Editor untuk memastikan semuanya OK:

```sql
-- Check tables
SELECT 
  tablename
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('trainers', 'programs', 'participants', 'enrollments', 'user_profiles')
ORDER BY tablename;

-- Check users
SELECT id, email, created_at FROM auth.users WHERE email LIKE '%garuda21.com';

-- Check profiles
SELECT email, full_name, role FROM user_profiles WHERE email LIKE '%garuda21.com';
```

**Expected Results:**
- ✅ 5 tables found
- ✅ 3 users in auth.users
- ✅ 3 profiles with correct roles

---

### **STEP 4: Test Login**

1. **Restart Development Server**:
   ```bash
   npm run dev
   ```

2. **Buka**: http://localhost:3000/login

3. **Test dengan credentials**:
   - Email: `admin@garuda21.com`
   - Password: `admin123`

4. **Klik Login**

✅ **Seharusnya berhasil dan redirect ke `/dashboard`!**

---

## 🔍 Troubleshooting

### Error: "Table user_profiles does not exist"
**Solution**: Ulangi STEP 1, pastikan `COMPLETE_FIX.sql` dijalankan dengan benar

### Error: "Invalid login credentials"  
**Solution**: 
- Pastikan user sudah dibuat di Authentication Dashboard
- Password yang digunakan sesuai (case-sensitive)
- Email Confirmed = YES

### Error: "No rows returned"
**Solution**: User profiles tidak ter-generate otomatis
```sql
-- Manual insert profile (ganti dengan user ID yang sebenarnya)
INSERT INTO user_profiles (id, email, full_name, role)
SELECT id, email, email, 'admin'
FROM auth.users 
WHERE email = 'admin@garuda21.com'
ON CONFLICT (id) DO NOTHING;
```

### Login berhasil tapi error di Dashboard
**Solution**: Check apakah semua tables (trainers, programs, etc) sudah punya data
```sql
-- Run schema.sql untuk insert sample data
-- File: supabase/schema.sql (bagian INSERT)
```

---

## 📊 Verification Checklist

- [ ] Table `user_profiles` exists
- [ ] RLS disabled untuk development  
- [ ] Trigger `on_auth_user_created` exists
- [ ] 3 sample users created in auth.users
- [ ] 3 profiles in user_profiles with correct roles
- [ ] Login successful dengan admin@garuda21.com
- [ ] Dashboard accessible

---

## 🎯 Quick Reference: Sample Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@garuda21.com | admin123 |
| Manager | manager@garuda21.com | manager123 |
| User | user@garuda21.com | user123 |

---

## 📝 Notes

- **RLS Disabled**: Untuk development, Row Level Security sudah di-disable agar tidak ada permission issues
- **Auto-confirm**: Email confirmation di-off untuk testing
- **Trigger**: Auto-create profile trigger akan otomatis membuat user_profiles saat user baru sign up

---

**Setelah mengikuti semua step, login seharusnya sudah berfungsi! 🎉**

**Butuh bantuan?** Check file `TROUBLESHOOT_LOGIN.md` untuk troubleshooting lebih detail.

