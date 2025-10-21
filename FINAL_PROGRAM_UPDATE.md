# ✅ Update Final Form Program Baru

## 🎯 Perubahan yang Sudah Dilakukan

### ❌ Yang Dihapus:
1. **Durasi (hari)** - tidak diperlukan lagi
2. **Max Peserta** - tidak diperlukan lagi  
3. **Trainer** - tidak diperlukan lagi
4. **Tanggal Mulai Program** - tidak diperlukan lagi
5. **Tanggal Selesai Program** - tidak diperlukan lagi

### ✅ Yang Ditambahkan:
1. **Judul Program** ✅
2. **Deskripsi** ✅
3. **Kategori** - dengan fitur auto-complete dan tambah kategori baru ✅
4. **Tipe Harga** - Gratis / Berbayar ✅
   - Gratis → Auto-approve tanpa konfirmasi admin
5. **Tipe Program** - Regular / TOT ✅
   - TOT → Peserta lulus otomatis jadi Trainer Level 0
6. **Periode Pendaftaran** - Lifetime / Berbatas Waktu ✅
   - Lifetime → Bisa daftar kapan saja
   - Berbatas Waktu → Hanya bisa daftar dalam periode tertentu
7. **Status** - Draft / Published / Archived ✅

---

## 📊 Struktur Database Baru

### Tabel `programs`

**Field yang dihapus:**
- ❌ `start_date` 
- ❌ `end_date`

**Field yang dibuat optional (nullable):**
- `duration_days` (nullable)
- `max_participants` (nullable)
- `trainer_id` (nullable)

**Field baru:**
```sql
- program_type VARCHAR(20) DEFAULT 'regular' 
  CHECK (program_type IN ('tot', 'regular'))
  
- is_free BOOLEAN DEFAULT false

- registration_type VARCHAR(20) DEFAULT 'lifetime'
  CHECK (registration_type IN ('lifetime', 'limited'))
  
- registration_start_date DATE (nullable)
  
- registration_end_date DATE (nullable)
  
- auto_approved BOOLEAN DEFAULT false
```

### Tabel `program_categories` (Baru)

```sql
CREATE TABLE program_categories (
    id UUID PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

**Kategori Default:**
1. Leadership
2. Technology
3. Marketing
4. Finance
5. Human Resources
6. Operations
7. Sales
8. Customer Service

---

## 🔧 Fungsi & Trigger Database

### 1. Auto-Approval untuk Program Gratis

**Trigger:** `trigger_auto_approve_free_enrollments`
**Function:** `auto_approve_free_program_enrollments()`

```sql
IF program.is_free = true THEN
    enrollment.status = 'approved'
    enrollment.payment_status = 'paid'
END IF
```

### 2. Auto-Promotion Trainer untuk TOT

**Trigger:** `trigger_promote_tot_graduates`
**Function:** `promote_tot_graduates_to_trainers()`

```sql
IF enrollment.status = 'completed' AND program.program_type = 'tot' THEN
    user_profiles.role = 'trainer'
    user_profiles.trainer_level = 'level_0'
END IF
```

### 3. Validasi Periode Pendaftaran

**Trigger:** `trigger_check_registration_dates`
**Function:** `check_registration_dates()`

```sql
IF registration_type = 'limited' THEN
    IF today < registration_start_date THEN
        RAISE EXCEPTION 'Pendaftaran belum dibuka'
    END IF
    
    IF today > registration_end_date THEN
        RAISE EXCEPTION 'Pendaftaran sudah ditutup'
    END IF
