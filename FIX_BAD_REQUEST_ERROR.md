# Fix Bad Request Error (400) - Supabase REST API

## 🔴 Masalah

Error "Bad Request (400)" pada endpoint Supabase REST API:
```
GET https://supabase.garuda-21.com/rest/v1/certificates?select=...
400 (Bad Request)
```

## 🔍 Penyebab

1. **Anon Key yang salah di-cache oleh browser**
   - Sebelumnya ada typo: `yeyJhbGciOiJI...` (seharusnya `eyJhbGciOiJI...`)
   - Browser/client masih menggunakan key yang lama
   
2. **Headers tidak properly set pada custom fetch**
   - Headers `apikey` dan `Authorization` tidak di-pass dengan benar

3. **Browser cache localStorage masih menyimpan token lama**

## ✅ Solusi yang Sudah Diterapkan

### 1. Perbaikan Environment Variable
File `.env.local` sudah diperbaiki:
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI... (tanpa 'y' di depan)
```

### 2. Supabase Client Configuration
File `lib/supabase.ts` menggunakan konfigurasi default yang benar:
- Supabase client akan otomatis menambahkan headers yang diperlukan
- Tidak perlu custom headers yang bisa menyebabkan konflik

### 3. Clear Browser Cache

Jalankan script ini untuk clear all cache:

```javascript
// Clear localStorage
localStorage.clear()

// Clear sessionStorage  
sessionStorage.clear()

// Clear all cookies
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

// Clear service worker cache
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => caches.delete(name))
  })
}

console.log('✅ All cache cleared! Please refresh the page.')
```

## 🚀 Langkah-langkah Fix

### Langkah 1: Restart Development Server
```bash
# Stop server (Ctrl+C)
# Then restart
npm run dev
```

### Langkah 2: Clear Browser Cache
Buka Browser Console (F12) dan jalankan:
```javascript
localStorage.clear(); sessionStorage.clear(); location.reload();
```

Atau gunakan:
- Chrome/Edge: `Ctrl + Shift + Delete` > Clear browsing data
- Firefox: `Ctrl + Shift + Delete` > Clear recent history
- Pilih "Cached images and files" dan "Cookies and site data"

### Langkah 3: Hard Refresh
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

### Langkah 4: Logout & Login Kembali
1. Logout dari aplikasi
2. Clear cache lagi jika perlu
3. Login kembali dengan credentials yang benar

## 🔧 Testing

Setelah melakukan langkah-langkah di atas:

1. ✅ Login harus berhasil
2. ✅ Tidak ada error "Bad Request" di console
3. ✅ API calls ke `/rest/v1/certificates` harus return 200 OK

## 📋 Checklist

- [x] Fix typo di `.env.local` (remove extra 'y')
- [x] Update `lib/supabase.ts` dengan proper headers
- [ ] Restart dev server
- [ ] Clear browser cache
- [ ] Hard refresh browser
- [ ] Test login
- [ ] Verify no more 400 errors

## 🐛 Jika Masih Error

Jika masih ada error setelah langkah di atas:

1. **Periksa Network Tab di DevTools**
   - Lihat Request Headers
   - Pastikan `apikey` header ada dan benar
   - Pastikan `Authorization` header format: `Bearer eyJ...`

2. **Periksa Console Logs**
   - Lihat apakah ada error lain
   - Cek apakah Supabase URL dan Key terload dengan benar

3. **Verify Environment Variables Terload**
   - Buka `/api/test` atau tambahkan console.log
   - Pastikan env vars tidak undefined

4. **Coba Incognito/Private Window**
   - Jika works di incognito, masalahnya di cache
   - Clear cache lebih agresif

## 📞 Support

Jika masih ada masalah, periksa:
- Supabase Dashboard > Settings > API
- Pastikan Anon Key di dashboard match dengan `.env.local`
- Pastikan RLS policies di database sudah benar

