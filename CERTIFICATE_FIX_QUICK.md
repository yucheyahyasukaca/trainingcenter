# Quick Fix: Certificate Error 500 di Production

## Masalah
Certificate management page menunjukkan error 500 di production tapi bekerja di localhost.

## Penyebab
Environment variable `SUPABASE_SERVICE_ROLE_KEY` **TIDAK ADA** di production Vercel.

## Solusi CEPAT

### Step 1: Cek Environment Variables di Vercel

1. Login ke [Vercel Dashboard](https://vercel.com)
2. Pilih project Anda
3. Pergi ke **Settings** → **Environment Variables**
4. **CEK APAKAH ADA** variable `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Jika BELUM ADA, TAMBAHKAN

1. Klik **Add New**
2. Isi:
   - **Key**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: Service role key dari Supabase (lihat cara di bawah)
   - **Environment**: ✅ Production, ✅ Preview
3. Klik **Save**

### Step 3: Ambil Service Role Key dari Supabase

1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Pergi ke **Settings** → **API**
4. Scroll ke **Project API keys**
5. **COPY** yang **service_role** (bukan anon)
6. Paste ke Vercel

### Step 4: Redeploy

**Setelah tambah env var, WAJIB redeploy:**

**Cara 1 (Via Dashboard):**
1. Vercel Dashboard → **Deployments**
2. Klik **⋮** (tiga titik) pada deployment terbaru
3. Pilih **Redeploy**
4. Tunggu sampai selesai

**Cara 2 (Via CLI):**
```bash
vercel --prod
```

### Step 5: Test

1. Buka browser console (F12)
2. Buka halaman certificate management
3. Lihat logs - seharusnya tidak ada error 500

## Expected Logs (Setelah Fix)

**Browser Console:**
```
📥 Fetching certificate templates...
📥 Response status: 200
📥 Response ok: true
✅ Templates loaded: 2
```

**Vercel Logs:**
```
✓ Using Supabase admin client in production
✓ Supabase URL: https://...
✓ Service role key: eyJhbGc...
```

## Jika Masih Error

### Cek Vercel Logs:

1. Vercel Dashboard → **Deployments** → klik deployment
2. Klik tab **Logs**
3. Cari error dengan keyword:
   - `Missing required environment variable`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `500 Internal Server Error`

### Common Issues:

**Error: "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY"**
- ✅ Sudah tambah di Vercel?
- ✅ Sudah redeploy?
- ✅ Typo di nama variable? (case-sensitive)

**Error: 500 tapi tidak ada error message di logs**
- Kemungkinan logs terlalu lama, cek di console saat request
- Coba tambah env var lagi (redeploy)

**Error tetap muncul setelah semua langkah di atas**
- Pastikan service role key masih valid di Supabase
- Coba restart deployment di Vercel

## Verification Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` sudah ditambahkan di Vercel Settings
- [ ] Environment variable sudah di-set untuk **Production** dan **Preview**
- [ ] Sudah melakukan **Redeploy** setelah menambahkan env var
- [ ] Vercel logs menunjukkan "Using Supabase admin client in production"
- [ ] Browser console tidak menunjukkan error 500
- [ ] Certificate management page berhasil load data

## Quick Test Command

Test langsung API endpoint:
```bash
curl https://academy.garuda-21.com/api/admin/certificate-templates
```

**Expected Response:**
```json
{"data": [...]}
```

**Jika Error:**
```json
{"error": "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY"}
```

## Still Need Help?

Cek file-file ini untuk detail lengkap:
- `CERTIFICATE_PRODUCTION_FIX.md` - Root cause analysis
- `PRODUCTION_ENV_SETUP.md` - Setup guide lengkap
