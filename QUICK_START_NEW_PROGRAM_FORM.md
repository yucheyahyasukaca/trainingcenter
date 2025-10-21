# 🚀 Quick Start - Form Program Baru

## Perubahan yang Sudah Dibuat

### ✅ 1. Database Schema
**File:** `supabase/update-programs-for-new-requirements.sql`

Perubahan:
- ✅ Tabel baru: `program_categories`
- ✅ Field baru di tabel `programs`:
  - `program_type` - TOT atau Regular
  - `is_free` - Gratis atau berbayar
  - `registration_start_date` - Tanggal mulai pendaftaran
  - `registration_end_date` - Tanggal selesai pendaftaran
  - `auto_approved` - Auto-approval untuk program gratis
- ✅ Field optional: `duration_days`, `max_participants`
- ✅ Trigger auto-approval untuk program gratis
- ✅ Trigger auto-promotion trainer untuk program TOT
- ✅ Validasi tanggal pendaftaran

### ✅ 2. TypeScript Types
**File:** `types/database.ts`, `types/index.ts`

Perubahan:
- ✅ Type definitions untuk `program_categories`
- ✅ Update type definitions untuk `programs`
- ✅ Export types: `ProgramCategory`, `ProgramCategoryInsert`, `ProgramCategoryUpdate`

### ✅ 3. Komponen Baru
**File:** `components/programs/CategorySelector.tsx`

Fitur:
- ✅ Auto-complete kategori saat mengetik
- ✅ Dropdown suggestions
- ✅ Dialog untuk tambah kategori baru
- ✅ Integrasi langsung dengan database

### ✅ 4. Form Tambah Program
**File:** `app/programs/new/page.tsx`

Perubahan:
- ✅ Hapus field: Durasi, Max Peserta, Trainer
- ✅ Tambah: CategorySelector dengan auto-complete
- ✅ Tambah: Pilihan Gratis/Berbayar
- ✅ Tambah: Pilihan TOT/Regular
- ✅ Tambah: Tanggal mulai/selesai pendaftaran
- ✅ Validasi tanggal pendaftaran
- ✅ Info box untuk program gratis
- ✅ Info box untuk program TOT

### ✅ 5. Form Edit Program
**File:** `app/programs/[id]/edit/page.tsx`

Perubahan yang sama dengan form tambah program.

---

## 📋 Cara Menggunakan

### Langkah 1: Jalankan Migration SQL

**PENTING:** Buka Supabase Dashboard → SQL Editor, kemudian jalankan:

```sql
-- Copy dan paste isi file ini:
supabase/update-programs-for-new-requirements.sql
```

Atau jika menggunakan Supabase CLI:

```bash
# Pastikan sudah login ke Supabase
supabase db reset

# Atau jalankan migration
supabase db push
```

### Langkah 2: Restart Server

```bash
# Stop server (Ctrl+C)
# Kemudian jalankan lagi:
npm run dev
```

### Langkah 3: Test Form

1. Buka `http://localhost:3000/programs`
2. Klik "Tambah Program Baru"
3. Coba fitur-fitur baru:
   - Ketik kategori dan lihat auto-complete
   - Tambah kategori baru
   - Pilih "Gratis" dan lihat info box
   - Pilih "TOT" dan lihat info box
   - Atur tanggal pendaftaran

---

## 🎯 Fitur Utama Baru

### 1. **Kategori Smart**
- Ketik untuk search
- Auto-complete
- Tambah kategori baru on-the-fly
- 8 kategori default sudah tersedia

### 2. **Program Gratis**
- Pilih "Gratis" → harga otomatis 0
- Peserta yang mendaftar langsung approved
- Tidak perlu konfirmasi admin
- Status payment otomatis "paid"

### 3. **Program TOT**
- Peserta yang lulus otomatis jadi Trainer Level 0
- Role berubah dari "user" ke "trainer"
- Trainer_level di-set ke "level_0"

### 4. **Periode Pendaftaran**
- Set tanggal mulai dan selesai pendaftaran
- Validasi otomatis saat pendaftaran
- Error message yang jelas jika di luar periode

---

## 🧪 Contoh Penggunaan

