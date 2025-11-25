# Setup Amazon SES untuk Email System

Dokumentasi ini menjelaskan cara setup Amazon Simple Email Service (SES) untuk sistem pengiriman email di GARUDA-21 Training Center.

## 🎯 Keuntungan Amazon SES

- **Scalable**: Dapat mengirim ribuan email per hari
- **Reliable**: Infrastructure AWS yang handal
- **Cost-effective**: Harga lebih murah dari Gmail Workspace untuk volume besar
- **Better tracking**: Support webhook untuk delivery tracking
- **Production ready**: Cocok untuk production environment

## 📋 Langkah-langkah Setup

### 1. Setup Amazon SES Account

1. Login ke [AWS Console](https://console.aws.amazon.com/)
2. Buka **Amazon SES** service
3. Pilih **region** yang ingin digunakan (contoh: `us-east-1`, `ap-southeast-1`)

### 2. Verifikasi Domain atau Email Address

#### Opsi A: Verifikasi Domain (Recommended untuk Production)

1. Di SES Console, pilih **Verified identities** → **Create identity**
2. Pilih **Domain**
3. Masukkan domain Anda (contoh: `garuda-21.com`)
4. Ikuti instruksi untuk menambahkan DNS records:
   - **DKIM records** (untuk email authentication)
   - **SPF record** (untuk sender verification)
   - **MX record** (opsional, jika ingin menerima email)
5. Tunggu verifikasi selesai (biasanya beberapa menit)

#### Opsi B: Verifikasi Email Address (Untuk Testing)

1. Di SES Console, pilih **Verified identities** → **Create identity**
2. Pilih **Email address**
3. Masukkan email yang ingin diverifikasi
4. Buka email verifikasi dari AWS
5. Klik link verifikasi

### 3. Request Production Access (Penting!)

**Default**: Amazon SES berada di **Sandbox mode** yang hanya bisa mengirim ke email yang sudah diverifikasi.

Untuk mengirim ke email manapun, Anda perlu:

1. Di SES Console, pilih **Account dashboard**
2. Klik **Request production access**
3. Isi form:
   - **Mail Type**: Transactional atau Marketing
   - **Website URL**: URL website Anda
   - **Use case description**: Jelaskan penggunaan email Anda
   - **Compliance**: Centang semua compliance yang relevan
4. Submit request
5. Tunggu approval (biasanya 24-48 jam)

**Sandbox Limits:**
- 200 emails per 24 jam
- 1 email per detik
- Hanya bisa kirim ke verified email addresses

**Production Limits:**
- 50,000 emails per 24 jam (default, bisa dinaikkan)
- 14 emails per detik (default, bisa dinaikkan)
- Bisa kirim ke email manapun

### 4. Buat SMTP Credentials

1. Di SES Console, pilih **SMTP settings** di sidebar kiri
2. Klik **Create SMTP credentials**
3. Masukkan **IAM User Name** (contoh: `ses-smtp-user`)
4. Klik **Create**
5. **Download credentials** atau copy:
   - **SMTP Username** (contoh: `AKIAIOSFODNN7EXAMPLE`)
   - **SMTP Password** (contoh: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)

⚠️ **PENTING**: Simpan credentials dengan aman! Password hanya muncul sekali.

### 5. Tentukan SMTP Endpoint

Amazon SES memiliki SMTP endpoint berbeda untuk setiap region:

| Region | SMTP Endpoint |
|--------|---------------|
| US East (N. Virginia) | `email-smtp.us-east-1.amazonaws.com` |
| US West (Oregon) | `email-smtp.us-west-2.amazonaws.com` |
| EU (Ireland) | `email-smtp.eu-west-1.amazonaws.com` |
| Asia Pacific (Singapore) | `email-smtp.ap-southeast-1.amazonaws.com` |
| Asia Pacific (Tokyo) | `email-smtp.ap-northeast-1.amazonaws.com` |

Pilih region yang terdekat dengan server Anda untuk latency terbaik.

### 6. Setup Environment Variables

Tambahkan environment variables berikut ke file `.env.local`:

```env
# Email Provider (ses atau gmail)
EMAIL_PROVIDER=ses

# Amazon SES SMTP Configuration
AWS_SES_REGION=us-east-1
AWS_SES_SMTP_HOST=email-smtp.us-east-1.amazonaws.com
AWS_SES_SMTP_PORT=587
AWS_SES_SMTP_USER=AKIAIOSFODNN7EXAMPLE
AWS_SES_SMTP_PASS=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Sender Information
AWS_SES_FROM_EMAIL=noreply@garuda-21.com
EMAIL_SENDER_NAME=GARUDA-21 Training Center

# Production Mode (set true jika sudah dapat production access)
AWS_SES_PRODUCTION=true

# Optional: Custom Limits (jika sudah request increase)
AWS_SES_DAILY_LIMIT=50000
AWS_SES_HOURLY_LIMIT=2000
```

**Contoh untuk Production:**

```env
EMAIL_PROVIDER=ses
AWS_SES_REGION=ap-southeast-1
AWS_SES_SMTP_HOST=email-smtp.ap-southeast-1.amazonaws.com
AWS_SES_SMTP_PORT=587
AWS_SES_SMTP_USER=AKIAIOSFODNN7EXAMPLE
AWS_SES_SMTP_PASS=your-smtp-password-here
AWS_SES_FROM_EMAIL=noreply@garuda-21.com
EMAIL_SENDER_NAME=GARUDA-21 Training Center
AWS_SES_PRODUCTION=true
```

**Contoh untuk Sandbox (Testing):**

```env
EMAIL_PROVIDER=ses
AWS_SES_REGION=us-east-1
AWS_SES_SMTP_HOST=email-smtp.us-east-1.amazonaws.com
AWS_SES_SMTP_PORT=587
AWS_SES_SMTP_USER=AKIAIOSFODNN7EXAMPLE
AWS_SES_SMTP_PASS=your-smtp-password-here
AWS_SES_FROM_EMAIL=verified-email@garuda-21.com
EMAIL_SENDER_NAME=GARUDA-21 Training Center
AWS_SES_PRODUCTION=false
```

### 7. Port Configuration

Amazon SES mendukung beberapa port:

- **Port 25**: Standard SMTP (tidak direkomendasikan, sering diblokir)
- **Port 465**: SSL/TLS (secure)
- **Port 587**: STARTTLS (recommended, default)

Gunakan port **587** untuk kompatibilitas terbaik.

## 🔧 Konfigurasi Rate Limiting

Sistem secara otomatis menyesuaikan rate limiting berdasarkan:

- **Sandbox Mode**: 
  - 200 emails/day
  - 1 email/second
  - Batch size: 10
  - Delay: 1 second per email

- **Production Mode**:
  - 50,000 emails/day (default, bisa dinaikkan)
  - 14 emails/second (default, bisa dinaikkan)
  - Batch size: 50
  - Delay: 100ms per email

## 📊 Monitoring & Tracking

### CloudWatch Metrics

Amazon SES menyediakan metrics di CloudWatch:
- **Send**: Jumlah email yang dikirim
- **Delivery**: Jumlah email yang terkirim
- **Bounce**: Jumlah email yang bounced
- **Complaint**: Jumlah spam complaints
- **Reject**: Jumlah email yang ditolak

### Webhook untuk Delivery Tracking (Advanced)

Untuk tracking yang lebih detail (delivered, opened, clicked), setup:
1. **SNS Topic** untuk menerima events
2. **SQS Queue** untuk reliable delivery
3. **Webhook endpoint** untuk menerima notifications

Ini memungkinkan update status `delivered` di database.

## ⚠️ Troubleshooting

### Error: "Email address not verified"

**Penyebab**: Mencoba mengirim ke email yang belum diverifikasi di sandbox mode.

**Solusi**: 
- Verifikasi email tersebut di SES Console, atau
- Request production access

### Error: "Daily sending quota exceeded"

**Penyebab**: Sudah mencapai daily limit.

**Solusi**:
- Tunggu sampai reset (24 jam), atau
- Request increase limit di SES Console

### Error: "Message rejected: Email address is not verified"

**Penyebab**: `AWS_SES_FROM_EMAIL` tidak terverifikasi.

**Solusi**: Pastikan email/domain di `AWS_SES_FROM_EMAIL` sudah terverifikasi di SES Console.

### Error: "SMTP authentication failed"

**Penyebab**: SMTP credentials salah.

**Solusi**: 
- Double check `AWS_SES_SMTP_USER` dan `AWS_SES_SMTP_PASS`
- Pastikan menggunakan SMTP credentials (bukan IAM credentials)

## 💰 Pricing

Amazon SES pricing (per 1,000 emails):
- **First 62,000 emails/month**: FREE (jika dari EC2)
- **After that**: $0.10 per 1,000 emails

Sangat cost-effective untuk volume besar!

## 🔄 Migration dari Gmail

Untuk migrasi dari Gmail ke Amazon SES:

1. Setup Amazon SES (ikuti langkah di atas)
2. Update environment variables
3. Set `EMAIL_PROVIDER=ses`
4. Test dengan beberapa email
5. Monitor di CloudWatch
6. Jika semua OK, deploy ke production

## 📚 Resources

- [Amazon SES Documentation](https://docs.aws.amazon.com/ses/)
- [SES SMTP Settings](https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html)
- [SES Best Practices](https://docs.aws.amazon.com/ses/latest/dg/best-practices.html)
- [Request Production Access](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html)

---

**Kesimpulan**: Amazon SES adalah pilihan yang sangat baik untuk production email system dengan volume besar. Setup relatif mudah dan cost-effective.

