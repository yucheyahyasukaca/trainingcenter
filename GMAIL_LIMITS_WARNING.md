# ⚠️ Peringatan: Batasan Gmail SMTP untuk Volume Besar

## Batasan Gmail SMTP

### Gmail Akun Gratis
- **Daily Limit**: 500 email per hari
- **Rate Limit**: ~100 email per jam
- **Risiko**: Akun bisa di-suspend atau di-ban jika melebihi batas

### Untuk 1000 Email
**TIDAK AMAN** mengirim 1000 email dalam 1 hari menggunakan Gmail akun gratis karena:
1. Melebihi daily limit (500/hari)
2. Berisiko akun di-suspend
3. Email akan gagal terkirim setelah limit tercapai

## Solusi yang Direkomendasikan

### 1. **Split ke Beberapa Hari** (Gratis)
- Hari 1: Kirim 450 email
- Hari 2: Kirim 450 email
- Hari 3: Kirim 100 email
- **Total**: 1000 email dalam 3 hari

### 2. **Google Workspace** (Berbayar)
- Daily limit: 2000 email per hari
- Rate limit: Lebih tinggi
- Lebih aman untuk volume besar
- Harga: ~$6/user/bulan

### 3. **Email Service Provider** (Direkomendasikan untuk Volume Besar)
- **SendGrid**: 100 email/hari gratis, $19.95/bulan untuk 50,000 email
- **Mailgun**: 5,000 email/bulan gratis, $35/bulan untuk 50,000 email
- **Amazon SES**: $0.10 per 1,000 email
- **Postmark**: $15/bulan untuk 10,000 email

## Implementasi Saat Ini

Sistem sudah dilengkapi dengan:
- ✅ Rate limiting (20 email per batch)
- ✅ Delay antara email (2 detik)
- ✅ Delay antara batch (60 detik)
- ✅ Daily limit tracking (450 email per hari - safe limit)
- ✅ Queue system untuk retry

## Rekomendasi untuk 1000 Email

### Opsi 1: Split Manual (Gratis)
1. Kirim 450 email hari ini
2. Tunggu hingga besok (reset daily limit)
3. Kirim 450 email lagi
4. Tunggu hingga lusa
5. Kirim 100 email terakhir

### Opsi 2: Upgrade ke Google Workspace
1. Daftar Google Workspace
2. Update SMTP credentials
3. Bisa kirim 2000 email/hari dengan aman

### Opsi 3: Gunakan Email Service Provider
1. Daftar SendGrid/Mailgun
2. Update SMTP configuration
3. Bisa kirim puluhan ribu email dengan aman

## Cara Update SMTP Configuration

Jika ingin menggunakan email service provider:

```env
# SendGrid Example
GMAIL_SMTP_HOST=smtp.sendgrid.net
GMAIL_SMTP_PORT=587
GMAIL_SMTP_USER=apikey
GMAIL_SMTP_PASS=your_sendgrid_api_key

# Mailgun Example
GMAIL_SMTP_HOST=smtp.mailgun.org
GMAIL_SMTP_PORT=587
GMAIL_SMTP_USER=your_mailgun_username
GMAIL_SMTP_PASS=your_mailgun_password
```

## Monitoring

Sistem akan otomatis:
- Track daily email count
- Pause queue jika limit tercapai
- Log warning jika mendekati limit
- Re-queue email yang gagal

## Catatan Penting

⚠️ **Jangan mengirim 1000 email sekaligus dengan Gmail gratis** - akun Anda bisa di-ban!

✅ **Gunakan split manual atau upgrade ke service yang lebih baik**

