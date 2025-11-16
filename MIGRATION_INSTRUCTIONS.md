# Migration Instructions - Add Extended Fields to Participants Table

## Langkah-langkah:

1. **Buka Supabase Dashboard**
   - Login ke https://supabase.com
   - Pilih project Anda

2. **Buka SQL Editor**
   - Di sidebar kiri, klik "SQL Editor"
   - Klik "New query"

3. **Copy dan Paste SQL berikut:**

```sql
-- Add extended fields to participants table
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS background TEXT,
ADD COLUMN IF NOT EXISTS career_info TEXT,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS education_status TEXT,
ADD COLUMN IF NOT EXISTS employment_status TEXT,
ADD COLUMN IF NOT EXISTS it_background TEXT,
ADD COLUMN IF NOT EXISTS disability TEXT,
ADD COLUMN IF NOT EXISTS program_source TEXT,
ADD COLUMN IF NOT EXISTS provinsi TEXT,
ADD COLUMN IF NOT EXISTS kabupaten TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);
```

4. **Run Query**
   - Klik tombol "Run" atau tekan Ctrl+Enter
   - Tunggu sampai selesai

5. **Verifikasi**
   - Setelah berhasil, coba simpan profil lagi di aplikasi
   - Data seharusnya tersimpan dengan lengkap

## File SQL Migration

File lengkap ada di: `supabase/add-participant-extended-fields.sql`

## Troubleshooting

Jika ada error:
- Pastikan Anda memiliki akses admin ke database
- Cek apakah kolom sudah ada sebelumnya
- Lihat error message untuk detail lebih lanjut

