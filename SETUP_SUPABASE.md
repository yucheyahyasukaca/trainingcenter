# 🚀 Setup Supabase untuk GARUDA-21 Training Center

## ❌ **Problem: Login Tidak Bisa**

Login tidak berfungsi karena **environment variables Supabase belum dikonfigurasi**.

---

## 🔧 **Solusi: Setup Supabase**

### **Step 1: Buat Project Supabase**

1. **Kunjungi:** [https://supabase.com](https://supabase.com)
2. **Sign up/Login** dengan akun GitHub/Google
3. **Click "New Project"**
4. **Isi form:**
   ```
   Organization: (pilih atau buat baru)
   Name: garuda-academy
   Database Password: (buat password kuat)
   Region: Singapore (terdekat dengan Indonesia)
   ```
5. **Click "Create new project"**
6. **Tunggu 2-3 menit** hingga project ready

---

### **Step 2: Dapatkan API Keys**

1. **Di dashboard Supabase:**
   - Click **Settings** (gear icon)
   - Click **API**
2. **Copy 2 values:**
   ```
   Project URL: https://abcdefghijklmnop.supabase.co
   anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

### **Step 3: Update Environment Variables**

1. **Buka file:** `.env.local`
2. **Ganti dengan values dari Supabase:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

**Contoh real:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5ODc2MjAwMCwiZXhwIjoyMDE0MzM4MDAwfQ.example_signature_here
```

---

### **Step 4: Setup Database Schema**

1. **Di Supabase Dashboard:**
   - Click **SQL Editor**
   - Click **New Query**

2. **Copy & paste schema dari:** `supabase/schema.sql`
   ```sql
   -- Copy semua content dari file supabase/schema.sql
   ```

3. **Run query** (click ▶️)

4. **Copy & paste auth setup dari:** `supabase/auth-setup.sql`
   ```sql
   -- Copy semua content dari file supabase/auth-setup.sql
   ```

5. **Run query** (click ▶️)

---

### **Step 5: Create Sample Users**

**Di SQL Editor, run query ini:**

```sql
-- Create sample users untuk testing
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, last_sign_in_at, phone, phone_confirmed_at, phone_change, phone_change_token, confirmed_at, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    'admin@garuda21.com',
    '$2a$10$CwTycUXWue0Thq9StjUM0uP8hGxL6o8zXjXmZ5vK8qN2pL3rS9tW6', -- password: admin123
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Admin GARUDA-21"}',
    false,
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    '',
    NOW(),
    null,
    null,
    '',
    '',
    NOW(),
    0,
    null,
    '',
    null
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'manager@garuda21.com',
    '$2a$10$CwTycUXWue0Thq9StjUM0uP8hGxL6o8zXjXmZ5vK8qN2pL3rS9tW6', -- password: manager123
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Manager GARUDA-21"}',
    false,
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    '',
    NOW(),
    null,
    null,
    '',
    '',
    NOW(),
    0,
    null,
    '',
    null
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'user@garuda21.com',
    '$2a$10$CwTycUXWue0Thq9StjUM0uP8hGxL6o8zXjXmZ5vK8qN2pL3rS9tW6', -- password: user123
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "User GARUDA-21"}',
    false,
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    '',
    NOW(),
    null,
    null,
    '',
    '',
    NOW(),
    0,
    null,
    '',
    null
  );

-- Insert user profiles
INSERT INTO user_profiles (id, email, full_name, role, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'admin@garuda21.com', 'Admin GARUDA-21', 'admin', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'manager@garuda21.com', 'Manager GARUDA-21', 'manager', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'user@garuda21.com', 'User GARUDA-21', 'user', NOW(), NOW());
```

---

### **Step 6: Restart Development Server**

```bash
# Stop server
Ctrl+C

# Start again
npm run dev
```

---

### **Step 7: Test Login**

**Visit:** http://localhost:3000/login

**Sample Accounts:**
```
Admin:
Email: admin@garuda21.com
Password: admin123

Manager:
Email: manager@garuda21.com
Password: manager123

User:
Email: user@garuda21.com
Password: user123
```

---

## 🎯 **Quick Setup Commands**

```bash
# 1. Buat project Supabase di https://supabase.com
# 2. Copy URL & API key ke .env.local
# 3. Run schema.sql di Supabase SQL Editor
# 4. Run auth-setup.sql di Supabase SQL Editor
# 5. Run sample users SQL di atas
# 6. Restart dev server
npm run dev
```

---

## ✅ **Verification Checklist**

- [ ] Supabase project created
- [ ] `.env.local` file updated dengan URL & key
- [ ] `schema.sql` executed di Supabase
- [ ] `auth-setup.sql` executed di Supabase
- [ ] Sample users created
- [ ] Dev server restarted
- [ ] Login page accessible
- [ ] Sample accounts working
- [ ] Dashboard accessible after login

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Invalid API key"**
**Solution:** Check `.env.local` file, pastikan URL & key benar

### **Issue 2: "User not found"**
**Solution:** Pastikan sample users sudah dibuat di Supabase

### **Issue 3: "Database connection failed"**
**Solution:** Check Supabase project status, pastikan project aktif

### **Issue 4: "RLS policy error"**
**Solution:** Pastikan `auth-setup.sql` sudah dijalankan

---

## 📞 **Need Help?**

1. **Check Supabase docs:** https://supabase.com/docs
2. **Check project status:** Dashboard Supabase
3. **Check logs:** Browser DevTools Console
4. **Check network:** Network tab di DevTools

---

**Setelah setup selesai, login akan berfungsi dengan sample accounts! 🚀**
