# 📧 Panduan Tracking Email - Cara Mengetahui Email Benar-Benar Terkirim

## 🎯 Cara Mengetahui Email Terkirim atau Tidak

Sistem sekarang memiliki **tracking individual per email** yang memungkinkan Anda melihat status pengiriman untuk setiap penerima.

### 📊 Status Email

1. **"pending"** - Email belum diproses
2. **"queued"** - Email sudah ditambahkan ke queue, menunggu dikirim
3. **"sent"** - Email berhasil dikirim ke SMTP server (Gmail)
4. **"delivered"** - Email berhasil sampai ke inbox penerima (jika menggunakan email service provider dengan webhook)
5. **"failed"** - Email gagal dikirim (ada error)
6. **"bounced"** - Email terkirim tapi di-reject oleh server penerima

### 🔍 Cara Mengecek Status Email

#### 1. Melalui Dashboard Email Broadcast

1. Buka halaman **Email Broadcast** (`/admin/email-broadcast`)
2. Klik pada salah satu riwayat email
3. Modal akan menampilkan:
   - **Jumlah penerima**
   - **Status keseluruhan** (queued/sent/failed)
   - **Detail per recipient** (jika sudah diimplementasikan di UI)

#### 2. Melalui Database (untuk Admin Teknis)

Query untuk melihat status per recipient:

```sql
SELECT 
    er.recipient_email,
    er.recipient_name,
    er.status,
    er.message_id,
    er.sent_at,
    er.error_message,
    el.sent_at as broadcast_sent_at
FROM email_recipients er
JOIN email_logs el ON el.id = er.email_log_id
WHERE el.id = 'YOUR_EMAIL_LOG_ID'
ORDER BY er.status, er.recipient_email;
```

### ⚠️ Penting: Status "sent" vs "delivered"

**Status "sent"** berarti:
- ✅ Email berhasil dikirim ke SMTP server (Gmail)
- ✅ Gmail menerima email tersebut
- ⚠️ **Belum tentu sampai ke inbox** penerima (bisa masuk spam, atau di-reject oleh server penerima)

**Status "delivered"** (jika tersedia):
- ✅ Email benar-benar sampai ke inbox penerima
- ⚠️ Hanya tersedia jika menggunakan email service provider dengan webhook (seperti SendGrid, Mailgun, dll)

### 🔧 Cara Meningkatkan Tracking

Untuk mendapatkan tracking yang lebih akurat (termasuk "delivered" dan "bounced"):

1. **Gunakan Email Service Provider** seperti:
   - SendGrid
   - Mailgun
   - Amazon SES
   - Postmark

2. **Setup Webhook** untuk menerima event:
   - `delivered` - Email sampai ke inbox
   - `bounced` - Email di-reject
   - `opened` - Email dibuka
   - `clicked` - Link di email diklik

### 📈 Statistik yang Tersedia

Setiap email broadcast memiliki:
- **Total recipients** - Jumlah penerima
- **Status summary** - Breakdown per status:
  - Pending
  - Queued
  - Sent
  - Delivered (jika tersedia)
  - Failed
  - Bounced (jika tersedia)

### 🐛 Troubleshooting

#### Email status tetap "queued"
- Cek apakah queue sedang diproses
- Cek log server untuk error
- Cek Gmail daily limit (500 email/hari untuk free account)

#### Email status "failed"
- Cek `error_message` di database
- Cek SMTP credentials
- Cek Gmail rate limit

#### Email "sent" tapi tidak sampai
- Cek spam folder penerima
- Cek email domain reputation
- Pertimbangkan menggunakan email service provider

---

**Kesimpulan**: Status "sent" berarti email sudah dikirim ke SMTP server, tapi belum tentu sampai ke inbox. Untuk tracking yang lebih akurat, gunakan email service provider dengan webhook support.

