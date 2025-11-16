# Certificate System - Debugging Guide

## Masalah yang Sering Terjadi

### 1. Nama Tidak Muncul di Sertifikat

#### Penyebab Umum:
- Template fields belum dikonfigurasi di admin
- Placeholder tidak sesuai dengan data
- Position field salah

#### Cara Debug:

1. **Buka Browser Console** (F12 atau Ctrl+Shift+I)

2. **Klik tombol "Lihat" pada sertifikat**

3. **Lihat Console Logs** untuk informasi berikut:

```
=== API: Certificate Render Request ===
Certificate Number: CERT-2025-11-16-000001
✅ Certificate found: {
  recipient: "Olivia Husli Basrin",
  template: "Gemini untuk Pendidik 2025",
  has_template_fields: true,
  template_fields_keys: ["recipient_name", "program_title", ...]
}

=== Starting PDF Rendering ===
Certificate Number: CERT-2025-11-16-000001
Recipient Name: Olivia Husli Basrin
Template Fields: { recipient_name: { value: "{{recipient_name}}", ... } }
Number of fields to render: 5

Field "recipient_name": {
  original: "{{recipient_name}}",
  replaced: "Olivia Husli Basrin",
  position: { x: 100, y: 200 }
}
Drawing "Olivia Husli Basrin" at (100, 400)
```

#### Solusi Berdasarkan Log:

**A. Jika `has_template_fields: false` atau `template_fields_keys: []`**

**Masalah**: Template fields belum dikonfigurasi di admin

**Solusi**:
1. Login sebagai admin
2. Pergi ke halaman Certificate Management
3. Pilih template untuk program
4. Klik "Configure Template"
5. Tambahkan fields untuk nama, program, dll
6. Set position, font, dan placeholder value
7. Save configuration

**B. Jika field muncul tapi `replaced: ""`**

**Masalah**: Placeholder tidak ter-replace

**Solusi**:
- Pastikan placeholder menggunakan format: `{{recipient_name}}`
- Cek field value di template configuration
- Pastikan data certificate lengkap

**Placeholder yang tersedia**:
- `{{recipient_name}}` - Nama penerima
- `{{recipient_company}}` - Instansi
- `{{recipient_position}}` - Jabatan
- `{{program_title}}` - Judul program
- `{{program_date}}` - Tanggal program
- `{{completion_date}}` - Tanggal selesai
- `{{certificate_number}}` - Nomor sertifikat
- `{{signatory_name}}` - Nama penandatangan
- `{{signatory_position}}` - Jabatan penandatangan

**C. Jika muncul "⚠️ No template fields found!"**

**Masalah**: Tidak ada template fields sama sekali

**Solusi**: System akan render nama di tengah sebagai fallback. Segera konfigurasikan template fields di admin panel.

**D. Jika position terlihat aneh**

**Masalah**: Position X,Y salah

**Solusi**: 
- Koordinat menggunakan sistem top-left origin
- Gunakan preview di configure template untuk adjust position
- Pastikan position dalam batas ukuran PDF

---

### 2. QR Code Tidak Menuju Halaman Verifikasi

#### Penyebab Umum:
- URL QR code salah
- Environment variable tidak di-set
- Domain production tidak sesuai

#### Cara Debug:

1. **Buka Browser Console**

2. **Lihat log QR Code generation**:

```
Generating QR code for URL: http://localhost:3000/certificate/verify/CERT-2025-11-16-000001
✅ QR code generated successfully
```

3. **Scan QR code dengan HP** dan lihat URL yang terdeteksi

#### Solusi:

**A. Jika URL QR Code = `http://localhost:3000/...`** (padahal production)

**Masalah**: Environment variable tidak di-set

**Solusi**:
1. Buat file `.env.local` di root project
2. Tambahkan:
   ```
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```
3. Restart development server: `npm run dev`
4. Untuk production, set di hosting provider (Vercel/Netlify)

**B. Jika URL benar tapi halaman 404**

**Masalah**: Route verification mungkin tidak ada

**Solusi**:
- Pastikan file `app/certificate/verify/[certificateNumber]/page.tsx` ada
- Cek routing di Next.js
- Clear cache dan rebuild: `npm run build`

**C. Test manual URL**

Buka browser dan akses langsung:
```
https://yourdomain.com/certificate/verify/CERT-2025-11-16-000001
```

Jika halaman muncul = QR code akan work
Jika 404 = ada masalah di routing

---

### 3. PDF Tidak Ter-render / Loading Forever

#### Cara Debug:

1. **Cek Console untuk error messages**

Cari error seperti:
```
❌ Error rendering certificate PDF: Failed to fetch template PDF
```

atau

