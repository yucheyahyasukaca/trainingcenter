# Production Environment Setup Guide

## Masalah: API Certificate Error 500 di Production

Setelah di-build untuk production, certificate tidak bisa diakses karena error 500. Ini terjadi karena environment variable yang diperlukan tidak diset di production.

## Environment Variables yang Diperlukan

Pastikan environment variable berikut sudah diset di production:

### 1. Required Variables

```env
# Supabase URL (sudah ada di public env)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url

# Supabase Anonymous Key (sudah ada di public env)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase Service Role Key (PENTING untuk API Admin)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Cara Mendapatkan Service Role Key

1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Pergi ke **Settings** > **API**
4. Scroll ke bagian **Project API keys**
5. Copy **service_role** key (bukan anon key)
6. **PENTING**: Service role key harus dirahasiakan dan tidak boleh di-expose ke client

## Setup di Vercel (Production)

### Cara 1: Via Vercel Dashboard

1. Login ke [Vercel Dashboard](https://vercel.com)
2. Pilih project Anda
3. Pergi ke **Settings** > **Environment Variables**
4. Tambahkan environment variables:
   - **Key**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: service role key dari Supabase
   - **Environment**: Production (dan Preview jika perlu)
5. Klik **Save**
6. **Redeploy** project

### Cara 2: Via Vercel CLI

```bash
# Install Vercel CLI jika belum
npm i -g vercel

# Set environment variable
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Masukkan value ketika diminta

# Redeploy
vercel --prod
```

## Setup di Platform Lain

### Netlify

```bash
# Via CLI
netlify env:set SUPABASE_SERVICE_ROLE_KEY "your-key" --context production

# Atau via Netlify Dashboard
# Site settings > Build & deploy > Environment variables
```

### Railway

```bash
# Via Railway CLI
railway variables set SUPABASE_SERVICE_ROLE_KEY="your-key"

# Atau via Railway Dashboard
# Project > Variables > Add Variable
```

### Docker/Other

Tambahkan environment variable saat build/run:

```bash
# Docker
docker run -e SUPABASE_SERVICE_ROLE_KEY=your-key your-image

# Node.js
NODE_ENV=production SUPABASE_SERVICE_ROLE_KEY=your-key npm start
```

## Verifikasi Setup

Setelah setup, verifikasi dengan cara berikut:

1. **Check logs production**:
   - Login ke Vercel Dashboard
   - Pergi ke **Deployments** > pilih deployment terbaru
   - Klik **Logs**
   - Cari log "✓ Using Supabase admin client in production"

2. **Test API endpoint**:
   ```bash
   curl https://your-domain.com/api/admin/certificate-templates
   ```

3. **Check browser console**:
   - Buka browser dev tools
   - Network tab
   - Try akses certificate templates
   - Seharusnya tidak ada error 500

## Troubleshooting

### Error: "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY"

**Solusi**: 
- Pastikan environment variable sudah diset di production
- Pastikan sudah redeploy setelah menambahkan env var
- Check ejaan variable name (case-sensitive)

### Error: 500 Internal Server Error

**Kemungkinan penyebab**:
1. Environment variable tidak ter-set
2. Service role key salah/expired
3. Database table tidak ada

**Solusi**:
1. Check logs production untuk detail error
2. Verifikasi service role key di Supabase dashboard
3. Check apakah table `certificate_templates` dan `certificate_requirements` sudah ada

### Error di Localhost tapi OK di Production

**Kemungkinan**: 
- Localhost menggunakan env var yang berbeda
- Pastikan `.env.local` sudah ada dan benar

## Security Best Practices

⚠️ **PENTING**: Service Role Key sangat sensitif!

- ✅ **Jangan** commit `.env` files ke git
- ✅ **Jangan** expose service role key ke client
- ✅ **Hanya** gunakan service role key di server-side API routes
- ✅ **Gunakan** anon key untuk client-side operations
- ✅ **Rotate** key jika ter-expose

## File yang Menggunakan Service Role Key

- `lib/supabase-admin.ts` - Admin client
- `app/api/admin/*` - Admin API routes
- Certificate API routes
- User management routes

## Testing Checklist

- [ ] Environment variable sudah diset di production
- [ ] Project sudah di-redeploy setelah set env var
- [ ] Logs menampilkan "Using Supabase admin client in production"
- [ ] API `/api/admin/certificate-templates` berhasil diakses
- [ ] API `/api/admin/certificate-requirements` berhasil diakses
- [ ] Tidak ada error 500 di browser console
- [ ] Certificate bisa diakses dari UI

## Selesai!

Setelah setup lengkap, certificate API seharusnya berfungsi dengan baik di production! 🎉
