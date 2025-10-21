# Forum Diskusi Kelas - Database Setup

## Overview

Script SQL ini mengimplementasikan sistem forum diskusi untuk setiap kelas dengan auto-create kategori default.

## Files

- `auto-create-forum-categories.sql` - Main script untuk setup forum system

## Features

### 1. Auto-Create Default Categories

Setiap kelas baru otomatis mendapat 2 kategori forum:
- **Perkenalan** (order: 1)
- **Konsultasi & Pertanyaan** (order: 2)

### 2. Database Objects

Script akan create/update:
- Table: `forum_categories` (dengan kolom tambahan)
- Function: `create_default_forum_categories_for_class()`
- Trigger: `trigger_create_default_forum_categories`
- RLS Policies untuk access control
- Indexes untuk performance

### 3. Backfill Existing Data

Script otomatis membuat kategori untuk kelas yang sudah ada.

## Installation

### Option 1: Supabase Dashboard

1. Login ke Supabase Dashboard
2. Pilih project Anda
3. Buka SQL Editor
4. Copy paste isi file `auto-create-forum-categories.sql`
5. Click "Run"

### Option 2: psql Command Line

```bash
psql -h your-db-host -U postgres -d your-db-name -f auto-create-forum-categories.sql
```

### Option 3: Supabase CLI

```bash
supabase db push
```

## Verification

Setelah menjalankan script, verifikasi dengan query berikut:

```sql
-- 1. Check trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_create_default_forum_categories';

-- 2. Check function exists
SELECT 
    proname,
    prokind,
    prorettype::regtype
FROM pg_proc
WHERE proname = 'create_default_forum_categories_for_class';

-- 3. Check categories created for existing classes
SELECT 
    c.id as class_id,
    c.name as class_name,
    COUNT(fc.id) as category_count,
    STRING_AGG(fc.name, ', ' ORDER BY fc.order_index) as categories
FROM classes c
LEFT JOIN forum_categories fc ON fc.class_id = c.id
GROUP BY c.id, c.name
ORDER BY c.name;

-- Should show 2 categories per class

-- 4. Check RLS policies
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'forum_categories'
ORDER BY policyname;
```

## Testing

### Test 1: Auto-Create on New Class

```sql
-- Create a test class
INSERT INTO classes (program_id, name, description, start_date, end_date, max_participants)
SELECT 
    id,
    'Test Class for Forum',
    'This is a test class to verify auto-create categories',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    20
FROM programs
LIMIT 1
RETURNING id;

-- Check if categories were created (use the returned class id)
SELECT * FROM forum_categories WHERE class_id = '{your-test-class-id}';
-- Should return 2 rows: "Perkenalan" and "Konsultasi & Pertanyaan"
```

### Test 2: Manual Backfill

If you need to manually create categories for a specific class:

```sql
-- Get class info
SELECT id, name FROM classes WHERE name = 'Your Class Name';

-- Manually trigger category creation
DO $$
DECLARE
    v_class_id UUID := '{your-class-id}';
    v_program_id UUID;
    v_class_name TEXT;
BEGIN
    SELECT program_id, name INTO v_program_id, v_class_name
    FROM classes WHERE id = v_class_id;
    
    -- Create categories
    INSERT INTO forum_categories (class_id, program_id, name, description, order_index, is_active)
    VALUES 
        (v_class_id, v_program_id, 'Perkenalan', 
         'Forum untuk perkenalan diri antar peserta kelas ' || v_class_name, 1, true),
        (v_class_id, v_program_id, 'Konsultasi & Pertanyaan', 
         'Forum untuk konsultasi dan tanya jawab seputar materi kelas ' || v_class_name, 2, true);
         
    RAISE NOTICE 'Categories created for class: %', v_class_name;
END $$;
```

## Rollback

Jika perlu rollback (undo):

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS trigger_create_default_forum_categories ON classes;

-- Drop function
DROP FUNCTION IF EXISTS create_default_forum_categories_for_class();

-- Remove categories created by this script (optional - be careful!)
-- DELETE FROM forum_categories 
-- WHERE name IN ('Perkenalan', 'Konsultasi & Pertanyaan');

-- Remove added columns (optional)
-- ALTER TABLE forum_categories DROP COLUMN IF EXISTS order_index;
-- ALTER TABLE forum_categories DROP COLUMN IF EXISTS is_active;
```

## Maintenance

### Add More Default Categories

Edit the function in the script:

```sql
CREATE OR REPLACE FUNCTION create_default_forum_categories_for_class()
RETURNS TRIGGER AS $$
BEGIN
    -- Add new category here
    INSERT INTO forum_categories (...)
    VALUES (...);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Change Category Order

```sql
UPDATE forum_categories 
SET order_index = 2 
WHERE name = 'Perkenalan';

UPDATE forum_categories 
SET order_index = 1 
WHERE name = 'Konsultasi & Pertanyaan';
```

### Disable a Category

```sql
UPDATE forum_categories 
SET is_active = false 
WHERE name = 'Perkenalan' AND class_id = '{specific-class-id}';
```

## Monitoring

### Check Forum Activity

```sql
-- Categories per class
SELECT 
    c.name as class_name,
    COUNT(fc.id) as total_categories,
    COUNT(ft.id) as total_threads
FROM classes c
LEFT JOIN forum_categories fc ON fc.class_id = c.id
LEFT JOIN forum_threads ft ON ft.category_id = fc.id
GROUP BY c.id, c.name
ORDER BY total_threads DESC;

-- Most active categories
SELECT 
    fc.name as category_name,
    c.name as class_name,
    COUNT(ft.id) as thread_count,
    SUM(ft.reply_count) as total_replies
FROM forum_categories fc
JOIN classes c ON c.id = fc.class_id
LEFT JOIN forum_threads ft ON ft.category_id = fc.id
GROUP BY fc.id, fc.name, c.name
ORDER BY thread_count DESC;
```

## Performance

Script includes indexes for optimal performance:
- `idx_forum_categories_class_id` on `class_id`
- `idx_forum_categories_program_id` on `program_id`
- `idx_forum_categories_order` on `order_index`

## Security

RLS Policies ensure:
- Only enrolled participants can view categories
- Only admin/manager can manage categories
- Trainers can access their class forums
- Proper authentication checks

## Support

For issues or questions:
1. Check `FORUM_DISKUSI_KELAS_GUIDE.md` for detailed documentation
2. Check `QUICK_START_FORUM_KELAS.md` for quick troubleshooting
3. Contact development team

---

**Version:** 1.0.0
**Last Updated:** October 21, 2025

