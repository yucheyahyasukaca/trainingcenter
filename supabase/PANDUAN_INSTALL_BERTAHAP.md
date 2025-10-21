# 📋 Panduan Install Forum Bertahap

## Cara Pakai

Jalankan file SQL **satu per satu** sesuai urutan. Jika ada error, STOP dan laporkan error-nya.

## Step 1: Check Prerequisites ✅

**File:** `forum-step-1-check.sql`

**Fungsi:** Cek tabel apa saja yang sudah ada

**Expected Result:**
```
table_name        | status
------------------|-----------
programs          | ✓ EXISTS
classes           | ✓ EXISTS
forum_categories  | ✗ MISSING (ini normal)
```

**Action:** 
- Jika `programs` atau `classes` MISSING → Buat tabel tersebut dulu
- Jika semua OK → Lanjut Step 2

---

## Step 2: Create Table 

**Ada 3 pilihan, coba dari yang paling simple:**

### Pilihan A: Super Simple (RECOMMENDED)
**File:** `forum-step-2-simple.sql`

Ini versi paling sederhana TANPA foreign key.

### Pilihan B: With Smart Foreign Key
**File:** `forum-step-2-create-table-fixed.sql`

Versi ini akan otomatis tambah foreign key jika tabel parent ada.

### Pilihan C: Original (Might Error)
**File:** `forum-step-2-create-table.sql`

Versi original dengan foreign key langsung.

**Expected Result:**
```
result
--------------------------------
Table created successfully
```

**Jika Error:** 
- Error: "relation programs does not exist" → Gunakan `forum-step-2-simple.sql`
- Error: "relation classes does not exist" → Gunakan `forum-step-2-simple.sql`
- Error lain → Share error message

---

## Step 3: Create Function ✅

**File:** `forum-step-3-create-function.sql`

**Expected Result:**
```
result
--------------------------------
Function created successfully
```

**Jika Error:** Share error message lengkap

---

## Step 4: Create Trigger ✅

**File:** `forum-step-4-create-trigger.sql`

**Expected Result:**
```
result
--------------------------------
Trigger created successfully
```

**Jika Error:** 
- Pastikan Step 3 sudah berhasil
- Share error message

---

## Step 5: Backfill Existing Classes ✅

**File:** `forum-step-5-backfill.sql`

**Expected Result:**
Menampilkan list kelas dengan jumlah kategori masing-masing:
```
class_name          | category_count
--------------------|---------------
Kelas Data Science  | 2
Kelas Web Dev       | 2
```

**Jika Error:**
- Jika tidak ada kelas → OK, skip
- Jika error lain → Share error message

---

## Step 6: RLS (OPTIONAL) ⚠️

**File:** `forum-step-6-rls.sql`

**Kapan Skip:** 
- Jika tabel `enrollments` belum ada
- Jika tabel `participants` belum ada
- Jika tabel `user_profiles` belum ada

**Expected Result:**
```
result
--------------------------------
RLS policies created successfully
```

**Jika Error:** 
- SKIP step ini jika tabel belum ada
- Bisa setup RLS nanti setelah tabel dibuat

---

## Troubleshooting

### Error: "relation 'XXX' does not exist"

**Artinya:** Tabel XXX belum dibuat

**Solusi:** 
1. Jika tabel `programs` atau `classes` → Buat tabel ini dulu
2. Untuk Step 2, gunakan `forum-step-2-simple.sql` (tanpa foreign key)

### Error: "permission denied"

**Artinya:** User tidak punya akses

**Solusi:** 
- Pastikan login sebagai superuser/postgres
- Atau minta admin untuk grant permission

### Error: "syntax error"

**Artinya:** Ada masalah dengan SQL syntax

**Solusi:**
- Copy paste PERSIS dari file
- Jangan edit manual
- Share error message lengkap

### Error: "duplicate key value"

**Artinya:** Data sudah ada (ini OK)

**Solusi:** 
- SKIP, lanjut ke step berikutnya
- Atau delete data lama dulu

---

## Verifikasi Akhir

Setelah semua step selesai, jalankan query ini:

```sql
-- Check function
SELECT proname FROM pg_proc WHERE proname = 'create_default_forum_categories_for_class';
-- Result: create_default_forum_categories_for_class

-- Check trigger  
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'trigger_create_default_forum_categories';
-- Result: trigger_create_default_forum_categories

-- Check categories
SELECT 
    c.name as class_name,
    fc.name as category_name
FROM classes c
LEFT JOIN forum_categories fc ON fc.class_id = c.id
ORDER BY c.name, fc.order_index;
-- Result: Setiap kelas punya 2 kategori
```

---

## Test Auto-Create

Buat kelas baru untuk test:

```sql
-- Buat test class
INSERT INTO classes (program_id, name, description, start_date, end_date, max_participants)
SELECT 
    id,
    'Test Forum Class',
    'Test',
    CURRENT_DATE,
    CURRENT_DATE + 30,
    20
FROM programs
LIMIT 1
RETURNING id;

-- Check apakah kategori otomatis dibuat
SELECT * FROM forum_categories WHERE class_id = 'PASTE-ID-DARI-ATAS';
-- Harus ada 2 kategori: Perkenalan dan Konsultasi & Pertanyaan
```

---

## Summary

| Step | File | Status | Error? |
|------|------|--------|--------|
| 1 | forum-step-1-check.sql | ⬜ | |
| 2 | forum-step-2-simple.sql | ⬜ | |
| 3 | forum-step-3-create-function.sql | ⬜ | |
| 4 | forum-step-4-create-trigger.sql | ⬜ | |
| 5 | forum-step-5-backfill.sql | ⬜ | |
| 6 | forum-step-6-rls.sql (optional) | ⬜ | |

**✅ = Success | ❌ = Error | ⬜ = Not Run Yet**

---

## Need Help?

Jika masih ada error:
1. Note di step berapa error terjadi
2. Copy FULL error message
3. Kirim ke developer team

Format:
```
Step: 2
File: forum-step-2-simple.sql
Error: [paste full error message here]
```

