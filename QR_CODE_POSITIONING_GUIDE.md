# QR Code Positioning Guide

## Understanding Coordinate Systems

### Admin Preview (Top-Left Origin)
```
(0,0) ────────────────► X
 │
 │    [QR Code]
 │
 ▼
 Y
```

### PDF System (Bottom-Left Origin)
```
 Y
 ▲
 │    [QR Code]
 │
 └────────────────► X
(0,0)
```

## Formula Conversion

```javascript
// Admin config position (top-left origin)
config_x = 250
config_y = 400
qr_size = 100

// Convert to PDF coordinates (bottom-left origin)
pdf_x = config_x                    // X stays the same
pdf_y = page_height - config_y - qr_size
```

## Fine-Tuning Position

### Step 1: Check Current Position

1. Klik "Lihat" pada sertifikat
2. Buka Console (F12)
3. Cari log:

```javascript
QR Code positioning calculation: {
  pageSize: { width: 595, height: 842 },
  configPosition: { x: 250, y: 400 },
  qrSize: 100,
  calculatedPdfY: "842 - 400 - 100 = 342",
  finalPosition: { x: 250, y: 342 }
}
```

### Step 2: Adjust Position

**Jika QR code terlalu ke ATAS** di hasil PDF:
- Di admin, **turunkan** position Y (tambah nilai Y)
- Contoh: Dari Y=400 ke Y=420

**Jika QR code terlalu ke BAWAH** di hasil PDF:
- Di admin, **naikkan** position Y (kurangi nilai Y)  
- Contoh: Dari Y=400 ke Y=380

**Jika QR code terlalu ke KANAN**:
- Di admin, **geser ke kiri** (kurangi nilai X)
- Contoh: Dari X=250 ke X=230

**Jika QR code terlalu ke KIRI**:
- Di admin, **geser ke kanan** (tambah nilai X)
- Contoh: Dari X=250 ke X=270

### Step 3: Test & Iterate

1. **Save** perubahan di admin
2. **Refresh** page sertifikat (Ctrl+Shift+R)
3. **Klik "Lihat"** lagi
4. **Check** posisi QR code
5. **Ulangi** jika masih perlu adjust

## Quick Adjustments

### Geser 5px ke kiri
```
Current X: 250
New X: 245 (kurangi 5)
```

### Geser 5px ke kanan
```
Current X: 250
New X: 255 (tambah 5)
```

### Geser 5px ke atas (di PDF)
```
Current Y: 400
New Y: 395 (kurangi 5) - ingat, Y di admin terbalik dari PDF
```

### Geser 5px ke bawah (di PDF)
```
Current Y: 400
New Y: 405 (tambah 5)
```

## Common Positions

### Center Horizontal
```javascript
// Formula untuk center horizontal:
qr_x = (page_width - qr_size) / 2

// Contoh dengan page width 595px, QR size 100px:
qr_x = (595 - 100) / 2 = 247.5 ≈ 248
```

### Center Vertical
```javascript
// Formula untuk center vertical (di admin config):
qr_y = (page_height - qr_size) / 2

// Contoh dengan page height 842px, QR size 100px:
qr_y = (842 - 100) / 2 = 371
```

### Bottom Right Corner
```javascript
// Formula:
qr_x = page_width - qr_size - margin
qr_y = page_height - margin  // margin from top in admin

// Contoh dengan margin 50px:
qr_x = 595 - 100 - 50 = 445
qr_y = 50  // 50px dari atas di admin
```

### Bottom Left Corner
```javascript
// Formula:
qr_x = margin
qr_y = page_height - margin  // margin from top in admin

// Contoh dengan margin 50px:
qr_x = 50
qr_y = 792  // 50px dari bawah = 842 - 50
```

## Troubleshooting

### Issue: QR Code terpotong di sisi kanan
**Penyebab**: X position terlalu besar
**Solusi**: 
```
Max X = page_width - qr_size
Max X = 595 - 100 = 495
```

### Issue: QR Code terpotong di atas
**Penyebab**: Y position terlalu kecil (di admin)
**Solusi**:
```
Min Y = 0 (di admin)
```

### Issue: QR Code terpotong di bawah
**Penyebab**: Y position terlalu besar (di admin)
**Solusi**:
```
Max Y = page_height - qr_size
Max Y = 842 - 100 = 742
```

### Issue: Position berbeda di preview vs PDF
**Penyebab**: Zoom level di preview berbeda
**Solusi**: 
- Gunakan zoom 100% di admin preview
- Focus pada posisi di PDF hasil render

## Example Configurations

### QR Code di Tengah Bawah
```
Position X: 248 (center horizontal)
Position Y: 700 (dekat bawah)
Size: 100
```

### QR Code di Pojok Kanan Bawah  
```
Position X: 445 (50px dari kanan)
Position Y: 700 (dekat bawah)
Size: 100
```

### QR Code di Samping Tanda Tangan
```
Position X: 400
Position Y: 650
Size: 80 (lebih kecil)
```

## Best Practices

1. **Ukuran QR Code**: 80-120px optimal untuk scanability
2. **Margin**: Minimal 30px dari tepi page
3. **Posisi**: Hindari overlap dengan text atau logo
4. **Test**: Selalu test scan QR code setelah posisi final
5. **Consistency**: Gunakan posisi yang sama untuk semua certificate

## Console Debug Commands

Jika ingin manual check koordinat:

```javascript
// Di browser console saat view certificate
console.log('Page dimensions:', { width: 595, height: 842 })
console.log('QR config:', { x: 250, y: 400, size: 100 })
console.log('QR PDF position:', { x: 250, y: 842 - 400 - 100 })
```

## Getting Help

Jika masih kesulitan positioning:

1. **Screenshot** PDF hasil render dengan ruler/measure tool
2. **Copy** console logs QR positioning
3. **Note** posisi yang diinginkan vs posisi saat ini
4. **Kirim** informasi ke development team

---

**Tips**: Gunakan small adjustments (5-10px) untuk fine-tuning positioning.

**Version**: 1.0.0  
**Last Updated**: November 16, 2025

