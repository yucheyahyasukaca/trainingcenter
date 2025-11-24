# Debug: Hapus Riwayat Email Broadcast

## 🔍 Cara Debug Masalah Hapus

### Step 1: Buka Browser DevTools
1. Tekan **F12** atau **Ctrl+Shift+I**
2. Buka tab **Console**
3. Buka tab **Network**

### Step 2: Coba Hapus Riwayat
1. Hover pada salah satu riwayat email
2. Klik tombol **Hapus** (ikon trash)
3. **Perhatikan Console dan Network tab**

### Step 3: Cek Console Logs
Cari log berikut:
- `🗑️ Attempting to delete email log: [id]` ← Harus muncul saat klik hapus
- `✅ Delete successful:` ← Harus muncul jika berhasil
- `❌ Delete failed:` atau `❌ Error deleting log:` ← Akan muncul jika ada error

### Step 4: Cek Network Request
1. Di tab **Network**, cari request dengan method **DELETE**
2. Klik request tersebut
3. Lihat tab **Headers**:
   - Pastikan URL: `/api/admin/email-logs/[id]`
   - Pastikan Method: `DELETE`
4. Lihat tab **Response**:
   - Jika berhasil: `{"success": true, "data": [...]}`
   - Jika error: `{"error": "error message"}`

### Step 5: Cek Server Logs
Lihat terminal yang menjalankan `npm run dev`, cari log:
- `🗑️ DELETE request for email log: [id]`
- `📊 Delete result: { data: [...], error: null }`
- `✅ Email log deleted successfully: [id]`

## 🐛 Kemungkinan Masalah & Solusi

### Masalah 1: Confirm Dialog Tidak Muncul
**Gejala:** Klik hapus tidak ada reaksi sama sekali

**Solusi:**
- Browser mungkin memblokir confirm dialog
- Coba di browser lain (Chrome, Firefox, Edge)
- Atau ganti dengan custom modal (akan dibuat jika perlu)

### Masalah 2: Error "Failed to delete"
**Gejala:** Toast error muncul, console menunjukkan error

**Cek:**
1. Buka Network tab → lihat response error
2. Buka terminal server → lihat error log
3. Kemungkinan:
   - RLS policy belum dijalankan (lihat di bawah)
   - Service key tidak valid
   - Database connection issue

### Masalah 3: Data Tidak Terhapus dari List
**Gejala:** Toast success muncul, tapi item masih ada di list

**Solusi:**
- Refresh halaman (F5)
- Cek apakah `fetchLogs()` dipanggil setelah delete
- Cek console untuk error saat fetch logs

## ✅ Pastikan RLS Policy Sudah Dijalankan

**PENTING:** Meskipun API menggunakan `service_role_key` (bypass RLS), ada baiknya tetap menjalankan policy untuk konsistensi.

### Cara Menjalankan SQL Migration:

1. **Buka Supabase Dashboard**
   - Login ke https://supabase.com
   - Pilih project Anda

2. **Buka SQL Editor**
   - Klik **SQL Editor** di sidebar kiri
   - Klik **New query**

3. **Jalankan SQL berikut:**
```sql
-- Add DELETE policy for email_logs table
CREATE POLICY "Admins can delete email logs" 
  ON email_logs 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );
```

4. **Klik Run** (atau tekan Ctrl+Enter)

5. **Verifikasi:**
   - Go to **Database** → **Tables** → **email_logs**
   - Klik tab **Policies**
   - Pastikan ada policy "Admins can delete email logs" dengan operation **DELETE**

## 🧪 Test Manual

Setelah semua fix, test dengan:

1. **Clear browser cache:**
   ```javascript
   // Di browser console:
   localStorage.clear()
   sessionStorage.clear()
   location.reload()
   ```

2. **Login sebagai admin**

3. **Akses:** `http://localhost:3000/admin/email-broadcast`

4. **Hapus satu riwayat:**
   - Hover pada item
   - Klik tombol hapus
   - Konfirmasi
   - Item seharusnya hilang dari list

5. **Cek console:**
   - Harus ada log: `✅ Delete successful`
   - Tidak ada error

6. **Cek network:**
   - DELETE request harus return 200 OK
   - Response harus: `{"success": true}`

## 📝 Files yang Sudah Diperbaiki

- ✅ `app/api/admin/email-logs/[id]/route.ts` - API endpoint dengan logging
- ✅ `app/admin/email-broadcast/page.tsx` - Frontend dengan error handling
- ✅ `supabase/migrations/20240102_add_delete_policy_email_logs.sql` - RLS policy

## 🚨 Jika Masih Tidak Bisa

1. **Cek Environment Variables:**
   - Pastikan `SUPABASE_SERVICE_ROLE_KEY` ada di `.env.local`
   - Restart dev server setelah edit `.env.local`

2. **Cek Database:**
   - Pastikan tabel `email_logs` ada
   - Pastikan kolom `id` adalah UUID
   - Test query manual di Supabase SQL Editor:
     ```sql
     SELECT * FROM email_logs LIMIT 5;
     ```

3. **Cek Console Errors:**
   - Copy semua error dari console
   - Copy response dari Network tab
   - Share untuk debugging lebih lanjut

---
**Status:** ⏳ Pending user test dengan DevTools  
**Last Updated:** 24 November 2025

