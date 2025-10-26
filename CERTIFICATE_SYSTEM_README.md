# Sistem Sertifikat Training Center

Sistem sertifikat yang komprehensif untuk mengelola penerbitan sertifikat otomatis untuk peserta dan trainer yang lulus program pelatihan.

## Fitur Utama

### 1. Template Sertifikat
- Upload template PDF sertifikat
- Konfigurasi field yang dapat diisi (nama peserta, program, tanggal, dll)
- Pengaturan penandatangan (nama dan jabatan)
- Upload signature image untuk penandatangan

### 2. Syarat Kelulusan
- **Completion Percentage**: Peserta harus menyelesaikan minimal X% dari materi
- **Minimum Participants**: Kelas harus memiliki minimal X peserta (untuk trainer certificate)
- **Minimum Pass Rate**: Minimal X% peserta harus lulus (untuk trainer certificate)
- **All Activities**: Peserta harus menyelesaikan semua aktivitas wajib

### 3. Generate Sertifikat Otomatis
- **Peserta**: Sertifikat otomatis digenerate ketika peserta menyelesaikan program dan memenuhi syarat
- **Trainer**: Sertifikat otomatis digenerate ketika kelas mencapai 50 peserta dan minimal 50% peserta lulus

### 4. QR Code Verification
- Setiap sertifikat memiliki QR code unik
- QR code mengarah ke halaman verifikasi sertifikat
- Menampilkan detail lengkap sertifikat dan status validitas

### 5. Management Interface
- **Admin**: Kelola template, syarat, dan sertifikat
- **Peserta/Trainer**: Lihat dan download sertifikat mereka
- **Public**: Verifikasi sertifikat melalui QR code

## Struktur Database

### Tabel Utama

#### `certificate_templates`
- Template PDF sertifikat untuk setiap program
- Konfigurasi field dan penandatangan

#### `certificates`
- Sertifikat yang sudah digenerate
- Data penerima dan program
- URL PDF dan QR code

#### `certificate_requirements`
- Syarat kelulusan untuk setiap program
- Jenis requirement dan nilai minimum

#### `certificate_verifications`
- Log verifikasi QR code
- Tracking siapa yang memverifikasi dan kapan

## API Endpoints

### Admin Endpoints
- `GET/POST/PUT/DELETE /api/admin/certificate-templates` - Kelola template
- `GET/POST/PUT/DELETE /api/admin/certificate-requirements` - Kelola syarat
- `GET/POST/PUT/DELETE /api/admin/certificates` - Kelola sertifikat
- `POST /api/admin/certificates/generate-pdf` - Generate PDF sertifikat
- `POST /api/admin/certificates/batch-generate` - Generate batch sertifikat
- `GET /api/admin/certificates/download/[certificateNumber]` - Download PDF

### Public Endpoints
- `GET /api/certificate/verify/[certificateNumber]` - Verifikasi sertifikat
- `GET /api/certificate/[certificateNumber]` - Detail sertifikat
- `GET /api/certificate/user/[userId]` - Sertifikat user

## Halaman Frontend

### Admin Pages
- `/admin/certificate-templates` - Kelola template sertifikat
- `/admin/certificate-requirements` - Kelola syarat kelulusan
- `/admin/certificates` - Kelola sertifikat yang sudah digenerate

### User Pages
- `/my-certificates` - Lihat sertifikat saya (peserta/trainer)
- `/certificate/[certificateNumber]` - Detail sertifikat
- `/certificate/verify/[certificateNumber]` - Verifikasi sertifikat

## Cara Penggunaan

### 1. Setup Template Sertifikat (Admin)
1. Buka `/admin/certificate-templates`
2. Klik "Create Template"
3. Pilih program
4. Upload template PDF
5. Isi nama dan jabatan penandatangan
6. Upload signature image (opsional)
7. Simpan template

### 2. Setup Syarat Kelulusan (Admin)
1. Buka `/admin/certificate-requirements`
2. Klik "Create Requirement"
3. Pilih program dan jenis requirement
4. Set nilai minimum (0-100)
5. Tambahkan deskripsi
6. Simpan requirement

### 3. Generate Sertifikat
- **Otomatis**: Sertifikat akan digenerate otomatis ketika syarat terpenuhi
- **Manual**: Admin dapat generate manual melalui `/admin/certificates`

### 4. Verifikasi Sertifikat
1. Scan QR code di sertifikat
2. Atau kunjungi `/certificate/verify/[certificateNumber]`
3. Lihat detail sertifikat dan status validitas

## Storage Buckets

Sistem menggunakan Supabase Storage dengan bucket berikut:
- `certificate-templates` - Template PDF (private)
- `certificates` - Sertifikat PDF yang sudah digenerate (public)
- `certificate-qr-codes` - QR code images (public)
- `signatures` - Signature images (private)

## Dependencies

### Backend
- `pdf-lib` - Generate PDF dari template
- `qrcode` - Generate QR code
- `@supabase/supabase-js` - Database dan storage

### Frontend
- `next.js` - Framework
- `tailwindcss` - Styling
- `lucide-react` - Icons

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=your_site_url
```

## Setup Database

1. Jalankan `supabase/create-certificate-system.sql` untuk membuat tabel
2. Jalankan `supabase/create-certificate-storage.sql` untuk setup storage
3. Update `types/database.ts` dengan tabel baru

## Mobile Responsive

Semua interface sudah dioptimasi untuk mobile dengan:
- Responsive grid layout
- Touch-friendly buttons
- Mobile navigation
- Optimized forms untuk mobile

## Security

- Row Level Security (RLS) diaktifkan untuk semua tabel
- Admin-only access untuk management functions
- Public access hanya untuk verifikasi sertifikat
- File upload dengan validasi tipe dan ukuran

## Performance

- Lazy loading untuk PDF generation
- Caching untuk template dan requirements
- Optimized queries dengan proper indexing
- Batch processing untuk generate multiple certificates

## Troubleshooting

### Common Issues

1. **PDF tidak ter-generate**
   - Check template PDF URL
   - Verify storage permissions
   - Check PDF generation logs

2. **QR code tidak muncul**
   - Verify QR code generation
   - Check storage bucket permissions
   - Verify QR code URL

3. **Sertifikat tidak otomatis generate**
   - Check certificate requirements
   - Verify enrollment status
   - Check trigger functions

### Logs
- Check Supabase logs untuk database errors
- Check Next.js logs untuk API errors
- Check browser console untuk frontend errors
