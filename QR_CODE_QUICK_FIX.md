# QR Code Position - Quick Fix

## 🎯 Langkah Cepat Fix Posisi QR Code

### 1. Lihat Console Log

Klik "Lihat" sertifikat, buka Console (F12), cari:

```javascript
QR Code positioning calculation: {
  configPosition: { x: 250, y: 400 },  // ← Posisi saat ini di admin
  qrSize: 100,
  finalPosition: { x: 250, y: 342 }    // ← Posisi di PDF
}
```

### 2. Tentukan Arah Geser

**QR Code perlu geser ke mana?**

| Arah Geser di PDF | Action di Admin |
|------------------|-----------------|
| ⬆️ Naik 10px | Config Y **kurangi 10** (400 → 390) |
| ⬇️ Turun 10px | Config Y **tambah 10** (400 → 410) |
| ⬅️ Kiri 10px | Config X **kurangi 10** (250 → 240) |
| ➡️ Kanan 10px | Config X **tambah 10** (250 → 260) |

### 3. Update di Admin

1. Login sebagai admin
2. Pergi ke **Certificate Management**
3. Pilih template "Gemini untuk Pendidik 2025"
4. Klik **"Configure Template"**
5. Drag QR code atau edit position manual
6. **Save**

### 4. Test Lagi

1. Refresh page sertifikat (Ctrl+Shift+R)
2. Klik "Lihat"
3. Check posisi QR code

---

## 📐 Untuk QR Code di Tengah-Tengah Exact

### Horizontal Center:
```
Page width = 595px
QR size = 100px
Center X = (595 - 100) / 2 = 247.5 ≈ 248

Set position X = 248 di admin
```

### Vertical Center:
```
Page height = 842px
QR size = 100px
Center Y = (842 - 100) / 2 = 371

Set position Y = 371 di admin
```

### QR Code Center-Center:
```
Position X: 248
Position Y: 371
Size: 100
```

---

## 🔧 Adjustment Table

Gunakan tabel ini untuk cepat adjust:

| Geser | X Change | Y Change |
|-------|----------|----------|
| 5px kanan | +5 | - |
| 5px kiri | -5 | - |
| 5px naik (PDF) | - | -5 |
| 5px turun (PDF) | - | +5 |
| 10px kanan | +10 | - |
| 10px kiri | -10 | - |
| 10px naik (PDF) | - | -10 |
| 10px turun (PDF) | - | +10 |

---

## 💡 Quick Examples

### QR Code di Bawah Tengah (seperti gambar):
```
Position X: 248 (center)
Position Y: 680-720 (adjust sampai pas)
Size: 100
```

### QR Code di Pojok Kanan Bawah:
```
Position X: 445 (50px dari kanan)
Position Y: 692 (50px dari bawah di PDF)
Size: 100
```

---

## ⚡ Super Quick Fix

**Jika QR code geser sedikit ke kiri di PDF:**
- Tambah X sebesar 5-10px di admin

**Jika QR code geser sedikit ke atas di PDF:**
- Tambah Y sebesar 5-10px di admin

**Jika QR code geser sedikit ke kanan di PDF:**
- Kurangi X sebesar 5-10px di admin

**Jika QR code geser sedikit ke bawah di PDF:**
- Kurangi Y sebesar 5-10px di admin

---

## 📞 Need Exact Position?

Kirimkan:
1. Screenshot PDF dengan QR code saat ini
2. Dimana posisi yang diinginkan?
3. Console log positioning calculation

Saya akan kasih exact values untuk di-set di admin.

---

**Tips**: Mulai dengan adjustment kecil (5px), test, lalu adjust lagi jika perlu.

