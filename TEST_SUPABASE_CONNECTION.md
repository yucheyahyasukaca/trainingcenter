# 🔍 TEST: Supabase Connection & Configuration

## 🎯 **Problem:**
Semua email (termasuk email baru) error "Email sudah terdaftar"

## 🔍 **Root Cause Investigation:**

Kemungkinan masalah di:
1. **Supabase URL salah** (custom domain vs default)
2. **Supabase configuration** bermasalah
3. **Email confirmation** masih aktif
4. **Rate limiting** dari Supabase
5. **Network/CORS** issue

---

## ⚡ **TEST STEP BY STEP:**

### **TEST 1: Cek Supabase URL**

Dari `.env.local` Anda:
```
NEXT_PUBLIC_SUPABASE_URL=https://supabase.garuda-21.com
```

**⚠️ INI MUNGKIN MASALAH!**

Supabase URL biasanya format:
```
https://your-project-id.supabase.co
```

Bukan custom domain seperti `supabase.garuda-21.com`

### **TEST 2: Cek URL yang Benar**

1. **Buka Supabase Dashboard:** https://app.supabase.com
2. **Project Settings** (⚙️) → **API**
3. **Cek Project URL:**
   - Harusnya: `https://hrxhnlzdtzyvoxzqznnl.supabase.co`
   - Bukan: `https://supabase.garuda-21.com`

### **TEST 3: Update .env.local**

**Ganti URL di `.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://hrxhnlzdtzyvoxzqznnl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### **TEST 4: Restart Server**

```bash
npm run dev
```

### **TEST 5: Test Registrasi**

1. **Buka:** http://localhost:3000/register/new
2. **Registrasi** dengan email baru
3. **Cek console** (F12) untuk log

---

## 🔍 **DEBUG LENGKAP:**

### **Cek Console Browser (F12):**

Setelah restart, seharusnya ada log:
```
🔧 Supabase Config:
URL: https://hrxhnlzdtzyvoxzqznnl.supabase.co
Key exists: true
✅ Supabase connected successfully
```

**Jika masih error:**
```
❌ Supabase connection error: [error details]
```

### **Cek Network Tab (F12):**

1. **Tab Network**
2. **Coba registrasi**
3. **Lihat request ke Supabase:**
   - URL harus: `https://hrxhnlzdtzyvoxzqznnl.supabase.co/auth/v1/signup`
   - Bukan: `https://supabase.garuda-21.com/auth/v1/signup`

---

## 🎯 **KEMUNGKINAN PENYEBAB:**

### **1. Custom Domain Issue**
- URL `supabase.garuda-21.com` mungkin tidak dikonfigurasi dengan benar
- **Fix:** Gunakan URL default Supabase

### **2. CORS Issue**
- Custom domain mungkin tidak allow CORS dari localhost
- **Fix:** Gunakan URL default Supabase

### **3. SSL Certificate Issue**
- Custom domain mungkin tidak ada SSL yang valid
- **Fix:** Gunakan URL default Supabase

### **4. DNS Issue**
- Custom domain mungkin tidak resolve dengan benar
- **Fix:** Gunakan URL default Supabase

---

## ⚡ **QUICK FIX:**

### **Ganti URL di .env.local:**

```env
# GANTI INI:
NEXT_PUBLIC_SUPABASE_URL=https://supabase.garuda-21.com

# MENJADI INI:
NEXT_PUBLIC_SUPABASE_URL=https://hrxhnlzdtzyvoxzqznnl.supabase.co
```

### **Restart Server:**

```bash
npm run dev
```

### **Test Registrasi:**

1. **Buka:** http://localhost:3000/register/new
2. **Registrasi** dengan email baru
3. **✅ Seharusnya berhasil!**

---

## 📊 **EXPECTED RESULT:**

### **Console Log:**
```
🔧 Supabase Config:
URL: https://hrxhnlzdtzyvoxzqznnl.supabase.co
Key exists: true
✅ Supabase connected successfully
```

### **Network Request:**
```
POST https://hrxhnlzdtzyvoxzqznnl.supabase.co/auth/v1/signup
Status: 200 OK
```

### **Registration:**
```
✅ User created successfully: test@example.com
📧 Email confirmed: true
✅ User confirmed: true
```

---

**Silakan cek dan ganti URL Supabase di .env.local!** 🚀
