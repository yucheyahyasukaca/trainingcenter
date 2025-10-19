-- ========================================
-- CREATE SAMPLE USERS untuk GARUDA-21 Training Center
-- ========================================
-- Jalankan SQL ini di Supabase SQL Editor setelah auth-setup.sql

-- Method 1: Insert langsung ke auth.users (Advanced)
-- WARNING: Hanya untuk development! Password sudah di-hash dengan bcrypt

-- Admin User
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  last_sign_in_at,
  phone,
  phone_confirmed_at,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@garuda21.com',
  '$2a$10$CwTycUXWue0Thq9StjUM0uP8hGxL6o8zXjXmZ5vK8qN2pL3rS9tW6', -- password: admin123
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Admin GARUDA-21"}',
  false,
  NOW(),
  null,
  null,
  0,
  null,
  '',
  null
);

-- Manager User
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  last_sign_in_at,
  phone,
  phone_confirmed_at,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'manager@garuda21.com',
  '$2a$10$CwTycUXWue0Thq9StjUM0uP8hGxL6o8zXjXmZ5vK8qN2pL3rS9tW6', -- password: manager123
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Manager GARUDA-21"}',
  false,
  NOW(),
  null,
  null,
  0,
  null,
  '',
  null
);

-- Regular User
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  last_sign_in_at,
  phone,
  phone_confirmed_at,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'user@garuda21.com',
  '$2a$10$CwTycUXWue0Thq9StjUM0uP8hGxL6o8zXjXmZ5vK8qN2pL3rS9tW6', -- password: user123
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "User GARUDA-21"}',
  false,
  NOW(),
  null,
  null,
  0,
  null,
  '',
  null
);

-- ========================================
-- Update User Profiles dengan Role yang Benar
-- ========================================

-- Update Admin Profile
UPDATE user_profiles 
SET role = 'admin', full_name = 'Admin GARUDA-21'
WHERE email = 'admin@garuda21.com';

-- Update Manager Profile
UPDATE user_profiles 
SET role = 'manager', full_name = 'Manager GARUDA-21'
WHERE email = 'manager@garuda21.com';

-- Update User Profile
UPDATE user_profiles 
SET role = 'user', full_name = 'User GARUDA-21'
WHERE email = 'user@garuda21.com';

-- ========================================
-- Verification Queries
-- ========================================

-- Cek users yang sudah dibuat
SELECT id, email, created_at, email_confirmed_at FROM auth.users WHERE email LIKE '%garuda21.com';

-- Cek profiles dengan role
SELECT id, email, full_name, role, created_at FROM user_profiles WHERE email LIKE '%garuda21.com';

-- Test login (akan return user data jika berhasil)
-- SELECT auth.uid(), auth.email() FROM auth.users WHERE email = 'admin@garuda21.com';
