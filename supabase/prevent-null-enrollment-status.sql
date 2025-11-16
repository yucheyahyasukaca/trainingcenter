-- ============================================================================
-- PREVENT NULL ENROLLMENT STATUS IN FUTURE
-- Menambahkan constraint dan default value untuk mencegah status NULL
-- ============================================================================

-- 1. Set default value untuk kolom status
ALTER TABLE enrollments 
ALTER COLUMN status SET DEFAULT 'pending';

-- 2. Update yang masih NULL (jika ada yang terlewat)
UPDATE enrollments
SET status = 'pending'
WHERE status IS NULL;

-- 3. Tambahkan NOT NULL constraint
ALTER TABLE enrollments 
ALTER COLUMN status SET NOT NULL;

-- 4. Verify constraint
SELECT 
    column_name,
    is_nullable,
    column_default,
    data_type
FROM information_schema.columns
WHERE table_name = 'enrollments' 
  AND column_name = 'status';

-- 5. Show success message
DO $$
BEGIN
    RAISE NOTICE '✅ Enrollment status column now has NOT NULL constraint with default "pending"';
END $$;

