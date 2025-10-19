# 🚀 Quick Fix: Login Error Solved!

## ❌ **Error Fixed:**
```
ERROR: 428C9: cannot insert a non-DEFAULT value into column "confirmed_at"
DETAIL: Column "confirmed_at" is a generated column.
```

---

## ✅ **Solution: Use Fixed SQL Script**

### **Step 1: Use the Fixed Script**

**File:** `supabase/create-sample-users-fixed.sql`

**What's Fixed:**
- ❌ Removed `confirmed_at` (generated column)
- ✅ Only insert required columns
- ✅ Proper Supabase Auth structure

---

## 🎯 **Quick Fix Steps:**

### **1. Open Supabase Dashboard**
- Go to your Supabase project
- Click **SQL Editor**

### **2. Copy & Paste Fixed SQL**
```sql
-- Copy ALL content dari file: supabase/create-sample-users-fixed.sql
```

### **3. Run SQL**
- Click **Run** button
- Should execute without errors

### **4. Test Login**
- Go to http://localhost:3000/login
- Click "Admin" button untuk auto-fill
- Click "Login"

---

## 👥 **Sample Accounts Ready:**

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

## 🔍 **Verification:**

### **Check Users Created:**
```sql
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email LIKE '%garuda21.com';
```

### **Check Profiles:**
```sql
SELECT id, email, full_name, role 
FROM user_profiles 
WHERE email LIKE '%garuda21.com';
```

---

## 🎉 **Expected Result:**

After running fixed SQL:
- ✅ No more "confirmed_at" error
- ✅ 3 sample users created
- ✅ User profiles with correct roles
- ✅ Login functionality working
- ✅ Red theme GARUDA-21 applied

---

## 📁 **Files:**

- ✅ `supabase/create-sample-users-fixed.sql` - **USE THIS ONE**
- ❌ `supabase/create-sample-users.sql` - Has error (don't use)

---

## 🚀 **Alternative Method (If SQL Still Fails):**

### **Via Supabase Dashboard:**

1. **Go to Authentication > Users**
2. **Click "Add User"**
3. **Create each user manually:**

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

4. **Update roles via SQL:**
```sql
UPDATE user_profiles SET role = 'admin', full_name = 'Admin GARUDA-21' WHERE email = 'admin@garuda21.com';
UPDATE user_profiles SET role = 'manager', full_name = 'Manager GARUDA-21' WHERE email = 'manager@garuda21.com';
UPDATE user_profiles SET role = 'user', full_name = 'User GARUDA-21' WHERE email = 'user@garuda21.com';
```

---

**Use the fixed SQL script and login will work! 🎯**
