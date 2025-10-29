# URL Shortener System

Sistem URL Shortener yang memungkinkan admin untuk membuat link pendek yang akan redirect ke URL panjang seperti program, halaman, dll.

## Fitur

- ✅ Membuat short URL dengan kode custom (misal: `/gemini2025`)
- ✅ Redirect otomatis ke destination URL
- ✅ Statistik click count
- ✅ Active/Inactive status
- ✅ Expiry date (optional)
- ✅ Description untuk memudahkan tracking
- ✅ Hanya bisa diakses oleh admin
- ✅ Automatic click counting

## Setup

### 1. Jalankan SQL Migration

Buka Supabase SQL Editor dan jalankan:

```sql
-- File: supabase/url-shortener-setup.sql
```

Atau salin dan jalankan SQL berikut di Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS short_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  short_code VARCHAR(50) UNIQUE NOT NULL,
  destination_url TEXT NOT NULL,
  description TEXT,
  click_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_short_links_code ON short_links(short_code);
CREATE INDEX IF NOT EXISTS idx_short_links_active ON short_links(is_active, expires_at);

ALTER TABLE short_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active short links"
  ON short_links
  FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Admin can manage short links"
  ON short_links
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

GRANT SELECT ON short_links TO authenticated;
GRANT ALL ON short_links TO authenticated;
```

### 2. Restart Development Server

Setelah migration selesai, restart development server:

```bash
npm run dev
```

## Cara Menggunakan

### Admin - Membuat Short URL

1. Login sebagai admin
2. Buka sidebar → pilih "URL Shortener"
3. Klik tombol "Add Short Link"
4. Isi form:
   - **Short Code**: Kode pendek (tanpa `/`) - contoh: `gemini2025`
   - **Destination URL**: URL lengkap tujuan - contoh: `http://localhost:3000/programs/9712d177-5cf4-4ed2-8e66-f871affb0549`
   - **Description**: Deskripsi untuk tracking - contoh: "Gemini 2025 Program"
   - **Expires At**: Tanggal kadaluarsa (opsional)
5. Klik "Create"

### Menggunakan Short URL

Setelah short URL dibuat, pengguna dapat mengakses:

```
http://localhost:3000/gemini2025
```

Dan akan otomatis redirect ke:

```
http://localhost:3000/programs/9712d177-5cf4-4ed2-8e66-f871affb0549
```

## Fitur Admin Panel

### Manajemen Short URL

Di halaman admin, Anda bisa:

- ✅ **View**: Melihat semua short URL dengan destination, click count, dan status
- ✅ **Search**: Mencari short URL berdasarkan code atau destination
- ✅ **Edit**: Mengubah short code, destination, description, expiry
- ✅ **Delete**: Menghapus short URL
- ✅ **Toggle Active/Inactive**: Menonaktifkan short URL tanpa menghapus
- ✅ **Copy URL**: Salin URL pendek dengan satu klik
- ✅ **Click Counter**: Melihat berapa kali short URL diklik

### Export/Share Short URL

Klik tombol **Copy** di kolom Code untuk menyalin short URL ke clipboard.

## Contoh Use Cases

### 1. Program Link Pendek

**Short Code**: `gemini2025`  
**Destination**: `http://localhost:3000/programs/9712d177-5cf4-4ed2-8e66-f871affb0549`

### 2. Promo Campaign

**Short Code**: `promo2025`  
**Destination**: `http://localhost:3000/programs?promo=true`  
**Expires**: 2025-12-31

### 3. Certificate Verification

**Short Code**: `verify-cert`  
**Destination**: `http://localhost:3000/certificate/verify`

## Technical Details

### File Structure

```
app/
├── admin/
│   └── url-shortener/
│       └── page.tsx              # Admin UI untuk manage short links
├── [code]/
│   └── page.tsx                  # Route handler untuk redirect
├── api/
│   ├── admin/
│   │   └── short-links/
│   │       ├── route.ts         # GET (list), POST (create)
│   │       └── [id]/
│   │           └── route.ts     # PUT (update), DELETE (delete)
└── components/
    └── layout/
        └── Sidebar.tsx           # Updated dengan menu URL Shortener

supabase/
└── url-shortener-setup.sql      # SQL migration

types/
└── database.ts                   # Updated dengan short_links types
```

### Database Schema

```typescript
short_links {
  id: UUID (PK)
  short_code: VARCHAR(50) UNIQUE
  destination_url: TEXT
  description: TEXT
  click_count: INTEGER DEFAULT 0
  is_active: BOOLEAN DEFAULT true
  expires_at: TIMESTAMP
  created_by: UUID (FK to auth.users)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

### Security

- ✅ Row Level Security (RLS) enabled
- ✅ Public read untuk active links
- ✅ Admin-only write/update/delete
- ✅ Expiry checking
- ✅ Active status checking
- ✅ Automatic click counting

## Troubleshooting

### Short URL tidak redirect?

1. Pastikan short link masih **Active**
2. Pastikan belum **Expired** (cek `expires_at`)
3. Cek console untuk error

### Tidak bisa create/edit short URL?

1. Pastikan login sebagai **admin**
2. Check role di table `user_profiles`
3. Cek RLS policies di Supabase

### Short code sudah dipakai?

- Short code harus unique
- Gunakan kode lain atau edit short link yang sudah ada

## Best Practices

1. **Gunakan kode yang deskriptif**: `gemini2025` lebih baik dari `abc123`
2. **Tambahkan description**: Memudahkan tracking di admin panel
3. **Set expiry date**: Untuk promo/campaign temporer
4. **Monitor click count**: Track efektivitas short URL
5. **Deactivate, jangan delete**: Simpan history, toggle inactive untuk menonaktifkan

## Future Enhancements

Ide untuk pengembangan selanjutnya:

- [ ] QR code generator untuk short URL
- [ ] Analytics dashboard (click by date, location, etc.)
- [ ] Bulk import/export
- [ ] Custom alias/slug
- [ ] Password protection untuk short URL
- [ ] Link preview/tracking pixel
- [ ] API untuk programmatic access

