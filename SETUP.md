# Panduan Setup Training Center Management System

## Prasyarat

Sebelum memulai, pastikan Anda telah menginstall:
- Node.js (versi 18 atau lebih baru)
- npm atau yarn
- Akun Supabase (gratis di [supabase.com](https://supabase.com))

## Langkah-langkah Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase

#### 2.1 Buat Project Baru di Supabase

1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Klik "New Project"
3. Isi detail project:
   - Name: Training Center (atau nama lain sesuai keinginan)
   - Database Password: Buat password yang kuat
   - Region: Pilih region terdekat
4. Klik "Create new project" dan tunggu beberapa saat

#### 2.2 Dapatkan API Credentials

1. Di Supabase Dashboard, klik Settings (ikon gear) di sidebar
2. Pilih "API"
3. Copy:
   - Project URL
   - Project API Key (anon/public)

#### 2.3 Setup Environment Variables

1. Copy file `.env.local.example` menjadi `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` dan isi dengan credentials Supabase Anda:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 3. Setup Database

1. Di Supabase Dashboard, klik "SQL Editor" di sidebar
2. Klik "New Query"
3. Copy seluruh isi file `supabase/schema.sql` ke SQL Editor
4. Klik "Run" untuk mengeksekusi query
5. Database Anda sekarang sudah siap dengan:
   - Tables: trainers, programs, participants, enrollments
   - Sample data untuk testing
   - Indexes untuk performa
   - Row Level Security policies

### 4. Jalankan Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di [http://localhost:3000](http://localhost:3000)

## Struktur Database

### Tabel `trainers`
- Menyimpan data trainer/instruktur
- Fields: name, email, phone, specialization, bio, experience_years, certification, status

### Tabel `programs`
- Menyimpan data program/kegiatan training
- Fields: title, description, category, duration_days, max_participants, price, status, start_date, end_date, trainer_id

### Tabel `participants`
- Menyimpan data peserta
- Fields: name, email, phone, company, position, address, date_of_birth, gender, status

### Tabel `enrollments`
- Menyimpan data pendaftaran peserta ke program
- Fields: program_id, participant_id, enrollment_date, status, payment_status, amount_paid, notes

## Fitur Aplikasi

### 1. Dashboard
- Statistik overview (total program, peserta, trainer, pendaftaran)
- Chart program per kategori
- Chart status pendaftaran
- Tabel pendaftaran terbaru

### 2. Manajemen Trainer
- Daftar trainer dengan pencarian
- Tambah trainer baru
- Edit data trainer
- Hapus trainer
- Filter berdasarkan status

### 3. Manajemen Peserta
- Daftar peserta dengan pencarian
- Tambah peserta baru
- Edit data peserta
- Hapus peserta
- Data lengkap peserta (perusahaan, posisi, dll)

### 4. Manajemen Program
- Tampilan grid program dengan informasi lengkap
- Tambah program baru
- Edit program
- Hapus program
- Assign trainer ke program
- Status program (draft, published, archived)

### 5. Manajemen Pendaftaran
- Daftarkan peserta ke program
- Update status pendaftaran
- Tracking pembayaran
- Catatan tambahan per pendaftaran

### 6. Statistik & Analytics
- Overview statistik
- Tren pendaftaran bulanan
- Performa trainer
- Revenue per program
- Berbagai chart interaktif

## Tips & Best Practices

### Security
- Jangan commit file `.env.local` ke git
- Gunakan Row Level Security (RLS) di Supabase untuk production
- Untuk production, tambahkan autentikasi user

### Performance
- Database sudah dilengkapi dengan indexes
- Gunakan pagination untuk data yang banyak
- Optimize query dengan select field yang diperlukan saja

### Development
- Gunakan TypeScript untuk type safety
- Components sudah dipisah berdasarkan fitur
- Tailwind CSS untuk styling yang konsisten

## Troubleshooting

### Error: Invalid API key
- Pastikan `.env.local` sudah dibuat
- Pastikan API key yang di-copy benar
- Restart development server setelah mengubah `.env.local`

### Error: relation does not exist
- Pastikan sudah menjalankan `supabase/schema.sql`
- Check di Supabase Dashboard > Table Editor apakah tables sudah ada

### Data tidak muncul
- Check browser console untuk error messages
- Pastikan RLS policies sudah di-setup (sudah included di schema.sql)
- Verify di Supabase Dashboard apakah data sudah ada

## Production Deployment

### Deploy ke Vercel (Recommended)

1. Push code ke GitHub
2. Login ke [Vercel](https://vercel.com)
3. Import project dari GitHub
4. Tambahkan environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

### Deploy ke Platform Lain
- Netlify
- Railway
- Render
- AWS Amplify

Pastikan selalu set environment variables yang diperlukan.

## Support

Jika menemui masalah atau butuh bantuan, silakan:
1. Check documentation di README.md
2. Review Supabase documentation
3. Check Next.js documentation

## License

MIT License

