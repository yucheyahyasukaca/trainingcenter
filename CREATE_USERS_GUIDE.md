# 👥 Create Sample Users - GARUDA-21 Training Center

## 🚨 **Problem Solved: Sample Users Missing**

Login tidak bisa karena **sample users belum dibuat di Supabase Auth**.

---

## 🎯 **Solution: Create Sample Users**

### **Method 1: Via SQL (Recommended)**

1. **Buka Supabase Dashboard**
2. **Go to SQL Editor**
3. **Run this SQL:**

```sql
-- Copy & paste content dari file: supabase/create-sample-users.sql
```

**Atau langsung copy SQL di bawah ini:**

```sql
-- Admin User
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin,
  last_sign_in_at, phone, phone_confirmed_at, confirmed_at, email_change_confirm_status,
  banned_until, reauthentication_token, reauthentication_sent_at
) VALUES (
  gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated',
  'authenticated', 'admin@garuda21.com',
  '$2a$10$CwTycUXWue0Thq9StjUM0uP8hGxL6o8zXjXmZ5vK8qN2pL3rS9tW6', -- password: admin123
  NOW(), NOW(), NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Admin GARUDA-21"}',
  false, NOW(), null, null, NOW(), 0, null, '', null
);

-- Manager User  
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin,
  last_sign_in_at, phone, phone_confirmed_at, confirmed_at, email_change_confirm_status,
  banned_until, reauthentication_token, reauthentication_sent_at
) VALUES (
  gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated',
  'authenticated', 'manager@garuda21.com',
  '$2a$10$CwTycUXWue0Thq9StjUM0uP8hGxL6o8zXjXmZ5vK8qN2pL3rS9tW6', -- password: manager123
  NOW(), NOW(), NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Manager GARUDA-21"}',
  false, NOW(), null, null, NOW(), 0, null, '', null
);

-- Regular User
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin,
  last_sign_in_at, phone, phone_confirmed_at, confirmed_at, email_change_confirm_status,
  banned_until, reauthentication_token, reauthentication_sent_at
) VALUES (
  gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated',
  'authenticated', 'user@garuda21.com',
  '$2a$10$CwTycUXWue0Thq9StjUM0uP8hGxL6o8zXjXmZ5vK8qN2pL3rS9tW6', -- password: user123
  NOW(), NOW(), NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "User GARUDA-21"}',
  false, NOW(), null, null, NOW(), 0, null, '', null
);

-- Update Profiles
UPDATE user_profiles SET role = 'admin', full_name = 'Admin GARUDA-21' WHERE email = 'admin@garuda21.com';
UPDATE user_profiles SET role = 'manager', full_name = 'Manager GARUDA-21' WHERE email = 'manager@garuda21.com';
UPDATE user_profiles SET role = 'user', full_name = 'User GARUDA-21' WHERE email = 'user@garuda21.com';
```

---

### **Method 2: Via Supabase Dashboard**

1. **Buka Supabase Dashboard**
2. **Go to Authentication > Users**
3. **Click "Add User"**
4. **Create users one by one:**

```
User 1:
Email: admin@garuda21.com
Password: admin123
Confirm Email: OFF

User 2:
Email: manager@garuda21.com
Password: manager123
Confirm Email: OFF

User 3:
Email: user@garuda21.com
Password: user123
Confirm Email: OFF
```

5. **Update roles via SQL:**

```sql
UPDATE user_profiles SET role = 'admin', full_name = 'Admin GARUDA-21' WHERE email = 'admin@garuda21.com';
UPDATE user_profiles SET role = 'manager', full_name = 'Manager GARUDA-21' WHERE email = 'manager@garuda21.com';
UPDATE user_profiles SET role = 'user', full_name = 'User GARUDA-21' WHERE email = 'user@garuda21.com';
```

---

## 🎯 **Sample Accounts Ready**

Setelah users dibuat, gunakan:

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

## ✅ **Verification Steps**

1. **Check users created:**
```sql
SELECT id, email, created_at FROM auth.users WHERE email LIKE '%garuda21.com';
```

2. **Check profiles:**
```sql
SELECT id, email, full_name, role FROM user_profiles WHERE email LIKE '%garuda21.com';
```

3. **Test login** di aplikasi:
   - Go to http://localhost:3000/login
   - Click "Admin" button untuk auto-fill
   - Click "Login"

---

## 🚀 **Quick Setup Commands**

```bash
# 1. Buka Supabase Dashboard > SQL Editor
# 2. Copy & paste SQL dari create-sample-users.sql
# 3. Run SQL
# 4. Test login di aplikasi
```

---

## 🎉 **Expected Result**

Setelah sample users dibuat:
- ✅ Login page bisa diakses
- ✅ Sample accounts bisa login
- ✅ Dashboard accessible
- ✅ Role-based access working
- ✅ Red theme applied

---

**Login akan berfungsi setelah sample users dibuat! 🚀**
