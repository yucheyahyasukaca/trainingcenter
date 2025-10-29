# Setup Gmail SMTP untuk Email System

Dokumentasi ini menjelaskan cara setup Gmail SMTP untuk sistem pengiriman email di GARUDA-21 Training Center.

## Langkah-langkah Setup

### 1. Buat App Password di Gmail

1. Buka [Google Account Settings](https://myaccount.google.com/)
2. Pilih **Security** di sidebar kiri
3. Aktifkan **2-Step Verification** jika belum aktif (wajib untuk App Password)
4. Setelah 2-Step Verification aktif, kembali ke Security
5. Scroll ke bawah dan klik **App passwords**
6. Pilih **Mail** sebagai app dan **Other** sebagai device
7. Ketik "GARUDA-21 Training Center" sebagai nama
8. Klik **Generate**
9. **Copy password yang dihasilkan** (16 karakter) - ini hanya muncul sekali!

### 2. Setup Environment Variables

Tambahkan environment variables berikut ke file `.env.local`:

```env
# Gmail SMTP Configuration
GMAIL_SMTP_HOST=smtp.gmail.com
GMAIL_SMTP_PORT=587
GMAIL_SMTP_USER=your-email@gmail.com
GMAIL_SMTP_PASS=your-16-character-app-password
GMAIL_SENDER_NAME=GARUDA-21 Training Center
```

**Contoh:**
```env
GMAIL_SMTP_USER=noreply@garuda-21.com
GMAIL_SMTP_PASS=abcd efgh ijkl mnop
```

**Catatan Penting:**
- Gunakan email Gmail yang akan digunakan untuk mengirim email
- `GMAIL_SMTP_PASS` adalah App Password (16 karakter, tanpa spasi atau dengan spasi)
- Jangan gunakan password Gmail biasa!

### 3. Rate Limits Gmail

Gmail memiliki batasan pengiriman email:
- **Per user (free):** 500 emails per hari
- **Per user (Workspace):** 2,000 emails per hari
- **Per session:** ~100 emails per session

Sistem ini telah dilengkapi dengan:
- **Queue system** untuk menangani ribuan email
- **Batch processing** dengan delay untuk menghindari rate limit
- **Automatic retry** jika terjadi rate limit error

### 4. Testing Email System

Test pengiriman email dengan:

```bash
# Test email sending
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Test</h1>",
    "useQueue": false
  }'

# Check queue status
curl http://localhost:3000/api/email/send
```

### 5. Production Setup

Untuk production dengan volume tinggi (ribuan email):

1. **Gunakan Google Workspace** (lebih tinggi rate limit)
2. **Multiple Gmail accounts** dengan load balancing
3. **Database queue** untuk persistent queue (bukan in-memory)
4. **Background job processor** (contoh: BullMQ dengan Redis)

Insight untuk scale ke ribuan email:
- Sistem saat ini menggunakan in-memory queue yang cocok untuk ratusan email
- Untuk ribuan email, pertimbangkan:
  - Redis + BullMQ untuk persistent queue
  - Multiple SMTP accounts dengan round-robin
  - Dedicated email service (SendGrid, Mailgun) untuk volume sangat tinggi

### 6. Troubleshooting

**Error: "Invalid login"**
- Pastikan App Password sudah benar (16 karakter)
- Pastikan 2-Step Verification sudah aktif
- Coba generate App Password baru

**Error: "Rate limit exceeded"**
- Sistem akan otomatis meng-queue email
- Check queue status: `GET /api/email/send`
- Tunggu beberapa saat untuk queue diproses

**Email tidak terkirim:**
- Check console logs untuk error details
- Pastikan SMTP credentials benar
- Pastikan firewall tidak memblokir port 587

### 7. Security Best Practices

1. **Jangan commit `.env.local`** ke git
2. **Gunakan App Password**, jangan password Gmail
3. **Rotate App Password** secara berkala
4. **Monitor email usage** untuk deteksi abuse
5. **Enable email signing** (SPF, DKIM, DMARC) jika menggunakan domain custom

## Cara Kerja Sistem

1. **Email ditambahkan ke queue** saat enrollment berhasil
2. **Queue processor** mengirim email dalam batch (50 per batch)
3. **Delay antara batch** (5 detik) untuk menghindari rate limit
4. **Concurrency limit** (10 email bersamaan) untuk stabilitas
5. **Automatic retry** jika terjadi error

Sistem ini dirancang untuk dapat mengirim **ratusan hingga ribuan email** secara efisien dengan menggunakan queue system dan batch processing.

