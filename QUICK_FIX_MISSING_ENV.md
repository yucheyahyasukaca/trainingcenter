# ⚡ QUICK FIX: Missing .env.local File

## 🎯 **ROOT CAUSE DITEMUKAN:**

**Tidak ada file `.env.local`** → Supabase tidak bisa connect → Error "Email sudah terdaftar"

---

## ⚡ **SOLUSI 3 MENIT:**

### **LANGKAH 1: Buat File .env.local**

1. **Buat file baru** di root project (sama level dengan `package.json`)
2. **Nama:** `.env.local`
3. **Isi:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### **LANGKAH 2: Dapatkan Data Supabase**

1. **Buka:** https://app.supabase.com
2. **Project Settings** (⚙️) → **API**
3. **Copy:**
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### **LANGKAH 3: Restart Server**

```bash
npm run dev
```

**✅ Selesai!**

---

## 🧪 **TEST:**

**Cek console (F12):**
```
🔧 Supabase Config:
URL: https://your-project-id.supabase.co
Key exists: true
✅ Supabase connected successfully
```

**Test registrasi:** `yucheyahya@gmail.com`
**✅ Berhasil!**

---

**File `.env.local` yang hilang adalah penyebab semua masalah!** 🚀
