# 🧹 CLEAR ALL CACHE - Fix Cache Bandel

## 🎯 **Problem:**
Cache bandel yang menyebabkan error "Email sudah terdaftar" terus muncul

---

## ⚡ **SOLUSI LENGKAP (5 Menit):**

### **LANGKAH 1: Clear Browser Cache**

#### **Chrome/Edge:**
1. **Tekan:** `Ctrl + Shift + Delete`
2. **Pilih:** "All time"
3. **Centang semua:**
   - ✅ Browsing history
   - ✅ Cookies and other site data
   - ✅ Cached images and files
4. **Klik:** "Clear data"

#### **Firefox:**
1. **Tekan:** `Ctrl + Shift + Delete`
2. **Pilih:** "Everything"
3. **Centang semua**
4. **Klik:** "Clear Now"

#### **Atau Hard Refresh:**
- **Tekan:** `Ctrl + Shift + R` (Chrome/Edge)
- **Tekan:** `Ctrl + F5` (Firefox)

---

### **LANGKAH 2: Clear Next.js Cache**

```bash
# Stop dev server dulu (Ctrl + C)
# Lalu jalankan:

# Clear Next.js cache
rm -rf .next

# Clear node_modules cache
rm -rf node_modules
rm -rf package-lock.json

# Reinstall dependencies
npm install

# Restart dev server
npm run dev
```

**Atau untuk Windows:**
```cmd
# Stop dev server dulu (Ctrl + C)
# Lalu jalankan:

# Clear Next.js cache
rmdir /s .next

# Clear node_modules cache
rmdir /s node_modules
del package-lock.json

# Reinstall dependencies
npm install

# Restart dev server
npm run dev
```

---

### **LANGKAH 3: Clear Supabase Cache**

1. **Buka Supabase Dashboard:** https://app.supabase.com
2. **Project Settings** (⚙️) → **API**
3. **Scroll ke bawah** → **"Reset API Key"**
4. **Klik:** "Reset API Key"
5. **Copy API Key baru**
6. **Update .env.local** dengan key baru

---

### **LANGKAH 4: Clear Local Storage & Session Storage**

#### **Via Browser Console (F12):**
```javascript
// Clear localStorage
localStorage.clear();

// Clear sessionStorage
sessionStorage.clear();

// Clear IndexedDB
if ('indexedDB' in window) {
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      indexedDB.deleteDatabase(db.name);
    });
  });
}

// Reload page
location.reload();
```

#### **Atau Manual:**
1. **F12** → **Application** tab
2. **Storage** → **Clear storage**
3. **Klik:** "Clear site data"

---

### **LANGKAH 5: Clear DNS Cache**

#### **Windows:**
```cmd
# Run as Administrator
ipconfig /flushdns
```

#### **Mac:**
```bash
sudo dscacheutil -flushcache
```

#### **Linux:**
```bash
sudo systemctl flush-dns
```

---

### **LANGKAH 6: Test dengan Incognito/Private Mode**

1. **Buka browser** dalam mode incognito/private
2. **Buka:** http://localhost:3000/register/new
3. **Test registrasi** dengan email baru
4. **✅ Jika berhasil:** Masalah cache browser
5. **❌ Jika masih error:** Masalah di server/code

---

## 🔧 **ALTERNATIVE: Force Clear Everything**

### **Script untuk Clear Semua:**

```bash
#!/bin/bash
# Clear everything script

echo "🧹 Clearing all caches..."

# Stop dev server
pkill -f "next dev"

# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules
rm -rf package-lock.json

# Clear browser cache (Chrome)
rm -rf ~/.cache/google-chrome/Default/Cache
rm -rf ~/.cache/google-chrome/Default/Code\ Cache

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
npm install

# Restart dev server
npm run dev

echo "✅ All caches cleared!"
```

---

## 🧪 **TEST SETELAH CLEAR CACHE:**

### **Test 1: Registrasi Email Baru**
1. **Buka:** http://localhost:3000/register/new
2. **Isi:**
   - Nama: Test User
   - Email: `test123@gmail.com`
   - Password: password123
3. **Klik:** "Buat akun baru"
4. **✅ Seharusnya berhasil!**

### **Test 2: Cek Console (F12)**
```
🔧 Supabase Config:
URL: https://hrxhnlzdtzyvoxzqznnl.supabase.co
Key exists: true
✅ Supabase connected successfully

🚀 Starting sign up for: test123@gmail.com
✅ User created successfully: test123@gmail.com
```

### **Test 3: Cek Network Tab (F12)**
- Request ke: `https://hrxhnlzdtzyvoxzqznnl.supabase.co/auth/v1/signup`
- Status: `200 OK`
- Response: `{"user": {...}, "session": {...}}`

---

## 🎯 **HASIL YANG DIHARAPKAN:**

- ✅ **Tidak ada** error "Email sudah terdaftar"
- ✅ **Registrasi** berhasil dengan email baru
- ✅ **User** langsung aktif
- ✅ **Bisa login** setelah registrasi

---

## 💡 **TIPS:**

1. **Gunakan incognito mode** untuk test pertama
2. **Clear cache** secara berkala saat development
3. **Restart dev server** setelah clear cache
4. **Cek console** untuk memastikan tidak ada error

---

**Silakan jalankan semua langkah clear cache di atas!** 🧹

Cache bandel memang sering jadi masalah saat development! 😊
