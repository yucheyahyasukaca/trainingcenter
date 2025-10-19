-- ========================================
-- FIX SCHEMA ERRORS untuk GARUDA-21 Training Center (CLEAN VERSION)
-- ========================================
-- Jalankan SQL ini untuk memperbaiki schema errors
-- Fixed: Removed psql commands, pure SQL only

-- 1. Drop existing policies yang mungkin conflict
DROP POLICY IF EXISTS "Enable read access for all users" ON trainers;
DROP POLICY IF EXISTS "Enable insert for all users" ON trainers;
DROP POLICY IF EXISTS "Enable update for all users" ON trainers;
DROP POLICY IF EXISTS "Enable delete for all users" ON trainers;

DROP POLICY IF EXISTS "Enable read access for all users" ON programs;
DROP POLICY IF EXISTS "Enable insert for all users" ON programs;
DROP POLICY IF EXISTS "Enable update for all users" ON programs;
DROP POLICY IF EXISTS "Enable delete for all users" ON programs;

DROP POLICY IF EXISTS "Enable read access for all users" ON participants;
DROP POLICY IF EXISTS "Enable insert for all users" ON participants;
DROP POLICY IF EXISTS "Enable update for all users" ON participants;
DROP POLICY IF EXISTS "Enable delete for all users" ON participants;

DROP POLICY IF EXISTS "Enable read access for all users" ON enrollments;
DROP POLICY IF EXISTS "Enable insert for all users" ON enrollments;
DROP POLICY IF EXISTS "Enable update for all users" ON enrollments;
DROP POLICY IF EXISTS "Enable delete for all users" ON enrollments;

-- 2. Disable RLS untuk development (temporary)
ALTER TABLE IF EXISTS trainers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS enrollments DISABLE ROW LEVEL SECURITY;

-- 3. Enable RLS hanya untuk user_profiles
ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Fix user_profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow all operations on user_profiles" ON user_profiles;

-- Create simple policies untuk user_profiles
CREATE POLICY "Allow all operations on user_profiles" 
  ON user_profiles FOR ALL 
  USING (true)
  WITH CHECK (true);

-- 5. Create indexes untuk performance
CREATE INDEX IF NOT EXISTS idx_trainers_email ON trainers(email);
CREATE INDEX IF NOT EXISTS idx_programs_title ON programs(title);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_enrollments_program_id ON enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_participant_id ON enrollments(participant_id);

-- 6. Verify tables exist and have correct structure
-- Check if tables exist
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('trainers', 'programs', 'participants', 'enrollments', 'user_profiles');

-- 7. Check table structures (using SQL instead of psql commands)
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('trainers', 'programs', 'participants', 'enrollments', 'user_profiles')
ORDER BY table_name, ordinal_position;

-- 8. Test basic queries
SELECT 'trainers' as table_name, COUNT(*) as count FROM trainers
UNION ALL
SELECT 'programs', COUNT(*) FROM programs
UNION ALL
SELECT 'participants', COUNT(*) FROM participants
UNION ALL
SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles;
