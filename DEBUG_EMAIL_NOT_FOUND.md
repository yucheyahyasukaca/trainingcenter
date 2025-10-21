# 🔍 DEBUG: Email Tidak Ada di Auth Users Tapi Masih Error

## ❌ Problem:
- Error: "Email sudah terdaftar"
- Tapi di Supabase Auth Users **TIDAK ADA** email `yucheyahya@gmail.com`

---

## 🔍 INVESTIGASI (5 Menit):

### **LANGKAH 1: Debug Lengkap**

1. **Buka Supabase Dashboard:** https://app.supabase.com
2. **SQL Editor** → **New Query**
3. **Copy paste** isi file `supabase/debug-email-issue.sql`
4. **Klik Run**

**✅ Script akan cek semua kemungkinan penyebab**

---

## 🎯 KEMUNGKINAN PENYEBAB:

### **1. Email Ada di `user_profiles` Tapi Tidak di `auth.users`**
- User profile dibuat tapi auth user gagal
- **Fix:** Hapus dari `user_profiles`

### **2. Case Sensitivity Issue**
- Email tersimpan sebagai `YucheYahya@gmail.com` (huruf besar)
- **Fix:** Cek dengan case insensitive

### **3. Whitespace atau Karakter Aneh**
- Email ada spasi: ` yucheyahya@gmail.com `
- **Fix:** Trim whitespace

### **4. Caching Issue**
- Supabase cache masih menyimpan data lama
- **Fix:** Clear cache atau tunggu beberapa menit

### **5. Rate Limiting**
- Terlalu banyak percobaan registrasi
- **Fix:** Tunggu 5-10 menit

### **6. Email di Table Lain**
- Ada table lain yang menyimpan email
- **Fix:** Cek semua table

---

## ⚡ SOLUSI BERDASARKAN HASIL DEBUG:

### **Jika Email Ada di `user_profiles`:**

```sql
-- Hapus dari user_profiles
DELETE FROM user_profiles WHERE email = 'yucheyahya@gmail.com';
```

### **Jika Case Sensitivity Issue:**

```sql
-- Hapus dengan case insensitive
DELETE FROM auth.users WHERE LOWER(email) = 'yucheyahya@gmail.com';
DELETE FROM user_profiles WHERE LOWER(email) = 'yucheyahya@gmail.com';
```

### **Jika Whitespace Issue:**

```sql
-- Hapus dengan trim whitespace
DELETE FROM auth.users WHERE TRIM(email) = 'yucheyahya@gmail.com';
DELETE FROM user_profiles WHERE TRIM(email) = 'yucheyahya@gmail.com';
```

### **Jika Caching Issue:**

1. **Tunggu 5-10 menit**
2. **Clear browser cache** (Ctrl+Shift+R)
3. **Restart development server:**
   ```bash
   npm run dev
   ```

---

## 🧪 TEST ALTERNATIF:

### **Coba Email Lain Dulu:**

1. **Buka:** http://localhost:3000/register/new
2. **Isi dengan email lain:**
   - Email: `test123@gmail.com`
   - Nama: Test User
   - Password: password123
3. **Klik:** "Buat akun baru"

**Jika berhasil:** Masalah spesifik dengan email `yucheyahya@gmail.com`  
**Jika gagal:** Masalah umum dengan sistem registrasi

---

## 🔧 ALTERNATIVE: Manual Check

### **Cek di Supabase Dashboard:**

1. **Authentication** → **Users**
2. **Search** dengan `yucheyahya`
3. **Cek** apakah ada email serupa

### **Cek di Database:**

1. **Table Editor** → **user_profiles**
2. **Search** dengan `yucheyahya`
3. **Cek** apakah ada data

---

## 🎯 QUICK FIX (Jika Debug Tidak Jelas):

### **Force Clean Everything:**

```sql
-- Hapus semua kemungkinan
DELETE FROM user_profiles WHERE email ILIKE '%yucheyahya%';
DELETE FROM auth.users WHERE email ILIKE '%yucheyahya%';

-- Verify clean
SELECT 'CLEAN CHECK:' as status, COUNT(*) as count
FROM auth.users WHERE email ILIKE '%yucheyahya%'
UNION ALL
SELECT 'CLEAN CHECK:' as status, COUNT(*) as count
FROM user_profiles WHERE email ILIKE '%yucheyahya%';
```

---

## 📊 HASIL DEBUG YANG DIHARAPKAN:

### **Normal (Email Bersih):**
```
AUTH USERS TABLE: 0 rows
USER PROFILES TABLE: 0 rows
CHECK yucheyahya@gmail.com: 0 count ✅ NOT FOUND
```

### **Ada Masalah:**
```
AUTH USERS TABLE: 1 rows ← Ada di auth.users
USER PROFILES TABLE: 1 rows ← Ada di user_profiles
CHECK yucheyahya@gmail.com: 1 count ❌ FOUND
```

---

## 💡 TIPS:

1. **Screenshot hasil debug** dan share ke saya
2. **Coba email lain** untuk test sistem
3. **Check browser console** (F12) untuk error detail
4. **Restart dev server** jika perlu

---

**Silakan jalankan debug script dan share hasilnya!** 🔍
