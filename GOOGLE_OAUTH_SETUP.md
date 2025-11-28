# Panduan Setup Google OAuth Login untuk Supabase Self-Hosted

GARUDA-21 Training Center - Garuda Academy

## 📋 Daftar Isi

1. [Prerequisites](#prerequisites)
2. [Setup Google Cloud Console](#setup-google-cloud-console)
3. [Konfigurasi Supabase](#konfigurasi-supabase)
4. [Testing](#testing)
5. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

- Supabase Self-Hosted sudah berjalan
- Docker & Docker Compose terinstall
- Akses ke Google Cloud Console
- Akun Google untuk testing

---

## 🎯 Step 1: Setup Google Cloud Console

### A. Buka Google Cloud Console

1. Kunjungi: https://console.cloud.google.com/
2. Login dengan akun Google Anda
3. Buat project baru atau pilih project yang sudah ada

### B. Enable Google+ API

1. Di sidebar, klik **APIs & Services** → **Library**
2. Cari **"Google+ API"** atau **"People API"**
3. Klik pada hasil pencarian
4. Klik tombol **Enable**

### C. Create OAuth 2.0 Credentials

1. Klik **APIs & Services** → **Credentials**
2. Klik **Create Credentials** → **OAuth client ID**
3. Jika diminta, buat **OAuth consent screen** terlebih dahulu:
   - Pilih **External** user type
   - Isi informasi aplikasi:
     - **App name**: `GARUDA-21 Training Center`
     - **User support email**: Email Anda
     - **Developer contact information**: Email Anda
   - Klik **Save and Continue**
   - Di step Scopes, klik **Save and Continue**
   - Di step Test users, klik **Save and Continue**
   - Di step Summary, klik **Back to Dashboard**

4. Kembali ke **Credentials**, klik **Create Credentials** → **OAuth client ID**
5. Pilih **Application type**: **Web application**
6. Beri nama: `GARUDA-21 Web Client`
7. Isi **Authorized JavaScript origins**:
   ```
   http://localhost:8000
   http://localhost:3000
   ```
8. Isi **Authorized redirect URIs**:
   ```
   http://localhost:8000/auth/v1/callback
   ```
9. Klik **Create**
10. **PENTING**: Copy **Client ID** dan **Client Secret**
    - Client ID: `123456789-xxxxxxxxxxx.apps.googleusercontent.com`
    - Client Secret: `GOCSPX-xxxxxxxxxxxxxxxx`

⚠️ **Catatan**: Redirect URI harus sama persis dengan yang dikonfigurasi!

---

## 🐳 Step 2: Konfigurasi Supabase

### A. Buat File Environment Variables

1. Di folder `supabase`, buat file `.env`:

```bash
cd supabase
nano .env
```

2. Tambahkan credentials Google:

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

**Contoh:**
```bash
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz456
```

3. Simpan file (Ctrl+X, kemudian Y, kemudian Enter)

### B. Restart Supabase Container

```bash
docker-compose down
docker-compose up -d
```

### C. Verifikasi Konfigurasi

Cek logs untuk memastikan Google OAuth sudah ter-load:

```bash
docker-compose logs api | grep -i google
```

Anda harus melihat pesan bahwa Google provider sudah enabled.

---

## 🧪 Step 3: Testing

### A. Buka Aplikasi

1. Buka browser: `http://localhost:3000/login`
2. Klik tombol **"Masuk dengan Google"**

### B. Test OAuth Flow

1. Browser akan redirect ke Google Sign-in
2. Pilih akun Google Anda
3. Berikan akses ke aplikasi
4. Browser akan redirect kembali ke aplikasi
5. Anda akan masuk sebagai user yang baru

### C. Verifikasi User Profile

1. Setelah login, cek di database:
```sql
SELECT * FROM auth.users WHERE email = 'your-email@gmail.com';
SELECT * FROM user_profiles WHERE email = 'your-email@gmail.com';
```

2. User profile seharusnya otomatis dibuat oleh trigger

---

## 🔧 Troubleshooting

### Error: "Unsupported provider: provider is not enabled"

**Penyebab**: Environment variables belum di-set atau container belum direstart

**Solusi**:
1. Cek file `.env` sudah ada dan berisi credentials Google
2. Restart container: `docker-compose restart api`
3. Cek logs: `docker-compose logs api`

### Error: "redirect_uri_mismatch"

**Penyebab**: Redirect URI di Google Console tidak sesuai dengan yang dikonfigurasi

**Solusi**:
1. Buka Google Cloud Console → Credentials
2. Edit OAuth 2.0 Client ID Anda
3. Pastikan **Authorized redirect URIs** berisi:
   
   **Untuk Development (Local):**
   ```
   http://localhost:8000/auth/v1/callback
   ```
   
   **Untuk Production (supabase.garuda-21.com):**
   ```
   https://supabase.garuda-21.com/auth/v1/callback
   ```
   
   **PENTING**: Tambahkan KEDUA redirect URI jika Anda menggunakan keduanya (development dan production)

4. Simpan perubahan
5. Tunggu beberapa menit untuk propagasi
6. Coba login lagi

### Google Sign-in Button Tidak Muncul

**Penyebab**: Konfigurasi di aplikasi belum benar

**Solusi**:
1. Cek file `lib/auth.ts` sudah berisi fungsi `signInWithGoogle()`
2. Cek file `app/login/page.tsx` sudah import dan menggunakan fungsi tersebut
3. Cek console browser untuk error messages

### Error: "Database error" saat login

**Penyebab**: User profile belum dibuat saat login pertama kali

**Solusi**:
1. Cek trigger `on_auth_user_created` sudah ada di database
2. Jalankan SQL untuk membuat trigger jika belum ada:
```sql
-- Cek trigger sudah ada
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Jika belum ada, buat trigger
\i auth-setup.sql
```

### Google Login Berhasil tapi Redirect Error

**Penyebab**: Callback URL di aplikasi tidak sesuai

**Solusi**:
1. Cek file `lib/auth.ts` pada fungsi `signInWithGoogle()`
2. Pastikan `redirectTo` mengarah ke halaman yang benar:
```typescript
redirectTo: `${window.location.origin}/dashboard`
```

---

## 📝 Checklist

- [ ] Google Cloud Console project dibuat
- [ ] Google+ API di-enable
- [ ] OAuth credentials dibuat
- [ ] Redirect URIs dikonfigurasi dengan benar
- [ ] Client ID dan Secret disalin
- [ ] File `.env` dibuat dengan credentials
- [ ] Supabase container di-restart
- [ ] Logs dicek untuk konfirmasi
- [ ] Login di-test di aplikasi
- [ ] User profile otomatis dibuat

---

## 🚀 Production Setup

Untuk production dengan domain `supabase.garuda-21.com`, ubah konfigurasi berikut:

### 1. Google Cloud Console

Tambahkan domain production:

**Authorized JavaScript origins** (domain frontend aplikasi Next.js):
- `https://academy.garuda-21.com` ← **Ini yang benar untuk point 4**
- Jika masih development, tambahkan juga: `http://localhost:3000`

**Authorized redirect URIs** (harus sesuai dengan yang dikirim oleh Supabase):
- `https://supabase.garuda-21.com/auth/v1/callback` ← **Ideal: Supabase backend**
- `https://academy.garuda-21.com/auth/v1/callback` ← **Jika Supabase mengirim ini, tambahkan juga**
- Jika masih development, tambahkan juga: `http://localhost:8000/auth/v1/callback`

**⚠️ PENTING**: 
- Jika di query string parameters Anda melihat `redirect_uri` = `academy.garuda-21.com/auth/v1/callback`, maka **TAMBAHKAN** URI tersebut ke Authorized redirect URIs
- Idealnya Supabase harus mengirim `redirect_uri` ke `supabase.garuda-21.com/auth/v1/callback`, tapi jika tidak, tambahkan yang dikirim oleh Supabase

**Penjelasan**:
- **Authorized JavaScript origins** = domain di mana aplikasi frontend (Next.js) berjalan → `academy.garuda-21.com`
- **Authorized redirect URIs** = URI yang dikirim oleh Supabase ke Google (bisa backend atau frontend tergantung konfigurasi)

### 2. Supabase Environment

Update `supabase/docker-compose.yml`:
```yaml
API_EXTERNAL_URL: https://supabase.garuda-21.com
GOTRUE_SITE_URL: https://academy.garuda-21.com  # domain aplikasi frontend
GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI: "https://supabase.garuda-21.com/auth/v1/callback"
```

**⚠️ Catatan**: 
- Jika setelah konfigurasi ini, Supabase masih mengirim `redirect_uri` ke `academy.garuda-21.com/auth/v1/callback`, maka tambahkan URI tersebut juga ke Google Cloud Console
- Pastikan `API_EXTERNAL_URL` mengarah ke domain Supabase backend (`supabase.garuda-21.com`)
- `GOTRUE_SITE_URL` adalah domain frontend (`academy.garuda-21.com`)

### 3. Application

Pastikan environment variable `.env.local` atau production environment:
```env
NEXT_PUBLIC_SUPABASE_URL=https://supabase.garuda-21.com
```

File `lib/auth.ts` tidak perlu diubah karena sudah menggunakan `window.location.origin` yang akan otomatis menyesuaikan.

---

## 📞 Support

Jika masih ada masalah:

1. Cek logs: `docker-compose logs api`
2. Cek logs aplikasi di browser console
3. Pastikan semua environment variables sudah benar
4. Pastikan Google OAuth credentials valid dan tidak expired

---

**Versi**: 1.0.0
**Last Updated**: 2024
**Maintained by**: Garuda Academy Development Team