```
Failed to load PDF document
```

#### Solusi:

**A. Error "Failed to fetch template PDF"**

**Masalah**: Template PDF URL tidak accessible

**Solusi**:
1. Cek Supabase Storage permissions
2. Pastikan bucket "certificates" atau "templates" public
3. Test URL template PDF langsung di browser
4. Update CORS settings di Supabase

**B. Error "Cannot read property of undefined"**

**Masalah**: Data certificate incomplete

**Solusi**:
- Cek console log untuk melihat data yang missing
- Pastikan certificate memiliki template_id yang valid
- Verify template exists di database

**C. Loading Forever**

**Masalah**: Network timeout atau PDF terlalu besar

**Solusi**:
- Compress template PDF (max 5MB recommended)
- Check network tab untuk stuck requests
- Clear browser cache

---

## Checklist Lengkap

### Pre-requisites:
- [ ] Template PDF sudah diupload
- [ ] Template fields sudah dikonfigurasi (posisi, font, placeholder)
- [ ] QR code position sudah di-set
- [ ] Certificate sudah di-issue (status = 'issued')
- [ ] Environment variable `NEXT_PUBLIC_APP_URL` sudah di-set

### Testing Steps:

1. **Test Data di Database**:
```sql
-- Check certificate exists
SELECT certificate_number, recipient_name, status 
FROM certificates 
WHERE certificate_number = 'CERT-2025-11-16-000001';

-- Check template configuration
SELECT 
  t.template_name, 
  t.template_fields,
  t.qr_code_size,
  t.qr_code_position_x,
  t.qr_code_position_y
FROM certificates c
JOIN certificate_templates t ON c.template_id = t.id
WHERE c.certificate_number = 'CERT-2025-11-16-000001';
```

2. **Test API Endpoint**:
```
Open: https://yourdomain.com/api/certificate/render/CERT-2025-11-16-000001
```

Should return JSON with certificate data including template_fields.

3. **Test Frontend**:
- Open certificates page
- Click "Lihat" button
- Check console logs
- Verify PDF renders
- Verify QR code appears
- Test QR code scan

4. **Test QR Code**:
- Scan with HP camera atau QR reader app
- Should open verification page
- Check status is "Valid"

---

## Console Log Reference

### Successful Flow:

```
=== API: Certificate Render Request ===
Certificate Number: CERT-2025-11-16-000001
✅ Certificate found
✅ Returning certificate data
=== API: Request Complete ===

=== Loading Certificate ===
Certificate Number: CERT-2025-11-16-000001
API Response Status: 200
Certificate Data: { recipient_name: "...", has_template_fields: true }

Generating QR code for URL: https://yourdomain.com/certificate/verify/CERT-2025-11-16-000001
QR code generated successfully

=== Starting PDF Rendering ===
Number of fields to render: 5
Field "recipient_name": { replaced: "Olivia Husli Basrin" }
Drawing "Olivia Husli Basrin" at (x, y)
... (more fields)
✅ All fields rendered
QR Code position: { qrX: 50, qrY: 100, qrSize: 150 }
✅ QR code rendered
✅ PDF rendered successfully, size: 234567 bytes
=== PDF Rendering Complete ===

PDF rendered successfully
=== Certificate Loaded Successfully ===
```

### Common Errors:

**1. No template fields**:
```
⚠️ No template fields found! Certificate will render without dynamic data.
✅ Rendered fallback name at center
```
→ Configure template fields di admin

**2. Missing data**:
```
⚠️ Field "recipient_company" has no text, skipping
```
→ Normal jika data optional kosong

**3. API error**:
```
❌ Supabase error fetching certificate: {...}
```
→ Check database, certificate mungkin tidak exist

---

## Quick Fixes

### Fix 1: Reset Template Configuration
1. Login as admin
2. Go to Certificate Management
3. Edit template
4. Re-configure all fields
5. Save
6. Test certificate view

### Fix 2: Regenerate Certificate
1. Revoke existing certificate (optional)
2. Issue new certificate
3. Test view

### Fix 3: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
4. Try again

### Fix 4: Check Environment
```bash
# Development
echo $NEXT_PUBLIC_APP_URL
# Should show: http://localhost:3000

# Production
# Check in hosting dashboard (Vercel/Netlify)
```

---

## Getting Help

Jika masalah masih berlanjut setelah mengikuti guide ini:

1. **Copy semua console logs**
2. **Screenshot certificate configuration** di admin
3. **Export certificate data** dari database
4. **Kirim ke development team** dengan informasi:
   - Certificate number
   - Error message
   - Console logs
   - Screenshots

---

**Last Updated**: November 16, 2025
**Version**: 1.0.0

