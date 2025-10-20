-- Add sample data for statistics testing
-- This script will add sample data if the database is empty

-- Insert sample trainers
INSERT INTO trainers (id, name, email, phone, specialization, experience_years, status)
VALUES 
  ('trainer-1', 'Dr. Ahmad Wijaya', 'ahmad@example.com', '081234567890', 'Data Science', 5, 'active'),
  ('trainer-2', 'Siti Nurhaliza', 'siti@example.com', '081234567891', 'Web Development', 3, 'active'),
  ('trainer-3', 'Budi Santoso', 'budi@example.com', '081234567892', 'Digital Marketing', 4, 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert sample participants
INSERT INTO participants (id, name, email, phone, gender, status)
VALUES 
  ('participant-1', 'John Doe', 'john@example.com', '081234567893', 'male', 'active'),
  ('participant-2', 'Jane Smith', 'jane@example.com', '081234567894', 'female', 'active'),
  ('participant-3', 'Bob Johnson', 'bob@example.com', '081234567895', 'male', 'active'),
  ('participant-4', 'Alice Brown', 'alice@example.com', '081234567896', 'female', 'active'),
  ('participant-5', 'Charlie Wilson', 'charlie@example.com', '081234567897', 'male', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert sample programs
INSERT INTO programs (id, title, description, category, duration_days, max_participants, price, status, start_date, end_date, trainer_id)
VALUES 
  ('program-1', 'Data Science Fundamentals', 'Learn the basics of data science', 'Technology', 30, 20, 2500000, 'published', '2024-01-15', '2024-02-15', 'trainer-1'),
  ('program-2', 'Web Development Bootcamp', 'Complete web development course', 'Technology', 60, 15, 3500000, 'published', '2024-01-20', '2024-03-20', 'trainer-2'),
  ('program-3', 'Digital Marketing Mastery', 'Advanced digital marketing strategies', 'Marketing', 45, 25, 2000000, 'published', '2024-02-01', '2024-03-17', 'trainer-3'),
  ('program-4', 'Python Programming', 'Learn Python from scratch', 'Technology', 40, 18, 1800000, 'published', '2024-02-10', '2024-03-21', 'trainer-1'),
  ('program-5', 'Social Media Marketing', 'Social media marketing strategies', 'Marketing', 30, 20, 1500000, 'published', '2024-02-15', '2024-03-16', 'trainer-3')
ON CONFLICT (id) DO NOTHING;

-- Insert sample enrollments with different dates and payment statuses
INSERT INTO enrollments (id, program_id, participant_id, enrollment_date, status, payment_status, amount_paid)
VALUES 
  -- January 2024 enrollments
  ('enrollment-1', 'program-1', 'participant-1', '2024-01-10', 'approved', 'paid', 2500000),
  ('enrollment-2', 'program-1', 'participant-2', '2024-01-12', 'approved', 'paid', 2500000),
  ('enrollment-3', 'program-2', 'participant-3', '2024-01-15', 'approved', 'paid', 3500000),
  
  -- February 2024 enrollments
  ('enrollment-4', 'program-3', 'participant-4', '2024-02-01', 'approved', 'paid', 2000000),
  ('enrollment-5', 'program-3', 'participant-5', '2024-02-05', 'approved', 'paid', 2000000),
  ('enrollment-6', 'program-4', 'participant-1', '2024-02-10', 'approved', 'paid', 1800000),
  ('enrollment-7', 'program-4', 'participant-2', '2024-02-12', 'approved', 'paid', 1800000),
  
  -- March 2024 enrollments
  ('enrollment-8', 'program-5', 'participant-3', '2024-03-01', 'approved', 'paid', 1500000),
  ('enrollment-9', 'program-5', 'participant-4', '2024-03-05', 'approved', 'paid', 1500000),
  ('enrollment-10', 'program-1', 'participant-5', '2024-03-10', 'approved', 'paid', 2500000),
  
  -- Recent enrollments (last 30 days)
  ('enrollment-11', 'program-2', 'participant-1', '2024-12-01', 'approved', 'paid', 3500000),
  ('enrollment-12', 'program-3', 'participant-2', '2024-12-05', 'approved', 'paid', 2000000),
  ('enrollment-13', 'program-4', 'participant-3', '2024-12-10', 'approved', 'paid', 1800000),
  
  -- Some pending enrollments
  ('enrollment-14', 'program-5', 'participant-4', '2024-12-15', 'pending', 'unpaid', 0),
  ('enrollment-15', 'program-1', 'participant-5', '2024-12-20', 'pending', 'unpaid', 0)
ON CONFLICT (id) DO NOTHING;

-- Update statistics
SELECT 'Sample data inserted successfully!' as message;
