# ⚡ QUICK FIX: Supabase Self-Hosted - Disable Email Confirmation

## 🎯 **Lokasi Setting di Supabase Self-Hosted:**

### **Method 1: Via Dashboard (Paling Mudah)**

1. **Buka Supabase Dashboard** (self-hosted Anda)
2. **Project Settings** (⚙️) → **Authentication**
3. **Scroll ke "Email"**
4. **"Enable email confirmations"** → **TOGGLE OFF**
5. **Save**

---

### **Method 2: Via SQL (Paling Cepat)**

1. **SQL Editor** → **New Query**
2. **Copy paste** isi file `supabase/disable-email-confirmation-self-hosted.sql`
3. **Run**

**✅ Email confirmation disabled!**

---

### **Method 3: Via Environment Variables**

**Edit file:** `supabase/.env`

```env
AUTH_EMAIL_CONFIRMATION_ENABLED=false
```

**Restart Supabase:**
```bash
supabase stop
supabase start
```

---

## 🧪 **TEST:**

1. **Buka:** http://localhost:3000/register/new
2. **Registrasi** dengan email baru
3. **✅ Berhasil tanpa error!**

---

## 🎯 **HASIL:**

- ✅ **Tidak ada** 500 error
- ✅ **Tidak ada** email confirmation error
- ✅ User **langsung aktif**
- ✅ Bisa **langsung login**

---

**Pilih method yang paling mudah untuk setup Anda!** 🚀
