-- Fix RLS for user_profiles to allow users to read their own profile (needed for role check)
CREATE POLICY "Users can read own profile" ON user_profiles
    FOR SELECT
    USING (id = auth.uid());

-- Drop existing admin policy on hebat_modules to recreate it more robustly
DROP POLICY IF EXISTS "Admins can do everything on hebat_modules" ON hebat_modules;

-- Recreate admin policy
CREATE POLICY "Admins can do everything on hebat_modules" ON hebat_modules
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
        )
    );

-- Ensure admins can specifically SELECT all modules (redundant but safe)
CREATE POLICY "Admins can select all modules" ON hebat_modules
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
        )
    );
