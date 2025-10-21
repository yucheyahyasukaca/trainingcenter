# ⚡ QUICK CLEAR CACHE - Fix Cache Bandel

## 🎯 **Problem:**
Cache bandel → Error "Email sudah terdaftar" terus muncul

---

## ⚡ **SOLUSI CEPAT (3 Menit):**

### **LANGKAH 1: Clear Browser Cache**

**Hard Refresh:**
- **Chrome/Edge:** `Ctrl + Shift + R`
- **Firefox:** `Ctrl + F5`

**Atau Clear All:**
- **Chrome:** `Ctrl + Shift + Delete` → "All time" → Clear data

---

### **LANGKAH 2: Clear Next.js Cache**

```bash
# Stop dev server (Ctrl + C)
rm -rf .next
npm run dev
```

**Windows:**
```cmd
rmdir /s .next
npm run dev
```

---

### **LANGKAH 3: Clear Local Storage**

**Via Console (F12):**
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

### **LANGKAH 4: Test Incognito Mode**

1. **Buka incognito/private mode**
2. **Buka:** http://localhost:3000/register/new
3. **Test registrasi** dengan email baru
4. **✅ Jika berhasil:** Masalah cache browser

---

## 🧪 **TEST:**

**Registrasi dengan email baru:**
- Email: `test123@gmail.com`
- Nama: Test User
- Password: password123

**✅ Seharusnya berhasil!**

---

**Cache bandel memang sering jadi masalah!** 🧹
