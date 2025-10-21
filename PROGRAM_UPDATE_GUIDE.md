# Panduan Update Form Program Baru

## 📋 Ringkasan Perubahan

Form pembuatan program telah diperbarui dengan persyaratan baru:

### ✅ Field yang Dipertahankan:
- Judul Program
- Deskripsi
- Kategori (dengan fitur baru)
- Status
- Tanggal mulai dan selesai program

### ✨ Field Baru:
1. **Kategori dengan Auto-complete**
   - Pilih kategori yang sudah ada
   - Tambah kategori baru langsung dari form
   - Saran otomatis saat mengetik

2. **Tipe Harga**: Gratis atau Berbayar
   - **Gratis**: Pendaftaran otomatis disetujui tanpa konfirmasi admin
   - **Berbayar**: Perlu konfirmasi admin dan pembayaran

3. **Tanggal Pendaftaran**
   - Tanggal mulai pendaftaran
   - Tanggal selesai pendaftaran
   - Validasi: pendaftaran hanya bisa dilakukan dalam periode ini

4. **Tipe Program**: Regular atau TOT
   - **Regular**: Program biasa
   - **TOT (Training of Trainers)**: Peserta yang lulus otomatis menjadi **Trainer Level 0**

### ❌ Field yang Dihapus:
- Durasi (hari) - tidak diperlukan lagi
- Max Peserta - tidak diperlukan lagi
- Trainer - tidak diperlukan lagi

---

## 🚀 Cara Implementasi

### Langkah 1: Jalankan Migration SQL

Jalankan file SQL berikut di Supabase SQL Editor:

```bash
supabase/update-programs-for-new-requirements.sql
```

Script ini akan:
1. ✅ Membuat tabel `program_categories`
2. ✅ Menambahkan kolom baru ke tabel `programs`:
   - `program_type` (tot/regular)
   - `is_free` (boolean)
   - `registration_start_date`
   - `registration_end_date`
   - `auto_approved` (boolean)
3. ✅ Membuat fungsi auto-approval untuk program gratis
4. ✅ Membuat fungsi promosi otomatis trainer untuk program TOT
5. ✅ Membuat validasi tanggal pendaftaran
6. ✅ Menambahkan 8 kategori default

### Langkah 2: Restart Development Server

Setelah menjalankan migration, restart development server:

```bash
# Tekan Ctrl+C untuk stop server
# Kemudian jalankan lagi:
npm run dev
```

---

## 🎯 Fitur-Fitur Baru

### 1. Kategori dengan Auto-complete

Komponen `CategorySelector` memberikan pengalaman yang lebih baik:
- Ketik untuk mencari kategori yang sudah ada
- Saran otomatis muncul saat mengetik
- Tombol "Tambah" untuk membuat kategori baru
- Dialog untuk menambahkan kategori dengan nama dan deskripsi

**Kategori Default:**
- Leadership
- Technology
- Marketing
- Finance
- Human Resources
- Operations
- Sales
- Customer Service

### 2. Program Gratis vs Berbayar

**Program Gratis:**
- Field harga tidak ditampilkan (otomatis 0)
- Status enrollment otomatis menjadi "approved"
- Status payment otomatis menjadi "paid"
- Tidak perlu konfirmasi admin
- Indikator hijau menunjukkan program gratis

**Program Berbayar:**
- Field harga wajib diisi
- Enrollment perlu approval admin
- Payment status dimulai dari "unpaid"

### 3. Validasi Tanggal Pendaftaran

Sistem akan otomatis memvalidasi saat peserta mendaftar:
- ❌ Pendaftaran sebelum `registration_start_date` akan ditolak
- ❌ Pendaftaran setelah `registration_end_date` akan ditolak
- ✅ Pendaftaran dalam periode akan diterima

Error message yang jelas:
```
"Pendaftaran belum dibuka. Pendaftaran dimulai pada [tanggal]"
"Pendaftaran sudah ditutup. Pendaftaran berakhir pada [tanggal]"
```

### 4. Program TOT (Training of Trainers)

Fitur otomatis untuk program TOT:

**Saat enrollment status berubah menjadi "completed":**
1. Sistem mengecek apakah program adalah TOT
2. Jika ya, user_profile peserta diupdate:
   - `role` → `'trainer'`
   - `trainer_level` → `'level_0'`
3. Admin dan Manager tidak akan di-downgrade

**Indikator:**
Saat memilih TOT, muncul pesan informasi:
> "Peserta yang lulus akan otomatis menjadi Trainer Level 0"

---

## 📁 File yang Diubah

### 1. Database Schema
- ✅ `supabase/update-programs-for-new-requirements.sql` - Migration script
- ✅ `types/database.ts` - TypeScript types

### 2. Komponen Baru
- ✅ `components/programs/CategorySelector.tsx` - Komponen kategori

### 3. Form Program
- ✅ `app/programs/new/page.tsx` - Form tambah program
- ✅ `app/programs/[id]/edit/page.tsx` - Form edit program

---

## 🔍 Testing Checklist

### Test Program Gratis
- [ ] Buat program dengan tipe "Gratis"
- [ ] Daftarkan peserta ke program tersebut
- [ ] Verifikasi enrollment otomatis approved
- [ ] Verifikasi payment_status otomatis paid

### Test Program Berbayar
- [ ] Buat program dengan tipe "Berbayar"
- [ ] Daftarkan peserta ke program tersebut
- [ ] Verifikasi enrollment status pending
- [ ] Approve manual oleh admin

### Test Tanggal Pendaftaran
- [ ] Buat program dengan periode pendaftaran terbatas
- [ ] Coba daftar sebelum tanggal mulai (harus ditolak)
- [ ] Coba daftar dalam periode (harus berhasil)
- [ ] Coba daftar setelah tanggal selesai (harus ditolak)

### Test Program TOT
- [ ] Buat program dengan tipe "TOT"
- [ ] Daftarkan peserta regular (role: user)
- [ ] Ubah enrollment status menjadi "completed"
- [ ] Verifikasi role peserta berubah menjadi "trainer"
- [ ] Verifikasi trainer_level menjadi "level_0"

### Test Kategori
- [ ] Ketik untuk mencari kategori existing
- [ ] Tambah kategori baru
- [ ] Verifikasi kategori baru muncul di daftar
- [ ] Pilih kategori yang baru dibuat

---

## 🛠️ Troubleshooting

### Error: "column does not exist"
**Solusi:** Pastikan migration SQL sudah dijalankan dengan benar.

### Error: "permission denied"
**Solusi:** Periksa RLS policies untuk tabel `program_categories`.

### Kategori tidak tersimpan
**Solusi:** Periksa apakah user memiliki role admin atau manager.

### Auto-approval tidak bekerja
**Solusi:** 
1. Periksa trigger `trigger_auto_approve_free_enrollments`
2. Verifikasi field `is_free` terisi dengan benar

### TOT promotion tidak bekerja
**Solusi:**
1. Periksa trigger `trigger_promote_tot_graduates`
2. Verifikasi participant memiliki `user_id`
3. Pastikan `program_type` adalah 'tot'

---

## 📞 Support

Jika mengalami masalah:
1. Periksa console browser untuk error
2. Periksa Supabase logs
3. Verifikasi semua migration sudah dijalankan
4. Restart development server

---

## 🎉 Selamat!

Form program baru sudah siap digunakan dengan fitur yang lebih lengkap dan user-friendly!

