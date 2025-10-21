# 🔧 Troubleshooting: Forum SQL Installation

## Common Errors & Solutions

### Error 1: "relation 'classes' does not exist"

**Cause:** Tabel `classes` belum dibuat di database

**Solution:**
```sql
-- Check if classes table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'classes'
);

-- If false, create classes table first
-- Run: supabase/create-classes-system.sql or supabase/COMPLETE_MIGRATION_SCRIPT.sql
```

### Error 2: "relation 'programs' does not exist"

**Cause:** Tabel `programs` belum dibuat di database

**Solution:**
```sql
-- Check if programs table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'programs'
);

-- If false, create programs table first
-- Run the main migration script
```

### Error 3: "duplicate key value violates unique constraint"

**Cause:** Kategori forum sudah ada untuk kelas tersebut

**Solution:**
```sql
-- This is actually OK! The safe version handles this automatically
-- To clean up duplicates:
DELETE FROM forum_categories a USING forum_categories b
WHERE a.id > b.id 
AND a.class_id = b.class_id 
AND a.name = b.name;
```

### Error 4: "permission denied for table forum_categories"

**Cause:** User tidak punya permission untuk membuat/modify table

**Solution:**
```sql
-- Grant permissions (run as superuser/admin)
GRANT ALL ON TABLE forum_categories TO postgres;
GRANT ALL ON TABLE forum_categories TO authenticated;
GRANT ALL ON TABLE forum_categories TO service_role;
```

### Error 5: "function auth.uid() does not exist"

**Cause:** Supabase auth extension belum diinstall (jika running locally)

**Solution:**
```sql
-- Install Supabase auth (if self-hosted)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Or use safer version without RLS
-- Use: auto-create-forum-categories-safe.sql which skips RLS if auth not available
```

## Step-by-Step Troubleshooting

### Step 1: Check Database Connection

```sql
-- Test basic query
SELECT NOW();

-- Should return current timestamp
```

### Step 2: Check Required Tables

```sql
-- Check all required tables
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            SELECT tablename FROM pg_tables WHERE schemaname = 'public'
        ) THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status
FROM (
    VALUES 
        ('programs'),
        ('classes'),
        ('forum_categories'),
        ('forum_threads'),
        ('forum_replies'),
        ('enrollments'),
        ('participants'),
        ('user_profiles')
) AS t(table_name);
```

### Step 3: Run Safe Version

If original script fails, use the safe version:

```bash
# Run safe version
supabase/auto-create-forum-categories-safe.sql
```

The safe version:
- ✅ Checks prerequisites before running
- ✅ Handles conflicts gracefully
- ✅ Skips RLS if tables don't exist
- ✅ Better error messages
- ✅ Won't fail on duplicate data

### Step 4: Verify Installation

```sql
-- 1. Check if function was created
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'create_default_forum_categories_for_class';

-- 2. Check if trigger was created
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_create_default_forum_categories';

-- 3. Check if categories were created
SELECT 
    c.name as class_name,
    fc.name as category_name,
    fc.order_index
FROM classes c
LEFT JOIN forum_categories fc ON fc.class_id = c.id
ORDER BY c.name, fc.order_index;
```

## Alternative: Manual Installation

If automated script still fails, install manually:

### Step 1: Create Table

```sql
CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 2: Create Function

```sql
CREATE OR REPLACE FUNCTION create_default_forum_categories_for_class()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO forum_categories (class_id, program_id, name, description, order_index, is_active)
    VALUES 
        (NEW.id, NEW.program_id, 'Perkenalan', 'Forum perkenalan', 1, true),
        (NEW.id, NEW.program_id, 'Konsultasi & Pertanyaan', 'Forum Q&A', 2, true)
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Step 3: Create Trigger

```sql
DROP TRIGGER IF EXISTS trigger_create_default_forum_categories ON classes;
CREATE TRIGGER trigger_create_default_forum_categories
    AFTER INSERT ON classes
    FOR EACH ROW
    EXECUTE FUNCTION create_default_forum_categories_for_class();
```

### Step 4: Backfill Existing Classes

```sql
INSERT INTO forum_categories (class_id, program_id, name, description, order_index, is_active)
SELECT 
    c.id,
    c.program_id,
    'Perkenalan',
    'Forum untuk perkenalan diri antar peserta kelas ' || c.name,
    1,
    true
FROM classes c
WHERE NOT EXISTS (
    SELECT 1 FROM forum_categories fc 
    WHERE fc.class_id = c.id AND fc.name = 'Perkenalan'
)
ON CONFLICT DO NOTHING;

INSERT INTO forum_categories (class_id, program_id, name, description, order_index, is_active)
SELECT 
    c.id,
    c.program_id,
    'Konsultasi & Pertanyaan',
    'Forum untuk konsultasi dan tanya jawab seputar materi kelas ' || c.name,
    2,
    true
FROM classes c
WHERE NOT EXISTS (
    SELECT 1 FROM forum_categories fc 
    WHERE fc.class_id = c.id AND fc.name = 'Konsultasi & Pertanyaan'
)
ON CONFLICT DO NOTHING;
```

## Quick Fix Scripts

### Reset Everything (Use with Caution!)

```sql
-- WARNING: This will delete all forum data!
DROP TRIGGER IF EXISTS trigger_create_default_forum_categories ON classes;
DROP FUNCTION IF EXISTS create_default_forum_categories_for_class();
DROP TABLE IF EXISTS forum_reactions CASCADE;
DROP TABLE IF EXISTS forum_replies CASCADE;
DROP TABLE IF EXISTS forum_threads CASCADE;
DROP TABLE IF EXISTS forum_categories CASCADE;

-- Then run the safe installation script again
```

### Test Auto-Creation

```sql
-- Create a test class
INSERT INTO classes (program_id, name, description, start_date, end_date, max_participants)
SELECT 
    id,
    'Test Class ' || NOW(),
    'Test class for forum categories',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    20
FROM programs
LIMIT 1
RETURNING id;

-- Check if categories were auto-created (use the returned id)
SELECT * FROM forum_categories WHERE class_id = 'YOUR-CLASS-ID-HERE';
-- Should show 2 rows
```

## Get Help

If still having issues:

1. **Check logs:**
   ```sql
   -- PostgreSQL logs (if accessible)
   SELECT * FROM pg_stat_activity WHERE state = 'active';
   ```

2. **Simplify the problem:**
   - Try creating table only (without trigger)
   - Try creating function only (without trigger)
   - Try creating trigger only (after function exists)

3. **Contact Support:**
   - Provide error message
   - Provide PostgreSQL version: `SELECT version();`
   - Provide table list: `\dt` or `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`

## Success Checklist

After installation, verify:

- [ ] `forum_categories` table exists
- [ ] Function `create_default_forum_categories_for_class` exists
- [ ] Trigger `trigger_create_default_forum_categories` exists
- [ ] Creating new class auto-creates 2 categories
- [ ] Existing classes have categories (if backfill ran)
- [ ] Can query: `SELECT * FROM forum_categories;` without error

---

**Still stuck?** Contact the development team with:
- Full error message
- Database version
- Tables that exist in your database
- SQL you tried to run

