# 🔧 Trainer Role System Fix

## 📋 Masalah yang Ditemukan

Sistem trainer di GARUDA-21 Training Center memiliki inkonsistensi antara database schema dan implementasi frontend:

### 1. **Role Constraint Issue**
- `user_profiles` table memiliki constraint `CHECK (role IN ('admin', 'manager', 'user'))` 
- Tapi kode frontend mengharapkan role `'trainer'` ada
- Ini menyebabkan error saat mencoba assign role trainer

### 2. **Dua Sistem Trainer Terpisah**
- **Sistem 1**: Tabel `trainers` terpisah (digunakan di `/trainers` pages)
- **Sistem 2**: Role `'trainer'` di `user_profiles` (digunakan di access control)
- Kedua sistem tidak terintegrasi dengan baik

### 3. **Access Control Issues**
- Kode frontend mengecek `profile.role === 'trainer'`
- Tapi database tidak mengizinkan role trainer
- Menyebabkan trainer tidak bisa akses fitur yang seharusnya bisa

## 🛠️ Solusi yang Diimplementasikan

### 1. **Update Database Schema**
```sql
-- Update constraint untuk include 'trainer' role
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('admin', 'manager', 'trainer', 'user'));
```

### 2. **Integrasi Sistem Trainer**
- Menambahkan kolom trainer-specific ke `user_profiles`:
  - `trainer_level`: 'user', 'trainer_l1', 'trainer_l2', 'master_trainer'
  - `trainer_status`: 'active', 'inactive', 'suspended'
  - `trainer_specializations`: Array of specializations
  - `trainer_experience_years`: Years of experience
  - `trainer_certifications`: Certification details

### 3. **Fungsi Management Trainer**
- `promote_to_trainer()`: Promote user menjadi trainer
- `demote_trainer()`: Demote trainer menjadi user
- `is_trainer()`: Check apakah user adalah trainer

### 4. **Sinkronisasi Data**
- Tabel `trainers` tetap ada untuk backward compatibility
- Ditambahkan `user_id` column untuk link ke `user_profiles`
- Data trainer otomatis tersinkronisasi

## 🚀 Cara Menjalankan Fix

### Opsi 1: Menggunakan Script (Recommended)
```bash
# Install dependencies jika belum
npm install

# Jalankan fix script
node fix-trainer-role.js
```

### Opsi 2: Manual SQL Execution
1. Buka Supabase Dashboard
2. Pergi ke SQL Editor
3. Copy-paste isi file `supabase/FIX_TRAINER_ROLE_SYSTEM.sql`
4. Execute script

### Opsi 3: Menggunakan Supabase CLI
```bash
# Jika menggunakan Supabase CLI
supabase db reset
# atau
supabase db push
```

## ✅ Verifikasi Fix

Setelah menjalankan fix, verifikasi dengan:

1. **Check Database Schema**:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name LIKE 'trainer_%';
```

2. **Check Role Constraint**:
```sql
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'user_profiles'::regclass 
AND conname = 'user_profiles_role_check';
```

3. **Test Trainer Functions**:
```sql
-- Test promote to trainer
SELECT promote_to_trainer(
  'user-id-here'::uuid,
  'admin-id-here'::uuid,
  'trainer_l1',
  ARRAY['Leadership', 'Management'],
  5,
  'CPT Certified'
);

-- Test is_trainer function
SELECT is_trainer('user-id-here'::uuid);
```

## 🔄 Setelah Fix

### 1. **Restart Application**
```bash
npm run dev
# atau
yarn dev
```

### 2. **Test Trainer Functionality**
- Login sebagai admin/manager
- Coba promote user menjadi trainer
- Test akses trainer ke fitur yang seharusnya bisa
- Test trainer management di dashboard

### 3. **Update Frontend Code (Jika Diperlukan)**
Beberapa komponen mungkin perlu update untuk menggunakan sistem baru:

```typescript
// Contoh update untuk check trainer role
const isTrainer = profile?.role === 'trainer' && profile?.trainer_status === 'active'

// Contoh update untuk get trainer level
const trainerLevel = profile?.trainer_level || 'user'
```

## 📊 Struktur Data Baru

### User Profiles dengan Trainer Info
```typescript
interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'trainer' | 'user'
  trainer_level: 'user' | 'trainer_l1' | 'trainer_l2' | 'master_trainer'
  trainer_status: 'active' | 'inactive' | 'suspended'
  trainer_specializations: string[]
  trainer_experience_years: number
  trainer_certifications: string
  // ... other fields
}
```

### Trainer Management Functions
```typescript
// Promote user to trainer
await supabase.rpc('promote_to_trainer', {
  p_user_id: userId,
  p_promoted_by: adminId,
  p_trainer_level: 'trainer_l1',
  p_specializations: ['Leadership', 'Management'],
  p_experience_years: 5,
  p_certifications: 'CPT Certified'
})

// Check if user is trainer
const { data: isTrainer } = await supabase.rpc('is_trainer', {
  p_user_id: userId
})
```

## 🐛 Troubleshooting

### Error: "role check constraint failed"
- Pastikan sudah menjalankan migration script
- Check constraint sudah diupdate

### Error: "function promote_to_trainer does not exist"
- Pastikan migration script berhasil dijalankan
- Check fungsi sudah dibuat di database

### Trainer tidak bisa akses fitur
- Pastikan `trainer_status = 'active'`
- Check role-based access control logic
- Restart application setelah migration

## 📝 Notes

- Migration ini backward compatible
- Data existing tidak akan hilang
- Tabel `trainers` tetap ada untuk compatibility
- Semua trainer data akan tersinkronisasi otomatis

## 🔗 Related Files

- `supabase/FIX_TRAINER_ROLE_SYSTEM.sql` - Migration script
- `fix-trainer-role.js` - Automation script
- `types/database.ts` - TypeScript types (sudah updated)
- `types/index.ts` - Interface definitions
