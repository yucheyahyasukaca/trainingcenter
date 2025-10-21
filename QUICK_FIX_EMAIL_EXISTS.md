# ⚡ QUICK FIX: Email yucheyahya@gmail.com Sudah Terdaftar

## 🎯 Problem:
Email `yucheyahya@gmail.com` gagal registrasi di tengah proses, sekarang "terjebak" di database.

---

## ⚡ SOLUSI 2 MENIT:

### **LANGKAH 1: Bersihkan Email**

1. **Buka:** https://app.supabase.com
2. **SQL Editor** → **New Query**
3. **Copy paste** ini:

```sql
-- Hapus email yang gagal registrasi
DELETE FROM user_profiles WHERE email = 'yucheyahya@gmail.com';
DELETE FROM auth.users WHERE email = 'yucheyahya@gmail.com';
```

4. **Klik Run**

**✅ Email sekarang bersih!**

---

### **LANGKAH 2: Test Registrasi**

1. **Buka:** http://localhost:3000/register/new
2. **Isi:**
   - Nama: Yuche Yahya
   - Email: yucheyahya@gmail.com
   - Password: password123
3. **Klik:** "Buat akun baru"

**✅ Berhasil!**

---

## 🔍 Jika Masih Error:

### Cek Status Email:

Jalankan di SQL Editor:

```sql
SELECT email, confirmed_at FROM auth.users WHERE email = 'yucheyahya@gmail.com';
```

**Jika ada hasil:** Email masih ada, hapus lagi  
**Jika kosong:** Email sudah bersih ✅

---

## 🎯 Root Cause:

1. User registrasi → Data masuk ke database
2. Error terjadi (email confirmation, dll)
3. User "terjebak" tapi tidak lengkap
4. Registrasi ulang gagal karena email sudah ada

**✅ Sekarang sudah fixed dengan disable email confirmation!**

---

**Selesai! Email bisa digunakan lagi.** 🚀
