# 📧 Setup Email Confirmation - GARUDA-21 Training Center

## ⚡ Solusi 1: Disable Email Confirmation (RECOMMENDED untuk Development/Testing)

### Langkah-langkah di Supabase Dashboard:

1. **Login ke Supabase Dashboard**
   - Buka: https://app.supabase.com
   - Pilih project Anda

2. **Buka Authentication Settings**
   - Klik **Authentication** di sidebar kiri
   - Klik **Settings** atau **Providers**
   - Scroll ke bagian **"Auth Providers"**

3. **Disable Email Confirmation**
   - Cari setting **"Enable email confirmations"**
   - **TURN OFF** toggle ini
   - Klik **Save**

4. **Test Registrasi**
   - Coba registrasi user baru
   - User langsung bisa login tanpa konfirmasi email

### ✅ Keuntungan:
- ✅ Paling cepat dan mudah
- ✅ Tidak perlu setup SMTP
- ✅ Tidak ada batasan email
- ✅ Cocok untuk development dan testing
- ✅ User langsung bisa login

### ⚠️ Catatan:
- Untuk production, sebaiknya tetap pakai email confirmation untuk keamanan
- Jika mau production-ready, gunakan Solusi 2 atau 3

---

## 🚀 Solusi 2: Gunakan Resend (GRATIS 3,000 email/bulan)

Resend adalah provider email modern yang sangat mudah disetup dan **GRATIS** untuk 3,000 email/bulan.

### Step 1: Daftar Resend

1. Buka: https://resend.com
2. Klik **Sign Up** (gratis)
3. Verifikasi email Anda

### Step 2: Dapatkan API Key

1. Login ke Resend Dashboard
2. Klik **API Keys** di sidebar
3. Klik **Create API Key**
4. Copy API Key yang diberikan

### Step 3: Setup di Supabase

1. **Buka Supabase Dashboard**
2. Klik **Project Settings** (⚙️ icon)
3. Klik **Authentication**
4. Scroll ke **SMTP Settings**

5. **Isi Data Berikut:**
   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 465
   SMTP Username: resend
   SMTP Password: [Paste API Key dari Resend]
   Sender Email: onboarding@resend.dev
   Sender Name: GARUDA-21 Training Center
   ```

6. Klik **Save**

### Step 4: Enable Email Confirmation

1. Di Authentication Settings
2. **Enable email confirmations** → ON
3. Klik **Save**

### ✅ Keuntungan:
- ✅ GRATIS 3,000 email/bulan (lebih dari cukup!)
- ✅ Setup super mudah
- ✅ Reliable dan cepat
- ✅ Production-ready
- ✅ Dashboard analytics
- ✅ Support custom domain (optional)

---

## 📧 Solusi 3: Gunakan SendGrid (GRATIS 100 email/hari = 3,000/bulan)

### Step 1: Daftar SendGrid

1. Buka: https://sendgrid.com
2. Klik **Start for Free**
3. Isi form registrasi
4. Verifikasi email

### Step 2: Dapatkan API Key

1. Login ke SendGrid Dashboard
2. Klik **Settings** → **API Keys**
3. Klik **Create API Key**
4. Pilih **Full Access** atau **Restricted Access** (Mail Send saja)
5. Copy API Key

### Step 3: Setup di Supabase

1. Buka **Supabase Dashboard**
2. **Project Settings** → **Authentication**
3. Scroll ke **SMTP Settings**

4. **Isi Data:**
   ```
   SMTP Host: smtp.sendgrid.net
   SMTP Port: 587
   SMTP Username: apikey
   SMTP Password: [Paste API Key dari SendGrid]
   Sender Email: noreply@yourdomain.com
   Sender Name: GARUDA-21 Training Center
   ```

5. Klik **Save**

### ✅ Keuntungan:
- ✅ GRATIS 100 email/hari (3,000/bulan)
- ✅ Trusted provider (dipakai banyak perusahaan)
- ✅ Advanced analytics
- ✅ Template builder

---

## 🎯 Rekomendasi Saya

### Untuk Development/Testing:
→ **Gunakan Solusi 1** (Disable Email Confirmation)
- Paling cepat
- Tidak perlu setup
- Langsung bisa dipakai

### Untuk Production:
→ **Gunakan Solusi 2** (Resend)
- Gratis 3,000 email/bulan
- Paling mudah setup
- Modern dan reliable
- Email template cantik

---

## 📝 Cara Test Setelah Setup

1. Buka aplikasi: `http://localhost:3000/register/new`
2. Isi form registrasi
3. Klik **Buat akun baru**

### Jika Disable Email Confirmation (Solusi 1):
- ✅ Akun langsung aktif
- ✅ Bisa langsung login

### Jika Pakai Email Provider (Solusi 2/3):
- ✅ Akan dapat email konfirmasi
- ✅ Klik link di email
- ✅ Akun aktif, bisa login

---

## 🐛 Troubleshooting

### Error: "Error sending confirmation email"
→ Setup Solusi 1, 2, atau 3 di atas

### Email tidak masuk
1. Cek folder Spam/Junk
2. Pastikan SMTP settings benar
3. Cek quota email provider
4. Test dengan email lain (Gmail, Yahoo, dll)

### User tidak bisa login setelah registrasi
→ Pastikan email sudah dikonfirmasi atau disable email confirmation

---

## 💡 Tips Pro

1. **Development:** Disable email confirmation
2. **Staging:** Gunakan Resend dengan domain testing
3. **Production:** Gunakan Resend atau SendGrid dengan custom domain

**Custom Domain Example:**
- Beli domain: garuda21.com
- Setup di Resend: noreply@garuda21.com
- Lebih profesional! ✨

