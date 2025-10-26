# Setup Certificate System Database

Jalankan script SQL berikut di Supabase SQL Editor untuk setup sistem sertifikat:

## 1. Create Certificate System Tables

Jalankan file `supabase/create-certificate-system.sql` di Supabase SQL Editor.

Script ini akan membuat:
- Tabel `certificate_templates` - Template sertifikat
- Tabel `certificates` - Sertifikat yang sudah digenerate
- Tabel `certificate_requirements` - Syarat kelulusan
- Tabel `certificate_verifications` - Log verifikasi
- Functions untuk generate sertifikat otomatis
- Triggers untuk auto-generate sertifikat
- Indexes untuk performance
- RLS policies untuk security

## 2. Create Storage Buckets

Jalankan file `supabase/create-certificate-storage.sql` di Supabase SQL Editor.

Script ini akan membuat:
- Bucket `certificate-templates` (private)
- Bucket `certificates` (public)
- Bucket `certificate-qr-codes` (public)
- Bucket `signatures` (private)
- Storage policies untuk access control

## 3. Update Database Types

Update file `types/database.ts` dengan tabel sertifikat baru yang sudah dibuat.

## 4. Test Setup

Setelah menjalankan semua script, test dengan:

1. Login sebagai admin
2. Buka `/admin/certificate-templates`
3. Buat template sertifikat baru
4. Upload PDF template
5. Set penandatangan
6. Simpan template

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Pastikan menggunakan service role key
   - Check RLS policies

2. **Table Already Exists**
   - Script menggunakan `CREATE TABLE IF NOT EXISTS`
   - Aman untuk dijalankan berulang

3. **Function Errors**
   - Check dependencies (uuid-ossp extension)
   - Verify table references

4. **Storage Errors**
   - Check bucket permissions
   - Verify storage policies

### Verification

Untuk memverifikasi setup berhasil:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'certificate%';

-- Check functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%certificate%';

-- Check storage buckets
SELECT name FROM storage.buckets 
WHERE name LIKE '%certificate%';
```

## Next Steps

Setelah database setup selesai:

1. Install dependencies: `npm install pdf-lib qrcode @types/qrcode`
2. Update environment variables
3. Test sistem sertifikat
4. Setup template sertifikat untuk program yang ada
5. Configure certificate requirements
6. Test auto-generation
