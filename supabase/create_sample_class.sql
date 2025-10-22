-- Create sample class for testing
-- Jalankan di Supabase SQL Editor

-- First, check if trainer@garuda-21.com exists
SELECT id, email, full_name, role, trainer_level 
FROM user_profiles 
WHERE email = 'trainer@garuda-21.com';

-- Create a sample program if it doesn't exist
INSERT INTO programs (id, title, description, category, price, start_date, end_date, max_participants, current_participants, status, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Pelatihan AI untuk Pemula',
  'Pelatihan dasar tentang Artificial Intelligence dan Machine Learning',
  'Technology',
  500000,
  '2024-01-15',
  '2024-01-20',
  20,
  0,
  'published',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Create a sample class for the trainer
INSERT INTO classes (id, name, description, program_id, trainer_id, created_by, start_date, end_date, start_time, end_time, max_participants, current_participants, status, location, room, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  'Kelas AI Dasar - Batch 1',
  'Kelas pelatihan AI untuk pemula dengan materi dasar',
  '550e8400-e29b-41d4-a716-446655440001',
  (SELECT id FROM user_profiles WHERE email = 'trainer@garuda-21.com'),
  (SELECT id FROM user_profiles WHERE email = 'trainer@garuda-21.com'),
  '2024-01-15',
  '2024-01-20',
  '09:00:00',
  '17:00:00',
  20,
  5,
  'scheduled',
  'Jakarta',
  'Room A',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Create another class that's ongoing
INSERT INTO classes (id, name, description, program_id, trainer_id, created_by, start_date, end_date, start_time, end_time, max_participants, current_participants, status, location, room, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  'Kelas AI Lanjutan - Batch 1',
  'Kelas pelatihan AI untuk tingkat lanjutan',
  '550e8400-e29b-41d4-a716-446655440001',
  (SELECT id FROM user_profiles WHERE email = 'trainer@garuda-21.com'),
  (SELECT id FROM user_profiles WHERE email = 'trainer@garuda-21.com'),
  '2024-01-10',
  '2024-01-25',
  '09:00:00',
  '17:00:00',
  15,
  8,
  'ongoing',
  'Jakarta',
  'Room B',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Create a completed class
INSERT INTO classes (id, name, description, program_id, trainer_id, created_by, start_date, end_date, start_time, end_time, max_participants, current_participants, status, location, room, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440004',
  'Kelas AI Expert - Batch 1',
  'Kelas pelatihan AI untuk expert level',
  '550e8400-e29b-41d4-a716-446655440001',
  (SELECT id FROM user_profiles WHERE email = 'trainer@garuda-21.com'),
  (SELECT id FROM user_profiles WHERE email = 'trainer@garuda-21.com'),
  '2023-12-01',
  '2023-12-15',
  '09:00:00',
  '17:00:00',
  10,
  10,
  'completed',
  'Jakarta',
  'Room C',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verify the classes were created
SELECT 
  c.id,
  c.name,
  c.status,
  c.current_participants,
  c.max_participants,
  p.title as program_title,
  u.email as trainer_email
FROM classes c
JOIN programs p ON c.program_id = p.id
JOIN user_profiles u ON c.trainer_id = u.id
WHERE u.email = 'trainer@garuda-21.com'
ORDER BY c.created_at DESC;
