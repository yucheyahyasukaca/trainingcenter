# 🔧 Login Fix - Quick Reference

## 🎯 Problem
**Error:** `Database error querying schema`  
**Cause:** Table `user_profiles` tidak ada di database

---

## ⚡ Quick Fix (5 Menit)

### 1️⃣ Run SQL Script
**Location:** Supabase Dashboard → SQL Editor

**File:** `supabase/COMPLETE_FIX.sql`

```sql
-- Copy & paste SEMUA content dari COMPLETE_FIX.sql
-- Kemudian klik RUN
```

✅ **Result:** Table `user_profiles` created

---

### 2️⃣ Create Users
**Location:** Supabase Dashboard → Authentication → Users

**Click "Add User" 3x untuk create:**

| Email | Password | Role | Auto Confirm |
|-------|----------|------|--------------|
| admin@garuda21.com | admin123 | admin | ✅ ON |
| manager@garuda21.com | manager123 | manager | ✅ ON |
| user@garuda21.com | user123 | user | ✅ ON |

**Kemudian set roles di SQL Editor:**
```sql
UPDATE user_profiles SET role = 'admin' WHERE email = 'admin@garuda21.com';
UPDATE user_profiles SET role = 'manager' WHERE email = 'manager@garuda21.com';
UPDATE user_profiles SET role = 'user' WHERE email = 'user@garuda21.com';
```

✅ **Result:** 3 users with correct roles

---

### 3️⃣ Test Login
**Location:** http://localhost:3000/login

```
Email: admin@garuda21.com
Password: admin123
```

✅ **Result:** Login berhasil → Dashboard

---

## 📚 Documentation Files

| File | Description |
|------|-------------|
| **ACTION_PLAN_FIX_LOGIN.md** | 📋 Detailed step-by-step guide |
| **DIAGNOSIS_LOGIN_ERROR.md** | 🔍 Technical diagnosis & analysis |
| **FIX_LOGIN_SEKARANG.md** | 🚀 Quick fix with troubleshooting |
| **supabase/COMPLETE_FIX.sql** | 💾 SQL script to run |
| **supabase/CREATE_USERS_DASHBOARD.md** | 👥 Guide to create users |

---

## ✅ Checklist

- [ ] Run `COMPLETE_FIX.sql`
- [ ] Create 3 users (admin, manager, user)
- [ ] Set roles via SQL UPDATE
- [ ] Test login
- [ ] Access dashboard

---

## 🆘 Quick Help

### Error: "Invalid login credentials"
```sql
-- Check if user confirmed:
SELECT email, email_confirmed_at FROM auth.users 
WHERE email = 'admin@garuda21.com';

-- Fix if NULL:
UPDATE auth.users SET email_confirmed_at = NOW()
WHERE email = 'admin@garuda21.com';
```

### Error: "Table does not exist"
```
Ulangi step 1 (run COMPLETE_FIX.sql)
```

### Error: "UPDATE 0" when setting roles
```sql
-- Manual insert profile:
INSERT INTO user_profiles (id, email, full_name, role)
SELECT id, email, email, 'admin'
FROM auth.users WHERE email = 'admin@garuda21.com'
ON CONFLICT (id) DO NOTHING;
```

---

## 🎯 Expected Result

After following all steps:

```
✅ Table user_profiles exists
✅ 3 auth users created
✅ 3 user profiles with roles
✅ Login works
✅ Dashboard accessible
✅ No more "Database error querying schema"
```

---

## 📞 Need More Help?

1. Read **ACTION_PLAN_FIX_LOGIN.md** for detailed steps
2. Check **TROUBLESHOOT_LOGIN.md** for common issues
3. See **DIAGNOSIS_LOGIN_ERROR.md** for technical details

---

**Start with ACTION_PLAN_FIX_LOGIN.md for step-by-step instructions! 🚀**

