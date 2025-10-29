# Cara Test Email Sending

Dokumentasi ini menjelaskan cara test pengiriman email dengan mock data yang sama persis dengan email yang akan diterima user.

## Prerequisites

Pastikan Anda sudah:
1. ✅ Setup Gmail SMTP credentials di `.env.local` (lihat `GMAIL_SMTP_SETUP.md`)
2. ✅ Server development sedang running (`npm run dev`)

## Cara Test Email

### Method 1: Menggunakan Browser (GET Request)

Buka browser dan akses:
```
http://localhost:3000/api/email/test
```

Atau untuk email custom:
```
http://localhost:3000/api/email/test?to=your-email@gmail.com
```

**Default:** Akan mengirim ke `yucheyahya@gmail.com`

### Method 2: Menggunakan cURL (POST Request)

```bash
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "yucheyahya@gmail.com"
  }'
```

### Method 3: Menggunakan Postman/Insomnia

1. **Method:** POST
2. **URL:** `http://localhost:3000/api/email/test`
3. **Headers:**
   ```
   Content-Type: application/json
   ```
4. **Body (JSON):**
   ```json
   {
     "to": "yucheyahya@gmail.com"
   }
   ```

### Method 4: Menggunakan Browser Developer Console

Jalankan di browser console (F12):

```javascript
fetch('http://localhost:3000/api/email/test', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: 'yucheyahya@gmail.com'
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error('Error:', err))
```

## Mock Data yang Digunakan

Test email menggunakan mock data berikut (sama persis dengan struktur data user):

```javascript
{
  participantName: 'Yuche Yahya',
  programTitle: 'Program Pelatihan AI Generatif untuk Pendidik',
  programDescription: 'Program pelatihan komprehensif yang dirancang untuk membekali pendidik...',
  userReferralCode: 'ABC123XY',
  referralLink: 'http://localhost:3000/referral/ABC123XY',
  dashboardUrl: 'http://localhost:3000/dashboard',
  openMaterials: [
    'Fondasi AI Generatif dan Prompting Efektif',
    'Dari Ide Menjadi Materi Ajar di Gemini Canvas',
  ],
  lockedMaterials: [
    'Integrasi Lanjutan, Etika dan Pemberdayaan Siswa',
    'Sertifikasi Internasional Gemini Certified Educator',
    'Diseminasi Pengimbasan Program'
  ],
  hasReferralUsed: false
}
```

## Response yang Diharapkan

### Success Response
```json
{
  "success": true,
  "message": "Test email sent successfully",
  "to": "yucheyahya@gmail.com",
  "subject": "Selamat Bergabung - Program Pelatihan AI Generatif untuk Pendidik | GARUDA-21 Training Center",
  "emailPreview": {
    "participantName": "Yuche Yahya",
    "programTitle": "Program Pelatihan AI Generatif untuk Pendidik",
    "referralCode": "ABC123XY"
  },
  "details": {
    "success": true,
    "message": "Email sent successfully"
  }
}
```

### Error Response
```json
{
  "error": "Failed to send email",
  "details": {
    "error": "SMTP connection failed. Please check Gmail SMTP configuration."
  }
}
```

## Troubleshooting

### Email tidak terkirim
1. **Check Gmail SMTP credentials:**
   - Pastikan `GMAIL_SMTP_USER` dan `GMAIL_SMTP_PASS` sudah benar di `.env.local`
   - Pastikan menggunakan App Password, bukan password Gmail biasa
   - Restart dev server setelah mengubah `.env.local`

2. **Check console logs:**
   - Lihat terminal/server logs untuk error details
   - Check browser console jika menggunakan browser console

3. **Check email folder:**
   - Cek inbox email `yucheyahya@gmail.com`
   - Jangan lupa cek folder spam/junk

### Error "SMTP connection failed"
- Pastikan internet connection stabil
- Pastikan Gmail SMTP credentials benar
- Pastikan 2-Step Verification sudah aktif dan App Password sudah dibuat

### Email terkirim tapi tidak muncul
- Tunggu beberapa detik (Gmail bisa delay)
- Cek folder spam/junk
- Pastikan email address benar

## Notes

- Test endpoint menggunakan `useQueue: false` untuk direct sending (lebih cepat untuk test)
- Email akan menggunakan template yang sama persis dengan email production
- Mock data bisa diubah di `app/api/email/test/route.ts` jika perlu

