# 🚀 Edge Function: Signup Without Email Confirmation

## 🎯 **Solusi: Bypass Email Confirmation dengan Edge Function**

Karena email confirmation masih aktif dan sulit di-disable, kita akan menggunakan Edge Function untuk bypass email confirmation dan langsung create user yang aktif.

---

## ⚡ **SETUP EDGE FUNCTION (5 Menit):**

### **LANGKAH 1: Deploy Edge Function**

```bash
# Deploy Edge Function
supabase functions deploy signup-without-email-confirmation
```

**Atau jalankan script:**
```bash
chmod +x deploy-edge-function.sh
./deploy-edge-function.sh
```

### **LANGKAH 2: Test Edge Function**

```bash
# Test Edge Function
curl -X POST https://your-project.supabase.co/functions/v1/signup-without-email-confirmation \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User"}'
```

### **LANGKAH 3: Test Registration**

1. **Buka:** http://localhost:3000/register/new
2. **Registrasi** dengan email baru
3. **✅ Seharusnya berhasil!**

---

## 🔧 **CARA KERJA EDGE FUNCTION:**

### **Flow Baru:**
```
1. User registrasi di frontend
   ↓
2. Frontend call Edge Function (bukan Supabase Auth langsung)
   ↓
3. Edge Function create user dengan admin.createUser()
   ↓
4. Edge Function set email_confirm: true (auto-confirm)
   ↓
5. Edge Function create user profile
   ↓
6. Edge Function create participant record
   ↓
7. ✅ User langsung aktif tanpa email confirmation
```

### **Keuntungan:**
- ✅ **Bypass email confirmation** sepenuhnya
- ✅ **User langsung aktif** setelah registrasi
- ✅ **Tidak perlu** setup SMTP
- ✅ **Tidak perlu** disable setting di Supabase
- ✅ **Create semua record** yang diperlukan (profile, participant)

---

## 📁 **File yang Dibuat:**

### 1. **Edge Function** 🔧
File: `supabase/functions/signup-without-email-confirmation/index.ts`
- Create user dengan admin.createUser()
- Auto-confirm email
- Create user profile
- Create participant record

### 2. **API Route** 🌐
File: `app/api/supabase/functions/v1/signup-without-email-confirmation/route.ts`
- Proxy ke Edge Function
- Handle CORS
- Error handling

### 3. **Updated Auth Function** 🔐
File: `lib/auth.ts`
- Menggunakan Edge Function instead of direct Supabase Auth
- Same interface, different implementation

### 4. **Deploy Script** 🚀
File: `deploy-edge-function.sh`
- Script untuk deploy Edge Function
- Test function

---

## 🧪 **TEST SETELAH DEPLOY:**

### **Test 1: Edge Function Direct**

```bash
curl -X POST https://your-project.supabase.co/functions/v1/signup-without-email-confirmation \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User"}'
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "full_name": "Test User",
    "confirmed_at": "2024-01-01T00:00:00Z"
  },
  "profile": { ... },
  "participant": { ... }
}
```

### **Test 2: Frontend Registration**

1. **Buka:** http://localhost:3000/register/new
2. **Isi form:**
   - Nama: Test User
   - Email: `test@example.com`
   - Password: password123
3. **Klik:** "Buat akun baru"
4. **✅ Seharusnya berhasil!**

### **Test 3: Login After Registration**

1. **Buka:** http://localhost:3000/login
2. **Login** dengan email dan password yang baru dibuat
3. **✅ Seharusnya berhasil login!**

---

## 🎯 **HASIL YANG DIHARAPKAN:**

- ✅ **Tidak ada** 500 error
- ✅ **Tidak ada** "Error sending confirmation email"
- ✅ **Tidak ada** "Email sudah terdaftar" error
- ✅ User **langsung aktif** setelah registrasi
- ✅ **User profile** otomatis dibuat
- ✅ **Participant record** otomatis dibuat
- ✅ Bisa **langsung login** setelah registrasi

---

## 🔧 **TROUBLESHOOTING:**

### **Error: Function not found**
```bash
# Redeploy function
supabase functions deploy signup-without-email-confirmation
```

### **Error: Permission denied**
- Cek SUPABASE_SERVICE_ROLE_KEY di .env.local
- Pastikan service role key benar

### **Error: CORS**
- Cek CORS headers di Edge Function
- Pastikan request dari domain yang benar

---

## 💡 **TIPS:**

1. **Test Edge Function** dulu sebelum test frontend
2. **Cek logs** di Supabase Dashboard → Functions
3. **Monitor** function performance
4. **Backup** data sebelum deploy

---

**Edge Function adalah solusi terbaik untuk bypass email confirmation!** 🚀