### Buat Program Gratis
1. Judul: "Workshop Digital Marketing Gratis"
2. Deskripsi: "Belajar digital marketing dasar"
3. Kategori: Pilih "Marketing" atau tambah baru
4. **Tipe Harga: Gratis** ← Otomatis approved!
5. Tipe Program: Regular
6. Pendaftaran: 2024-01-01 s/d 2024-01-31
7. Program: 2024-02-01 s/d 2024-02-28
8. Status: Published

### Buat Program TOT
1. Judul: "TOT Leadership Excellence"
2. Deskripsi: "Training untuk calon trainer leadership"
3. Kategori: Leadership
4. Tipe Harga: Berbayar (Rp 5.000.000)
5. **Tipe Program: TOT** ← Peserta lulus jadi trainer!
6. Pendaftaran: 2024-01-01 s/d 2024-01-15
7. Program: 2024-02-01 s/d 2024-03-01
8. Status: Published

---

## 🔍 Validasi & Rules

### ✅ Validasi Form
- Semua field wajib terisi (kecuali harga jika gratis)
- Tanggal selesai pendaftaran >= tanggal mulai pendaftaran
- Kategori harus diisi (pilih atau buat baru)

### ✅ Validasi Database
- Pendaftaran di luar periode = Error
- Kategori duplicate = Error
- Auto-approval hanya untuk program gratis
- Auto-promotion hanya untuk program TOT

### ✅ RLS Policies
- Semua user bisa lihat kategori
- Admin & Manager bisa tambah/edit/hapus kategori
- Enrollment validation otomatis

---

## 📊 Alur Program Gratis

```
User mendaftar program gratis
    ↓
Trigger: auto_approve_free_program_enrollments()
    ↓
enrollment.status = 'approved' (otomatis)
enrollment.payment_status = 'paid' (otomatis)
    ↓
User langsung bisa akses program
```

## 📊 Alur Program TOT

```
User menyelesaikan program TOT
    ↓
Admin ubah enrollment.status = 'completed'
    ↓
Trigger: promote_tot_graduates_to_trainers()
    ↓
user_profiles.role = 'trainer'
user_profiles.trainer_level = 'level_0'
    ↓
User sekarang jadi Trainer Level 0
```

---

## 🎨 UI/UX Improvements

### CategorySelector
- Modern dropdown dengan search
- Smooth animations
- Clear add button (+)
- Modal dialog untuk tambah kategori
- Responsive design

### Form Layout
- Grouped fields (Periode Pendaftaran, Periode Program)
- Clear labels dengan asterisk (*)
- Helper text untuk TOT dan Gratis
- Color-coded info boxes

### Conditional Fields
- Harga hanya muncul jika "Berbayar"
- Info box muncul sesuai pilihan
- Clear visual feedback

---

## 🐛 Troubleshooting

### Migration Error
```
ERROR: column "program_type" does not exist
```
**Fix:** Jalankan ulang migration SQL di Supabase SQL Editor

### Category Not Saving
```
ERROR: permission denied for table program_categories
```
**Fix:** Pastikan RLS policies sudah aktif dan user adalah admin/manager

### Auto-approval Not Working
**Check:**
1. Apakah `is_free = true`?
2. Apakah trigger `trigger_auto_approve_free_enrollments` aktif?
3. Check Supabase logs untuk error

### TOT Promotion Not Working
**Check:**
1. Apakah `program_type = 'tot'`?
2. Apakah participant punya `user_id`?
3. Apakah enrollment status berubah ke 'completed'?
4. Check trigger `trigger_promote_tot_graduates`

---

## ✨ Next Steps

Setelah implementasi, Anda bisa:
1. ✅ Tambahkan lebih banyak kategori default
2. ✅ Customize error messages
3. ✅ Tambahkan analytics untuk program gratis vs berbayar
4. ✅ Buat dashboard khusus trainer level 0
5. ✅ Email notification untuk TOT graduates

---

## 📞 Need Help?

Check:
- Browser console untuk frontend errors
- Supabase logs untuk database errors
- Network tab untuk API errors

---

**Selamat menggunakan form program yang baru!** 🎉

