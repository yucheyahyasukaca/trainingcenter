# 🔧 Supabase Self-Hosted: Disable Email Confirmation

## 🎯 **Lokasi Setting Email Confirmation di Supabase Self-Hosted:**

### **Method 1: Via Supabase Dashboard (Self-Hosted)**

1. **Buka Supabase Dashboard** (self-hosted Anda)
2. **Klik ⚙️ Project Settings** (icon gear)
3. **Klik Authentication** di menu sebelah kiri
4. **Scroll ke bawah** sampai ke bagian **"Email"**
5. **Cari setting:** "Enable email confirmations"
6. **TOGGLE OFF** (dari ON jadi OFF)
7. **Klik Save**

---

### **Method 2: Via Environment Variables**

**File:** `supabase/.env` atau `supabase/config.toml`

```env
# Disable email confirmation
AUTH_EMAIL_CONFIRMATION_ENABLED=false
```

**Atau di config.toml:**
```toml
[auth]
email_confirmation_enabled = false
```

---

### **Method 3: Via SQL (Database Level)**

**Jalankan di SQL Editor:**

```sql
-- Disable email confirmation via database
UPDATE auth.config 
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb), 
  '{email_confirmation_enabled}', 
  'false'::jsonb
);
```

---

### **Method 4: Via Supabase CLI**

```bash
# Update config via CLI
supabase config set auth.email_confirmation_enabled false

# Restart Supabase
supabase stop
supabase start
```

---

### **Method 5: Via Docker Compose (Jika Pakai Docker)**

**File:** `docker-compose.yml`

```yaml
services:
  supabase-auth:
    environment:
      - AUTH_EMAIL_CONFIRMATION_ENABLED=false
```

**Restart container:**
```bash
docker-compose down
docker-compose up -d
```

---

## 🔍 **Cek Setting Saat Ini:**

### **Via SQL Query:**

```sql
-- Cek current email confirmation setting
SELECT 
  raw_app_meta_data->>'email_confirmation_enabled' as email_confirmation_enabled,
  raw_app_meta_data
FROM auth.config;
```

### **Via Environment Variables:**

```bash
# Cek environment variables
echo $AUTH_EMAIL_CONFIRMATION_ENABLED
```

---

## ⚡ **QUICK FIX (Pilih Salah Satu):**

### **Option A: Via Dashboard (Paling Mudah)**
1. Buka Supabase Dashboard self-hosted
2. Project Settings → Authentication → Email
3. "Enable email confirmations" → OFF
4. Save

### **Option B: Via Environment Variables**
1. Edit file `supabase/.env`
2. Tambah: `AUTH_EMAIL_CONFIRMATION_ENABLED=false`
3. Restart Supabase

### **Option C: Via SQL (Paling Cepat)**
1. SQL Editor
2. Jalankan script di atas
3. Restart Supabase

---

## 🧪 **TEST SETELAH DISABLE:**

### **Test Registrasi:**

1. **Buka:** http://localhost:3000/register/new
2. **Isi form:**
   - Nama: Test User
   - Email: `test123@gmail.com`
   - Password: password123
3. **Klik:** "Buat akun baru"

**✅ Seharusnya berhasil tanpa error!**

---

## 📊 **HASIL YANG DIHARAPKAN:**

- ✅ **Tidak ada** 500 error
- ✅ **Tidak ada** "Error sending confirmation email"
- ✅ **Tidak ada** "Email sudah terdaftar" error
- ✅ User **langsung aktif** setelah registrasi
- ✅ Bisa **langsung login**

---

## 💡 **TIPS:**

1. **Method 1 (Dashboard)** paling mudah untuk testing
2. **Method 2 (Environment)** paling permanent
3. **Method 3 (SQL)** paling cepat
4. **Restart Supabase** setelah ubah setting

---

**Silakan pilih method yang paling mudah untuk setup Anda!** 🚀
