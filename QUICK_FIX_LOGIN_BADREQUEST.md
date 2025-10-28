# 🚀 QUICK FIX - Login Error & Bad Request

## ❌ Masalah
1. Login error: "Invalid authentication credentials"
2. Bad Request (400) pada Supabase REST API

## ✅ ROOT CAUSE - SUDAH DIPERBAIKI
File `.env.local` memiliki **TYPO** pada anon key:
- ❌ **Salah:** `yeyJhbGciOiJI...` (ada huruf 'y' extra di depan)
- ✅ **Benar:** `eyJhbGciOiJI...` (sudah diperbaiki)

## 🔧 APA YANG SUDAH DILAKUKAN
1. ✅ Fixed typo di `.env.local`
2. ✅ Reverted `lib/supabase.ts` ke konfigurasi yang benar

## 📋 YANG PERLU ANDA LAKUKAN SEKARANG

### PENTING: Restart Development Server

```powershell
# 1. Stop server yang sedang running (tekan Ctrl+C)

# 2. (Opsional) Clear Next.js cache
Remove-Item -Recurse -Force .next

# 3. Start ulang server
npm run dev
```

### Setelah Server Restart:

**Buka Browser DevTools (F12) > Console, lalu jalankan:**

```javascript
// Clear semua cache dan reload
localStorage.clear(); 
sessionStorage.clear(); 
location.reload();
```

**Atau cara manual:**
1. Tekan `Ctrl + Shift + Delete`
2. Pilih "Cookies" dan "Cached images and files"  
3. Klik "Clear data"
4. Tekan `Ctrl + Shift + R` untuk hard refresh

### Test Login
Coba login lagi - seharusnya sudah berfungsi! 🎉

---

## 🐛 Jika Masih Error

### Check Console Logs:
Buka DevTools Console dan lihat apakah ada error:

```javascript
// Cek apakah env vars terload dengan benar
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

### Verify JWT Token Format:
Anon key harus dimulai dengan `eyJ`:
```
✅ BENAR: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
❌ SALAH: yeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Network Tab Check:
1. Buka DevTools > Network tab
2. Coba login
3. Klik request yang error
4. Check "Headers" tab:
   - Pastikan `apikey` header ada
   - Pastikan `Authorization` header ada

---

## 📝 Summary

**Masalah utama:** Typo `y` di depan anon key di `.env.local`  
**Solusi:** Sudah diperbaiki  
**Action required:** Restart server + clear browser cache  
**Expected result:** Login works, no more 400 errors

## ✨ After Fix Checklist
- [ ] Server restarted
- [ ] Browser cache cleared
- [ ] Can login successfully
- [ ] No 400 Bad Request errors in console
- [ ] Dashboard loads properly

---

**Kalau masih ada masalah setelah semua step di atas, screenshot error di console dan kirim ke saya!** 📸