END IF
```

---

## 📁 File yang Diubah

### 1. Database
✅ `supabase/update-programs-for-new-requirements.sql`
- Migration script yang sudah diperbaiki
- Menghindari error dengan memisahkan ALTER TABLE
- Menghapus references ke start_date dan end_date
- Menambahkan registration_type

### 2. TypeScript Types
✅ `types/database.ts`
- Hapus: start_date, end_date
- Tambah: registration_type, program_type, is_free, dll

✅ `types/index.ts`
- Export ProgramCategory types

### 3. Components
✅ `components/programs/CategorySelector.tsx`
- Komponen kategori dengan auto-complete
- Fitur tambah kategori baru
- Dropdown suggestions

### 4. Forms
✅ `app/programs/new/page.tsx`
- Form baru sesuai requirements
- Pilihan Lifetime/Limited untuk pendaftaran
- Conditional fields untuk tanggal pendaftaran

✅ `app/programs/[id]/edit/page.tsx`
- Form edit dengan fitur yang sama

---

## 🚀 Cara Implementasi

### Langkah 1: Jalankan Migration SQL

**PENTING:** Buka Supabase Dashboard → SQL Editor

```sql
-- Copy paste isi file ini:
supabase/update-programs-for-new-requirements.sql
```

Klik **Run** dan tunggu hingga selesai.

**Expected Output:**
```
✓ Programs table updated successfully
✓ Program categories table created
✓ Auto-approval for free programs enabled
✓ TOT trainer promotion enabled
✓ Registration date validation enabled
✓ Start_date and end_date removed
✓ Registration type (Lifetime/Limited) added
```

### Langkah 2: Restart Development Server

```bash
# Stop server dengan Ctrl+C
# Kemudian jalankan:
npm run dev
```

### Langkah 3: Test Form

1. Buka: `http://localhost:3000/programs`
2. Klik: **Tambah Program Baru**
3. Test semua fitur baru

---

## 🎨 UI/UX Baru

### Periode Pendaftaran

**Pilihan 1: Lifetime**
- Tidak ada field tanggal
- Info box: "Peserta dapat mendaftar kapan saja tanpa batasan waktu"
- Cocok untuk: Program evergreen, kursus online

**Pilihan 2: Berbatas Waktu**
- Muncul field tanggal mulai & selesai
- Validasi: tanggal selesai >= tanggal mulai
- Required fields
- Info: "Pendaftaran hanya dapat dilakukan dalam periode ini"
- Cocok untuk: Program batch, workshop

### Tipe Harga

**Gratis:**
- Field harga tidak muncul
- Price = 0 otomatis
- Info box hijau: "Peserta yang mendaftar akan otomatis disetujui"

**Berbayar:**
- Field harga muncul (required)
- Perlu konfirmasi admin
- Payment flow normal

### Tipe Program

**Regular:**
- Program biasa
- Tidak ada auto-promotion

**TOT:**
- Info box biru: "Peserta yang lulus akan otomatis menjadi Trainer Level 0"
- Auto-promotion saat status = completed

---

## 🧪 Test Scenarios

### ✅ Test 1: Program Gratis Lifetime
```
1. Buat program:
   - Tipe Harga: Gratis
   - Periode: Lifetime
   - Tipe: Regular
   
2. Daftar sebagai user

3. Expected:
   ✓ Enrollment langsung approved
   ✓ Payment status = paid
   ✓ Bisa daftar kapan saja
```

### ✅ Test 2: Program Berbayar Limited
```
1. Buat program:
   - Tipe Harga: Berbayar (Rp 1.000.000)
   - Periode: Berbatas Waktu (1 Jan - 31 Jan)
   - Tipe: Regular
   
2. Coba daftar tanggal 15 Des (sebelum periode)

3. Expected:
   ✗ Error: "Pendaftaran belum dibuka. Pendaftaran dimulai pada 2024-01-01"
   
4. Coba daftar tanggal 15 Jan (dalam periode)

5. Expected:
   ✓ Enrollment status = pending
   ✓ Payment status = unpaid
   ✓ Perlu approval admin
   
6. Coba daftar tanggal 15 Feb (setelah periode)

7. Expected:
   ✗ Error: "Pendaftaran sudah ditutup. Pendaftaran berakhir pada 2024-01-31"
```

### ✅ Test 3: Program TOT
```
1. Buat program:
   - Tipe Harga: Gratis
   - Periode: Lifetime
   - Tipe: TOT
   
2. Daftar sebagai user (role: user)

3. Admin set enrollment status = completed

4. Expected:
   ✓ User role berubah menjadi 'trainer'
   ✓ trainer_level = 'level_0'
   ✓ Admin/Manager tidak terpengaruh
```

### ✅ Test 4: Kategori
```
1. Form program baru

2. Ketik "lead" di field kategori

3. Expected:
   ✓ Muncul suggestion "Leadership"
   
4. Klik tombol +

5. Expected:
   ✓ Muncul dialog tambah kategori
   
6. Isi nama: "Digital Transformation"

7. Expected:
   ✓ Kategori tersimpan
   ✓ Otomatis terisi di form
   ✓ Muncul di suggestions untuk input selanjutnya
```

