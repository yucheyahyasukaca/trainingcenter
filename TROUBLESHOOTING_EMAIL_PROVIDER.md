# Troubleshooting Email Provider

## Masalah: Email masih terkirim via Gmail meskipun sudah set EMAIL_PROVIDER=ses

### Penyebab

1. **Transporter di-cache**: Transporter dibuat sekali dan di-cache, jadi meskipun environment variables berubah, transporter tetap menggunakan konfigurasi lama.

2. **Environment variables tidak ter-load**: Next.js perlu restart untuk memuat environment variables baru.

3. **Provider detection tidak bekerja**: Logika deteksi provider mungkin tidak berjalan dengan benar.

### Solusi

#### 1. Restart Server

**PENTING**: Setelah mengubah environment variables, **restart server** agar perubahan ter-load:

```bash
# Stop server (Ctrl+C)
# Start server lagi
npm run dev
# atau
npm run build && npm start
```

#### 2. Cek Environment Variables

Pastikan environment variables sudah ter-set dengan benar:

```bash
# Cek di terminal
echo $EMAIL_PROVIDER
echo $AWS_SES_SMTP_HOST
echo $AWS_SES_SMTP_USER
```

Atau buat endpoint test untuk cek:

```bash
curl http://localhost:3000/api/email/send
```

Response akan menunjukkan:
- `currentProvider`: Provider yang sedang digunakan
- `configuredProvider`: Provider yang seharusnya digunakan
- `sesConfigured`: Apakah SES credentials sudah di-set
- `gmailConfigured`: Apakah Gmail credentials sudah di-set

#### 3. Cek Logs

Setelah restart, cek console logs saat mengirim email. Anda akan melihat:

```
📧 Initializing email transporter for provider: SES
✅ Amazon SES Configuration:
   Host: email-smtp.ap-southeast-1.amazonaws.com
   Port: 587
   User: AKIAYLRHX...
   From: noreply@yacademy.garuda-21.com
```

Jika masih muncul "Gmail SMTP Configuration", berarti provider detection tidak bekerja.

#### 4. Force Reset Transporter

Jika transporter sudah di-cache dengan Gmail, sistem akan otomatis reset ketika:
- Provider berubah (dari gmail ke ses atau sebaliknya)
- Server restart

Untuk force reset manual, restart server.

#### 5. Verifikasi Konfigurasi

Pastikan file `.env.local` atau `.env` berisi:

```env
EMAIL_PROVIDER=ses
AWS_SES_REGION=ap-southeast-1
AWS_SES_SMTP_HOST=email-smtp.ap-southeast-1.amazonaws.com
AWS_SES_SMTP_PORT=587
AWS_SES_SMTP_USER=AKIAYLRHXRNDNKTMIX5M
AWS_SES_SMTP_PASS=your-password-here
AWS_SES_FROM_EMAIL=noreply@yacademy.garuda-21.com
EMAIL_SENDER_NAME=GARUDA-21 Training Center
AWS_SES_PRODUCTION=false
```

**Catatan**: 
- Jangan ada spasi di sekitar `=`
- Jangan gunakan quotes kecuali value mengandung spasi
- Pastikan tidak ada typo di nama variable

#### 6. Test Provider Detection

Buat test endpoint atau cek langsung di code:

```typescript
// Di browser console atau API route
const useAmazonSES = process.env.EMAIL_PROVIDER === 'ses' || process.env.AWS_SES_SMTP_HOST
console.log('EMAIL_PROVIDER:', process.env.EMAIL_PROVIDER)
console.log('AWS_SES_SMTP_HOST:', process.env.AWS_SES_SMTP_HOST)
console.log('useAmazonSES:', useAmazonSES)
```

#### 7. Clear Cache (Jika Deploy di Production)

Jika deploy di Vercel/Netlify:
1. Redeploy aplikasi
2. Atau clear build cache
3. Pastikan environment variables sudah di-set di dashboard hosting

### Checklist

- [ ] Environment variables sudah di-set dengan benar
- [ ] Server sudah di-restart setelah mengubah env vars
- [ ] Logs menunjukkan "Initializing email transporter for provider: SES"
- [ ] Email FROM address menggunakan `AWS_SES_FROM_EMAIL`
- [ ] SMTP credentials valid (tidak expired)
- [ ] Domain/email sudah terverifikasi di Amazon SES

### Debug Steps

1. **Cek current provider**:
   ```bash
   curl http://localhost:3000/api/email/send
   ```

2. **Cek logs saat send email**:
   - Buka console/terminal
   - Kirim email test
   - Lihat log output

3. **Test SMTP connection**:
   - Cek apakah SMTP credentials valid
   - Test di Amazon SES Console

4. **Verify email/domain**:
   - Pastikan `AWS_SES_FROM_EMAIL` sudah terverifikasi
   - Cek di SES Console → Verified identities

### Common Issues

#### Issue: "Email address is not verified"

**Penyebab**: `AWS_SES_FROM_EMAIL` belum terverifikasi di SES.

**Solusi**: Verifikasi email/domain di Amazon SES Console.

#### Issue: "SMTP authentication failed"

**Penyebab**: SMTP credentials salah atau expired.

**Solusi**: 
- Double check `AWS_SES_SMTP_USER` dan `AWS_SES_SMTP_PASS`
- Buat ulang SMTP credentials di SES Console

#### Issue: "Provider masih Gmail"

**Penyebab**: Transporter di-cache atau env vars tidak ter-load.

**Solusi**: 
- Restart server
- Cek env vars dengan GET `/api/email/send`
- Pastikan `EMAIL_PROVIDER=ses` sudah di-set

---

**Kesimpulan**: Setelah mengubah environment variables, **selalu restart server** agar perubahan ter-apply. Sistem akan otomatis detect provider dan reset transporter jika diperlukan.

