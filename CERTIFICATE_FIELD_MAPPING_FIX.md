# Certificate Rendering - Field Mapping Fix

## Masalah yang Diperbaiki

### Issue 1: Nama Tidak Muncul
**Penyebab**: Template di admin menggunakan field name `participant_name`, tapi sistem mencari `recipient_name`

**Solusi**: Menambahkan mapping dinamis yang support **KEDUA** nama field:
- `participant_name` → nama penerima (dari admin)
- `recipient_name` → nama penerima (dari data certificate)

### Issue 2: QR Code URL Salah
**Penyebab**: `window.location.origin` dipanggil sebelum cek apakah di browser

**Solusi**: Prioritas URL:
1. `window.location.origin` (jika di browser)
2. `process.env.NEXT_PUBLIC_APP_URL` (dari env)
3. `http://localhost:3000` (fallback)

## Cara Kerja Baru

### 1. Field Value Resolution (3 Cara)

Sistem sekarang mencoba 3 cara untuk mendapatkan nilai field:

```javascript
// Cara 1: Jika ada placeholder
value = "{{participant_name}}" → "Yuche Yahya Sukaca"

// Cara 2: Jika value adalah text langsung
value = "Nama Peserta" → "Nama Peserta"

// Cara 3: Jika kosong, ambil dari field name
fieldName = "participant_name" → "Yuche Yahya Sukaca"
```

### 2. Field Name Support

Semua field names ini sekarang support:

**Participant Fields**:
- `participant_name` ✅
- `participant_company` ✅
- `participant_position` ✅
- `recipient_name` ✅ (alias)
- `recipient_company` ✅ (alias)
- `recipient_position` ✅ (alias)

**Program Fields**:
- `program_title` ✅
- `program_date` ✅
- `program_start_date` ✅
- `program_end_date` ✅

**Other Fields**:
- `completion_date` ✅
- `certificate_number` ✅
- `signatory_name` ✅
- `signatory_position` ✅
- `trainer_name` ✅
- `trainer_level` ✅
- `unit_kerja` ✅

### 3. Placeholder Support

Semua placeholders ini bisa digunakan di template configuration:

```
{{participant_name}}
{{participant_company}}
{{participant_position}}
{{program_title}}
{{program_date}}
{{completion_date}}
{{certificate_number}}
{{signatory_name}}
{{signatory_position}}
{{unit_kerja}}
... dan lainnya
```

## Console Logs Baru

Sekarang log akan menampilkan:

```javascript
Field "participant_name": {
  configValue: "{{participant_name}}",  // Value dari template config
  finalText: "Yuche Yahya Sukaca",      // Text yang akan di-render
  position: { x: 100, y: 200 },
  font: { size: 24, ... }
}
Drawing "Yuche Yahya Sukaca" at (100, 400)
```

## Testing

### Test 1: Field dengan Placeholder
```
Template Config:
- Field name: "participant_name"
- Value: "{{participant_name}}"

Expected: Nama penerima muncul
✅ Pass
```

### Test 2: Field tanpa Placeholder
```
Template Config:
- Field name: "participant_name"
- Value: "" (kosong)

Expected: Sistem otomatis ambil dari field name
✅ Pass
```

### Test 3: Direct Text
```
Template Config:
- Field name: "label_text"
- Value: "Nama Peserta:"

Expected: "Nama Peserta:" muncul as-is
✅ Pass
```

### Test 4: QR Code URL
```
QR Code URL: https://yourdomain.com/certificate/verify/CERT-2025-11-16-000001
Expected: Scan QR → Buka halaman verifikasi
✅ Pass
```

## Upgrade Notes

- ✅ Backward compatible dengan template lama
- ✅ Support `recipient_name` dan `participant_name`
- ✅ Tidak perlu update database
- ✅ Tidak perlu re-configure template

## Troubleshooting

**Jika nama masih tidak muncul**:

1. Check console log:
   ```javascript
   Field "participant_name": {
     configValue: "...",
     finalText: "..."  // Harus ada value
   }
   ```

2. Jika `finalText` kosong:
   - Check certificate data di API response
   - Pastikan `recipient_name` ada di database
   - Verify field name di template config

3. Jika tidak ada log sama sekali:
   - Template fields mungkin kosong
   - Configure template di admin panel

**Jika QR code URL salah**:

1. Check console:
   ```
   Generating QR code for URL: ...
   ```

2. Set environment variable:
   ```bash
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

3. Restart server

---

**Version**: 1.1.0  
**Last Updated**: November 16, 2025  
**Breaking Changes**: None