---

## 🔍 Perbedaan SQL Script

### ❌ Versi Lama (Error)

```sql
-- Multiple ADD COLUMN dalam satu statement - ERROR!
ALTER TABLE programs 
ADD COLUMN program_type VARCHAR(20),
ADD COLUMN is_free BOOLEAN,
ADD COLUMN registration_start_date DATE;

-- References ke field yang dihapus - ERROR!
UPDATE programs 
SET registration_start_date = start_date - INTERVAL '30 days';
```

### ✅ Versi Baru (Fixed)

```sql
-- Satu per satu untuk menghindari error
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS program_type VARCHAR(20) DEFAULT 'regular';

ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;

-- Hapus start_date dan end_date
ALTER TABLE programs 
DROP COLUMN IF EXISTS start_date;

ALTER TABLE programs 
DROP COLUMN IF EXISTS end_date;

-- Update tanpa references ke field yang dihapus
UPDATE programs 
SET program_type = 'regular',
    is_free = (price = 0);
```

---

## 📊 Validasi Form

### Client-Side (TypeScript)

```typescript
// Validasi untuk limited registration
if (registration_type === 'limited') {
  if (!registration_start_date || !registration_end_date) {
    error('Tanggal pendaftaran harus diisi')
    return
  }
  
  if (new Date(registration_end_date) < new Date(registration_start_date)) {
    error('Tanggal selesai harus setelah tanggal mulai')
    return
  }
}
```

### Server-Side (SQL Trigger)

```sql
-- Validasi di database
IF v_registration_type = 'limited' THEN
    IF v_current_date < v_reg_start_date THEN
        RAISE EXCEPTION 'Pendaftaran belum dibuka'
    END IF
    
    IF v_current_date > v_reg_end_date THEN
        RAISE EXCEPTION 'Pendaftaran sudah ditutup'
    END IF
END IF
```

---

## 🎉 Summary

### ✅ Selesai:
- [x] SQL migration script diperbaiki
- [x] Hapus start_date dan end_date
- [x] Tambah registration_type (lifetime/limited)
- [x] Update TypeScript types
- [x] Update form new program
- [x] Update form edit program
- [x] Validasi tanggal pendaftaran
- [x] Auto-approval untuk gratis
- [x] Auto-promotion untuk TOT
- [x] Kategori dengan auto-complete
- [x] Dokumentasi lengkap

### 📋 Requirements Terpenuhi:
- ✅ Judul program
- ✅ Deskripsi
- ✅ Kategori (auto-complete + tambah baru)
- ✅ Hapus durasi
- ✅ Hapus max peserta
- ✅ Tipe harga (Gratis/Berbayar)
- ✅ Auto-approve untuk gratis
- ✅ Periode pendaftaran (Lifetime/Berbatas Waktu)
- ✅ Hapus tanggal program
- ✅ Hapus trainer
- ✅ Tipe program (TOT/Regular)
- ✅ Auto-promote Trainer Level 0
- ✅ Status

---

## 🚨 Troubleshooting

### Error: "column start_date does not exist"

**Penyebab:** File lama masih reference ke start_date/end_date

**Fix:** Pastikan menggunakan file yang sudah diupdate:
- ✅ `app/programs/new/page.tsx` (versi baru)
- ✅ `app/programs/[id]/edit/page.tsx` (versi baru)
- ✅ `types/database.ts` (versi baru)

### Error saat run SQL migration

**Penyebab:** Constraint atau policy sudah ada

**Fix:** SQL script sudah include `IF NOT EXISTS` dan `DROP IF EXISTS`

### Kategori tidak tersimpan

**Penyebab:** User bukan admin/manager

**Fix:** Pastikan user memiliki role admin atau manager

### Tanggal pendaftaran tidak tervalidasi

**Penyebab:** Trigger belum aktif

**Fix:** Jalankan ulang migration SQL

---

## 📞 Next Steps

1. ✅ Jalankan migration SQL
2. ✅ Restart server
3. ✅ Test semua scenarios
4. ✅ Deploy ke production (jika sudah oke)

**Semua siap digunakan!** 🎉

