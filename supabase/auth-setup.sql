-- Authentication Setup untuk Garuda Academy GARUDA-21 Training Center
-- Jalankan SQL ini setelah schema.sql

-- Note: Supabase Auth sudah otomatis membuat table auth.users
-- Kita hanya perlu membuat sample users dan link ke data

-- 1. Buat table untuk profile users (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Enable RLS pada user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policies untuk user_profiles
CREATE POLICY "Users can view their own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
  ON user_profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Function untuk auto-create profile saat user sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger untuk auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Update RLS policies untuk existing tables (Production-ready)
-- Untuk development, kita biarkan semua users bisa akses
-- Untuk production, uncomment policies di bawah ini:

/*
-- Trainers: Only authenticated users can manage
DROP POLICY IF EXISTS "Enable read access for all users" ON trainers;
DROP POLICY IF EXISTS "Enable insert for all users" ON trainers;
DROP POLICY IF EXISTS "Enable update for all users" ON trainers;
DROP POLICY IF EXISTS "Enable delete for all users" ON trainers;

CREATE POLICY "Authenticated users can view trainers" 
  ON trainers FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage trainers" 
  ON trainers FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Similar policies untuk programs, participants, enrollments
-- ... (copy pattern di atas)
*/

-- 7. Index untuk performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- ========================================
-- SAMPLE USERS untuk Testing
-- ========================================
-- NOTE: User creation harus dilakukan via Supabase Dashboard atau API
-- Karena password harus di-hash oleh Supabase Auth

-- Setelah menjalankan SQL ini, buat users manual di Supabase Dashboard:
-- Dashboard > Authentication > Users > Add User

-- Sample Users yang perlu dibuat:
-- 
-- 1. Admin User
--    Email: admin@trainingcenter.com
--    Password: admin123
--    Role: admin
--
-- 2. Manager User
--    Email: manager@trainingcenter.com
--    Password: manager123
--    Role: manager
--
-- 3. Regular User
--    Email: user@trainingcenter.com
--    Password: user123
--    Role: user
--
-- 4. Trainer User (untuk trainer yang ada)
--    Email: budi.santoso@email.com
--    Password: trainer123
--    Role: user

-- Setelah users dibuat di Dashboard, update role mereka:
-- UPDATE user_profiles SET role = 'admin', full_name = 'Admin User' WHERE email = 'admin@trainingcenter.com';
-- UPDATE user_profiles SET role = 'manager', full_name = 'Manager User' WHERE email = 'manager@trainingcenter.com';
-- UPDATE user_profiles SET role = 'user', full_name = 'Regular User' WHERE email = 'user@trainingcenter.com';
-- UPDATE user_profiles SET role = 'user', full_name = 'Dr. Budi Santoso' WHERE email = 'budi.santoso@email.com';

-- ========================================
-- Cara Membuat Sample Users
-- ========================================
-- 
-- PILIHAN 1: Via Supabase Dashboard (Recommended untuk Development)
-- 1. Buka Supabase Dashboard
-- 2. Pilih project Anda
-- 3. Klik "Authentication" di sidebar
-- 4. Klik "Add User" 
-- 5. Masukkan email dan password
-- 6. Confirm Email: OFF (untuk testing)
-- 7. Klik "Create User"
-- 8. Ulangi untuk semua sample users
-- 
-- PILIHAN 2: Via SQL dengan Supabase Auth API
-- (Gunakan setelah aplikasi berjalan, via sign up page)
--
-- ========================================

-- Verification queries
-- Cek users yang sudah dibuat:
-- SELECT id, email, created_at FROM auth.users;

-- Cek profiles:
-- SELECT * FROM user_profiles;

-- Test authentication status:
-- SELECT auth.uid(), auth.email();

