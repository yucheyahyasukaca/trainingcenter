# 🚀 Instalasi Sederhana - Form Program Baru

## ⚡ Quick Install (3 Langkah)

### 1️⃣ Jalankan SQL

Buka **Supabase Dashboard** → **SQL Editor**

Copy-paste file ini dan klik **Run**:
```
supabase/simple-program-update.sql
```

**Script ini akan:**
- ✅ Buat tabel `program_categories`
- ✅ Tambah kolom baru ke tabel `programs`
- ✅ **TIDAK menghapus** kolom yang sudah ada
- ✅ Buat function auto-approval
- ✅ Buat function TOT promotion
- ✅ Buat validasi periode pendaftaran

### 2️⃣ Restart Server

```bash
# Stop (Ctrl+C) kemudian:
npm run dev
```

### 3️⃣ Test

Buka: `http://localhost:3000/programs` → **Tambah Program Baru**

---

## ✅ Apa yang Ditambahkan?

### Tabel Baru:
```sql
program_categories
  - id
  - name (unique)
  - description
  - created_at
  - updated_at
```

### Kolom Baru di `programs`:
```sql
- program_type (tot/regular)
- is_free (true/false)
- registration_type (lifetime/limited)
- registration_start_date
- registration_end_date
- auto_approved
```

### Kategori Default (8):
1. Leadership
2. Technology
3. Marketing
4. Finance
5. Human Resources
6. Operations
7. Sales
8. Customer Service

---

## 🎯 Fitur yang Berfungsi:

### ✅ Program Gratis
- Peserta daftar → otomatis approved
- Tidak perlu konfirmasi admin

### ✅ Program TOT
- Peserta lulus → otomatis jadi Trainer Level 0

### ✅ Periode Pendaftaran
- **Lifetime:** Bisa daftar kapan saja
- **Limited:** Hanya bisa daftar dalam periode tertentu

### ✅ Kategori dengan Auto-complete
- Ketik untuk search
- Tambah kategori baru on-the-fly

---

## ❌ Jika Masih Error

### Error: "relation programs does not exist"
**Artinya:** Tabel programs belum ada

**Fix:** Jalankan dulu schema.sql atau migration awal

### Error: "column already exists"
**Artinya:** Sudah pernah dijalankan sebelumnya

**Fix:** Tidak masalah, script sudah handle ini dengan `IF NOT EXISTS`

### Error: "permission denied"
**Artinya:** User tidak punya akses

**Fix:** Login sebagai admin di Supabase

---

## 📝 Catatan Penting

1. **Script ini AMAN** - tidak menghapus data
2. **Bisa dijalankan berkali-kali** - sudah ada checking
3. **Tidak mengubah field lama** - hanya menambah yang baru
4. **Kolom lama tetap ada** - start_date, end_date, duration_days, dll masih ada
5. **Backward compatible** - program lama tetap berfungsi

---

## 🎉 Selesai!

Setelah langkah 1-3, form program baru siap digunakan dengan fitur:
- ✅ Kategori auto-complete
- ✅ Gratis/Berbayar
- ✅ TOT/Regular
- ✅ Lifetime/Limited registration
- ✅ Auto-approval
- ✅ Auto-promotion trainer

**Simpel dan langsung jalan!** 🚀

