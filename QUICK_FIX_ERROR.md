# 🚨 Quick Fix - Error "duration_days column not found"

## ❌ Masalah:
Error: `Could not find the 'duration_days' column of 'programs' in the schema cache`

**Penyebab:** Form masih mencoba mengakses kolom `duration_days` yang tidak ada di database.

## ✅ Solusi:

### 1️⃣ Jalankan SQL Fix

Buka **Supabase Dashboard** → **SQL Editor**

Copy-paste file ini dan klik **Run**:
```
supabase/minimal-fix.sql
```

### 2️⃣ Restart Server

```bash
# Stop (Ctrl+C) kemudian:
npm run dev
```

### 3️⃣ Test Form

Buka: `http://localhost:3000/programs` → **Tambah Program Baru**

---

## 🔧 Yang Sudah Diperbaiki:

### ✅ Form Code
- Hapus `duration_days: null` dari dataToInsert
- Hapus `max_participants: null` dari dataToInsert  
- Hapus `trainer_id: null` dari dataToInsert
- Hanya kirim field yang benar-benar ada di database

### ✅ Database
- Tambah kolom baru yang diperlukan
- Tidak menghapus kolom lama
- Update data existing dengan default values

---

## 📋 Field yang Dikirim Sekarang:

```typescript
const dataToInsert = {
  title: formData.title,
  description: formData.description,
  category: formData.category,
  price: formData.price_type === 'gratis' ? 0 : formData.price,
  is_free: formData.price_type === 'gratis',
  status: formData.status,
  registration_type: formData.registration_type,
  registration_start_date: formData.registration_type === 'limited' ? formData.registration_start_date : null,
  registration_end_date: formData.registration_type === 'limited' ? formData.registration_end_date : null,
  program_type: formData.program_type,
  auto_approved: formData.price_type === 'gratis',
}
```

**Tidak ada lagi:**
- ❌ `duration_days`
- ❌ `max_participants` 
- ❌ `trainer_id`

---

## 🎯 Expected Result:

Setelah langkah 1-3, form program baru akan:
- ✅ Berhasil membuat program
- ✅ Menampilkan toast success
- ✅ Redirect ke halaman programs
- ✅ Semua fitur baru berfungsi

---

## 🐛 Jika Masih Error:

### Error: "relation programs does not exist"
**Fix:** Jalankan dulu schema.sql atau migration awal

### Error: "permission denied"  
**Fix:** Login sebagai admin di Supabase

### Error: "column already exists"
**Fix:** Tidak masalah, script sudah handle dengan `IF NOT EXISTS`

---

**Coba jalankan `minimal-fix.sql` dan test lagi!** 🚀
