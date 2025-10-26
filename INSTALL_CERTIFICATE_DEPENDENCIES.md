# Install Certificate System Dependencies

Jalankan perintah berikut untuk menginstall dependencies yang diperlukan untuk sistem sertifikat:

```bash
npm install pdf-lib qrcode
npm install --save-dev @types/qrcode
```

## Dependencies yang Diinstall

### pdf-lib
- Library untuk generate dan memanipulasi PDF
- Digunakan untuk mengisi template sertifikat dengan data peserta/trainer
- Support untuk embed images (QR code, signature)

### qrcode
- Library untuk generate QR code
- Digunakan untuk membuat QR code verification untuk setiap sertifikat
- Support berbagai format output (PNG, SVG, Data URL)

## Environment Variables

Pastikan environment variables berikut sudah diset:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=your_site_url
```

## Setup Database

1. Jalankan SQL script berikut di Supabase SQL Editor:
   - `supabase/create-certificate-system.sql`
   - `supabase/create-certificate-storage.sql`

2. Update `types/database.ts` dengan tabel sertifikat baru

## Testing

Setelah install dependencies dan setup database, test sistem dengan:

1. Login sebagai admin
2. Buka `/admin/certificate-templates`
3. Buat template sertifikat
4. Buka `/admin/certificate-requirements`
5. Set syarat kelulusan
6. Test generate sertifikat

## Troubleshooting

Jika ada error saat install:

1. **pdf-lib error**: Pastikan Node.js version >= 14
2. **qrcode error**: Pastikan TypeScript version compatible
3. **Supabase error**: Check environment variables dan permissions
