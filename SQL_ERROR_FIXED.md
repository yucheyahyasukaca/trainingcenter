# ✅ SQL Error Fixed - Certificate System

## Error yang Diperbaiki

**Error**: `ERROR: 42601: record variable cannot be part of multiple-item INTO list`

**Penyebab**: PostgreSQL tidak mengizinkan penggunaan multiple record variables dalam satu SELECT INTO statement.

**Solusi**: Mengubah query untuk menggunakan single record dengan alias field yang spesifik.

## Perubahan yang Dilakukan

### Sebelum (Error):
```sql
SELECT e.*, p.*, pr.*, c.*
INTO enrollment_record, participant_record, program_record, class_record
FROM enrollments e
JOIN participants p ON e.participant_id = p.id
JOIN programs pr ON e.program_id = pr.id
LEFT JOIN classes c ON e.class_id = c.id
WHERE e.id = p_enrollment_id;
```

### Sesudah (Fixed):
```sql
SELECT e.*, p.name as participant_name, p.company as participant_company, p.position as participant_position,
       pr.title as program_title, pr.start_date as program_start_date, pr.end_date as program_end_date,
       c.name as class_name
INTO enrollment_record
FROM enrollments e
JOIN participants p ON e.participant_id = p.id
JOIN programs pr ON e.program_id = pr.id
LEFT JOIN classes c ON e.class_id = c.id
WHERE e.id = p_enrollment_id;
```

## Cara Menjalankan SQL yang Sudah Diperbaiki

### 1. Gunakan File yang Sudah Diperbaiki
File `supabase/create-certificate-system.sql` sudah diperbaiki dan siap digunakan.

### 2. Jalankan di Supabase SQL Editor
1. Buka Supabase Dashboard
2. Pergi ke SQL Editor
3. Copy-paste isi file `supabase/create-certificate-system.sql`
4. Klik "Run" untuk menjalankan script

### 3. Verifikasi Setup
Setelah script berhasil dijalankan, verifikasi dengan:

```sql
-- Check tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'certificate%';

-- Check functions created
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%certificate%';
```

## Expected Output

Setelah script berhasil dijalankan, Anda akan melihat:

```
Certificate system database schema created successfully!
```

## Next Steps

1. **Install Dependencies**:
   ```bash
   npm install pdf-lib qrcode @types/qrcode
   ```

2. **Setup Storage**:
   - Jalankan `supabase/create-certificate-storage.sql`

3. **Test System**:
   - Login sebagai admin
   - Buka `/admin/certificate-templates`
   - Buat template sertifikat pertama

## Troubleshooting

Jika masih ada error:

1. **Check Dependencies**: Pastikan extension `uuid-ossp` sudah aktif
2. **Check References**: Pastikan tabel `programs`, `participants`, `enrollments`, `classes` sudah ada
3. **Check Permissions**: Pastikan menggunakan service role key

## File yang Sudah Diperbaiki

- ✅ `supabase/create-certificate-system.sql` - Database schema (FIXED)
- ✅ `supabase/create-certificate-storage.sql` - Storage buckets
- ✅ Semua API endpoints dan frontend pages
- ✅ Types database sudah diupdate

Sistem sertifikat sekarang siap digunakan tanpa error SQL!
