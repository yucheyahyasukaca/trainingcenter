# ⚡ QUICK GUIDE: Disable Email Confirmation

## 🎯 User akan otomatis aktif setelah registrasi (tanpa konfirmasi email)

---

## 📋 2 LANGKAH MUDAH (5 Menit):

### **LANGKAH 1: Jalankan SQL Script**

1. Buka **Supabase Dashboard:** https://app.supabase.com
2. Pilih **project** Anda
3. Klik **SQL Editor** (di sidebar kiri)
4. Klik **"New Query"**
5. Copy-paste isi file `supabase/disable-email-confirmation.sql`
6. Klik **"Run"** (atau Ctrl+Enter)

**✅ Done!** Script akan auto-activate semua users.

---

### **LANGKAH 2: Disable di Dashboard**

1. Masih di **Supabase Dashboard**
2. Klik **⚙️ Project Settings** (icon gear di pojok kiri bawah)
3. Klik **Authentication**
4. Scroll ke bagian **"Email"**
5. Cari **"Enable email confirmations"**
6. **TOGGLE OFF** (dari ON jadi OFF)
7. Klik **Save**

**✅ Done!** Email confirmation sekarang disabled.

---

## 🧪 TEST

1. Buka: http://localhost:3000/register/new
2. Registrasi user baru
3. ✅ Tidak ada error!
4. Buka: http://localhost:3000/login
5. ✅ Login langsung berhasil!

---

## ✅ Hasil

- ✅ User baru **langsung aktif**
- ✅ **Tidak perlu** konfirmasi email
- ✅ Bisa **langsung login** setelah registrasi
- ✅ **Tidak ada** error lagi

---

**Selesai!** 🎉

Untuk panduan lengkap, baca: `DISABLE_EMAIL_CONFIRMATION.md`

