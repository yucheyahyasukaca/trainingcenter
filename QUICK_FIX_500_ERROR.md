# ⚡ QUICK FIX: 500 Error - Email Confirmation

## 🎯 Problem:
```
500 Internal Server Error
Error sending confirmation email
```

**Root Cause:** Email confirmation masih **AKTIF** di Supabase!

---

## ⚡ SOLUSI 2 MENIT:

### **LANGKAH 1: Disable Email Confirmation**

1. **Buka:** https://app.supabase.com
2. **Project Settings** (⚙️) → **Authentication**
3. **Scroll ke "Email"**
4. **"Enable email confirmations"** → **TOGGLE OFF**
5. **Save**

**✅ Email confirmation sekarang disabled!**

---

### **LANGKAH 2: Clean Failed User**

1. **SQL Editor** → **New Query**
2. **Copy paste:**

```sql
DELETE FROM user_profiles WHERE email = 'yucheyahya@gmail.com';
DELETE FROM auth.users WHERE email = 'yucheyahya@gmail.com';
```

3. **Run**

**✅ User yang gagal dihapus!**

---

### **LANGKAH 3: Test**

1. **Buka:** http://localhost:3000/register/new
2. **Registrasi** dengan `yucheyahya@gmail.com`
3. **✅ Berhasil!**

---

## 🎯 Hasil:

- ✅ **Tidak ada** 500 error
- ✅ **Tidak ada** email confirmation error
- ✅ User **langsung aktif**
- ✅ Bisa **langsung login**

---

**Selesai!** 🚀
