# 🔧 Troubleshoot: "Database error querying schema"

## ❌ **Error Identified:**
```
Login Gagal
Database error querying schema
```

---

## 🎯 **Root Causes & Solutions:**

### **Cause 1: RLS Policies Conflict**
**Problem:** Row Level Security policies blocking queries
**Solution:** Disable RLS untuk development

### **Cause 2: Missing Tables**
**Problem:** Tables tidak ter-create dengan benar
**Solution:** Re-run schema.sql

### **Cause 3: Schema Mismatch**
**Problem:** Database structure tidak sesuai dengan aplikasi
**Solution:** Fix schema dengan proper structure

---

## 🚀 **Quick Fix Steps:**

### **Step 1: Fix Schema Errors**
```sql
-- Run SQL dari file: supabase/fix-schema-errors.sql
```

### **Step 2: Re-run Main Schema**
```sql
-- Run SQL dari file: supabase/schema.sql
```

### **Step 3: Run Auth Setup**
```sql
-- Run SQL dari file: supabase/auth-setup.sql
```

### **Step 4: Create Sample Users**
```sql
-- Run SQL dari file: supabase/create-sample-users-fixed.sql
```

---

## 🔍 **Diagnostic Steps:**

### **1. Check Tables Exist:**
```sql
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('trainers', 'programs', 'participants', 'enrollments', 'user_profiles');
```

### **2. Check Table Structures:**
```sql
\d trainers;
\d programs;
\d participants;
\d enrollments;
\d user_profiles;
```

### **3. Test Basic Queries:**
```sql
SELECT COUNT(*) FROM trainers;
SELECT COUNT(*) FROM programs;
SELECT COUNT(*) FROM participants;
SELECT COUNT(*) FROM enrollments;
SELECT COUNT(*) FROM user_profiles;
```

---

## 🛠️ **Complete Reset (If Needed):**

### **Option 1: Reset Database Schema**
```sql
-- 1. Drop all tables
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS trainers CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 2. Re-run schema.sql
-- 3. Re-run auth-setup.sql
-- 4. Re-run create-sample-users-fixed.sql
```

### **Option 2: Fresh Supabase Project**
1. **Create new Supabase project**
2. **Update .env.local** dengan new credentials
3. **Run all SQL scripts** dalam urutan yang benar

---

## 📋 **Correct Execution Order:**

```bash
# 1. Schema setup
supabase/schema.sql

# 2. Auth setup  
supabase/auth-setup.sql

# 3. Fix any schema errors
supabase/fix-schema-errors.sql

# 4. Create sample users
supabase/create-sample-users-fixed.sql
```

---

## 🔧 **Alternative: Use Supabase Dashboard**

### **Method 1: Table Editor**
1. **Go to Supabase Dashboard**
2. **Click "Table Editor"**
3. **Create tables manually:**
   - trainers
   - programs
   - participants
   - enrollments
   - user_profiles

### **Method 2: Import CSV**
1. **Create sample data** dalam CSV format
2. **Import via Dashboard**

---

## ✅ **Verification Checklist:**

- [ ] All tables exist
- [ ] Tables have correct structure
- [ ] RLS policies working
- [ ] Sample data inserted
- [ ] Sample users created
- [ ] Login functionality working

---

## 🚨 **Common Issues:**

### **Issue 1: "Table does not exist"**
**Solution:** Run schema.sql

### **Issue 2: "Permission denied"**
**Solution:** Disable RLS atau fix policies

### **Issue 3: "Column does not exist"**
**Solution:** Check table structure, re-run schema

### **Issue 4: "RLS policy error"**
**Solution:** Use fix-schema-errors.sql

---

## 🎯 **Quick Test:**

```sql
-- Test basic functionality
SELECT 'trainers' as table_name, COUNT(*) as count FROM trainers
UNION ALL
SELECT 'programs', COUNT(*) FROM programs
UNION ALL
SELECT 'participants', COUNT(*) FROM participants
UNION ALL
SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles;
```

---

**Run the fix script and login should work! 🚀**
