-- ============================================================================
-- COMPLETE MIGRATION SCRIPT FOR SUPABASE SELF-HOSTING
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- This script contains everything needed to migrate from Supabase Cloud
-- to Supabase Self-Hosting. Run this script in your new Supabase instance.
--
-- IMPORTANT: Run this script in the exact order provided!
-- ============================================================================

-- ============================================================================
-- STEP 1: ENABLE REQUIRED EXTENSIONS
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'your-jwt-secret-here';

-- ============================================================================
-- STEP 2: CREATE CUSTOM TYPES
-- ============================================================================

-- User roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Trainer levels
DO $$ BEGIN
    CREATE TYPE trainer_level AS ENUM ('junior', 'senior', 'expert', 'master');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Program status
DO $$ BEGIN
    CREATE TYPE program_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enrollment status
DO $$ BEGIN
    CREATE TYPE enrollment_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payment status
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('unpaid', 'partial', 'paid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Class status
DO $$ BEGIN
    CREATE TYPE class_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 3: CREATE CORE TABLES
-- ============================================================================

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'user' NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    address TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    trainer_level trainer_level,
    trainer_experience_years INTEGER DEFAULT 0,
    trainer_specializations TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Programs table
CREATE TABLE IF NOT EXISTS programs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    status program_status DEFAULT 'draft',
    trainer_id UUID REFERENCES user_profiles(id),
    whatsapp_group_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    status class_status DEFAULT 'scheduled',
    location TEXT,
    room TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Class trainers table
CREATE TABLE IF NOT EXISTS class_trainers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
    trainer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'assistant' CHECK (role IN ('primary', 'assistant')),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, trainer_id)
);

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
    status enrollment_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'unpaid',
    payment_proof_url TEXT,
    notes TEXT,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(program_id, participant_id)
);

-- ============================================================================
-- STEP 4: CREATE FORUM SYSTEM TABLES
-- ============================================================================

-- Forum categories table
CREATE TABLE IF NOT EXISTS forum_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum threads table
CREATE TABLE IF NOT EXISTS forum_threads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    last_reply_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum replies table
CREATE TABLE IF NOT EXISTS forum_replies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    parent_reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_solution BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum reactions table
CREATE TABLE IF NOT EXISTS forum_reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
    reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike', 'love', 'laugh', 'angry', 'sad')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(thread_id, user_id, reaction_type),
    UNIQUE(reply_id, user_id, reaction_type),
    CHECK (
        (thread_id IS NOT NULL AND reply_id IS NULL) OR 
        (thread_id IS NULL AND reply_id IS NOT NULL)
    )
);

-- ============================================================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_trainer_level ON user_profiles(trainer_level);

-- Programs indexes
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_category ON programs(category);
CREATE INDEX IF NOT EXISTS idx_programs_trainer_id ON programs(trainer_id);
CREATE INDEX IF NOT EXISTS idx_programs_dates ON programs(start_date, end_date);

-- Classes indexes
CREATE INDEX IF NOT EXISTS idx_classes_program_id ON classes(program_id);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_dates ON classes(start_date, end_date);

-- Class trainers indexes
CREATE INDEX IF NOT EXISTS idx_class_trainers_class_id ON class_trainers(class_id);
CREATE INDEX IF NOT EXISTS idx_class_trainers_trainer_id ON class_trainers(trainer_id);

-- Participants indexes
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);

-- Enrollments indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_program_id ON enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_participant_id ON enrollments(participant_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_payment_status ON enrollments(payment_status);

-- Forum indexes
CREATE INDEX IF NOT EXISTS idx_forum_categories_program_id ON forum_categories(program_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_category_id ON forum_threads(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_author_id ON forum_threads(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_thread_id ON forum_replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_author_id ON forum_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_reactions_user_id ON forum_reactions(user_id);

-- ============================================================================
-- STEP 6: CREATE TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_categories_updated_at BEFORE UPDATE ON forum_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_threads_updated_at BEFORE UPDATE ON forum_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_replies_updated_at BEFORE UPDATE ON forum_replies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 7: CREATE FORUM TRIGGERS
-- ============================================================================

-- Function to update thread reply count
CREATE OR REPLACE FUNCTION update_thread_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_threads 
        SET reply_count = reply_count + 1, last_reply_at = NEW.created_at
        WHERE id = NEW.thread_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_threads 
        SET reply_count = reply_count - 1
        WHERE id = OLD.thread_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Apply reply count trigger
CREATE TRIGGER update_forum_thread_reply_count 
    AFTER INSERT OR DELETE ON forum_replies 
    FOR EACH ROW EXECUTE FUNCTION update_thread_reply_count();

-- ============================================================================
-- STEP 8: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 9: CREATE RLS POLICIES
-- ============================================================================

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins can update all profiles" ON user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Programs policies
CREATE POLICY "Everyone can view published programs" ON programs
    FOR SELECT USING (status = 'published');

CREATE POLICY "Admins and managers can view all programs" ON programs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins and managers can manage programs" ON programs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Classes policies
CREATE POLICY "Everyone can view classes of published programs" ON classes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM programs 
            WHERE id = program_id AND status = 'published'
        )
    );

CREATE POLICY "Admins and managers can manage classes" ON classes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Class trainers policies
CREATE POLICY "Everyone can view class trainers" ON class_trainers
    FOR SELECT USING (true);

CREATE POLICY "Admins and managers can manage class trainers" ON class_trainers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Participants policies
CREATE POLICY "Users can view their own participant record" ON participants
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own participant record" ON participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participant record" ON participants
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins and managers can manage all participants" ON participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Enrollments policies
CREATE POLICY "Users can view their own enrollments" ON enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM participants 
            WHERE id = participant_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create enrollments" ON enrollments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM participants 
            WHERE id = participant_id AND user_id = auth.uid()
        ) AND
        EXISTS (
            SELECT 1 FROM programs 
            WHERE id = program_id AND status = 'published'
        )
    );

CREATE POLICY "Admins and managers can manage all enrollments" ON enrollments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Forum policies
CREATE POLICY "Users can view forum categories of enrolled programs" ON forum_categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments e
            JOIN participants p ON e.participant_id = p.id
            WHERE e.program_id = forum_categories.program_id 
            AND p.user_id = auth.uid()
            AND e.status = 'approved'
        )
    );

CREATE POLICY "Admins and managers can manage forum categories" ON forum_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Users can view threads of accessible categories" ON forum_threads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM forum_categories fc
            JOIN enrollments e ON fc.program_id = e.program_id
            JOIN participants p ON e.participant_id = p.id
            WHERE fc.id = forum_threads.category_id 
            AND p.user_id = auth.uid()
            AND e.status = 'approved'
        )
    );

CREATE POLICY "Users can create threads in accessible categories" ON forum_threads
    FOR INSERT WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (
            SELECT 1 FROM forum_categories fc
            JOIN enrollments e ON fc.program_id = e.program_id
            JOIN participants p ON e.participant_id = p.id
            WHERE fc.id = category_id 
            AND p.user_id = auth.uid()
            AND e.status = 'approved'
        )
    );

CREATE POLICY "Users can update their own threads" ON forum_threads
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can view replies of accessible threads" ON forum_replies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM forum_threads ft
            JOIN forum_categories fc ON ft.category_id = fc.id
            JOIN enrollments e ON fc.program_id = e.program_id
            JOIN participants p ON e.participant_id = p.id
            WHERE ft.id = forum_replies.thread_id 
            AND p.user_id = auth.uid()
            AND e.status = 'approved'
        )
    );

CREATE POLICY "Users can create replies in accessible threads" ON forum_replies
    FOR INSERT WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (
            SELECT 1 FROM forum_threads ft
            JOIN forum_categories fc ON ft.category_id = fc.id
            JOIN enrollments e ON fc.program_id = e.program_id
            JOIN participants p ON e.participant_id = p.id
            WHERE ft.id = thread_id 
            AND p.user_id = auth.uid()
            AND e.status = 'approved'
        )
    );

CREATE POLICY "Users can update their own replies" ON forum_replies
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can manage reactions on accessible content" ON forum_reactions
    FOR ALL USING (
        auth.uid() = user_id AND
        (
            (thread_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM forum_threads ft
                JOIN forum_categories fc ON ft.category_id = fc.id
                JOIN enrollments e ON fc.program_id = e.program_id
                JOIN participants p ON e.participant_id = p.id
                WHERE ft.id = forum_reactions.thread_id 
                AND p.user_id = auth.uid()
                AND e.status = 'approved'
            )) OR
            (reply_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM forum_replies fr
                JOIN forum_threads ft ON fr.thread_id = ft.id
                JOIN forum_categories fc ON ft.category_id = fc.id
                JOIN enrollments e ON fc.program_id = e.program_id
                JOIN participants p ON e.participant_id = p.id
                WHERE fr.id = forum_reactions.reply_id 
                AND p.user_id = auth.uid()
                AND e.status = 'approved'
            ))
        )
    );

-- ============================================================================
-- STEP 10: CREATE STORAGE BUCKET AND POLICIES
-- ============================================================================

-- Create payment-proofs storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'payment-proofs',
    'payment-proofs',
    false,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment proofs
CREATE POLICY "Users can upload their own payment proofs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'payment-proofs' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own payment proofs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'payment-proofs' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Admins and managers can view all payment proofs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'payment-proofs' AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'manager')
        )
    );

-- ============================================================================
-- STEP 11: CREATE SAMPLE DATA
-- ============================================================================

-- Insert sample admin user (you'll need to create this user in auth.users first)
-- Note: Replace 'your-admin-user-id' with actual UUID from auth.users
/*
INSERT INTO user_profiles (id, email, full_name, role, is_active) VALUES
('your-admin-user-id', 'admin@garudaacademy.com', 'Admin Garuda Academy', 'admin', true)
ON CONFLICT (id) DO NOTHING;
*/

-- Insert sample programs
INSERT INTO programs (id, title, description, category, price, start_date, end_date, max_participants, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'AI & Machine Learning Fundamentals', 'Pelatihan dasar AI dan Machine Learning untuk pemula', 'Technology', 2500000, '2024-02-01', '2024-02-28', 30, 'published'),
('550e8400-e29b-41d4-a716-446655440002', 'Digital Marketing Strategy', 'Strategi pemasaran digital untuk bisnis modern', 'Marketing', 1500000, '2024-03-01', '2024-03-15', 25, 'published'),
('550e8400-e29b-41d4-a716-446655440003', 'Data Science & Analytics', 'Analisis data dan ilmu data untuk pengambilan keputusan', 'Technology', 3000000, '2024-04-01', '2024-04-30', 20, 'published'),
('550e8400-e29b-41d4-a716-446655440004', 'Leadership & Management', 'Kepemimpinan dan manajemen tim yang efektif', 'Leadership', 2000000, '2024-05-01', '2024-05-20', 15, 'published'),
('550e8400-e29b-41d4-a716-446655440005', 'Web Development Bootcamp', 'Bootcamp pengembangan web full-stack', 'Technology', 4000000, '2024-06-01', '2024-06-30', 35, 'published')
ON CONFLICT (id) DO NOTHING;

-- Insert sample classes for programs
INSERT INTO classes (id, program_id, name, description, start_date, end_date, start_time, end_time, max_participants, location, room) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Kelas Pagi - AI Fundamentals', 'Kelas pagi untuk pemula AI', '2024-02-01', '2024-02-28', '09:00:00', '12:00:00', 15, 'Garuda Academy', 'Room A-101'),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Kelas Sore - AI Fundamentals', 'Kelas sore untuk pemula AI', '2024-02-01', '2024-02-28', '13:00:00', '16:00:00', 15, 'Garuda Academy', 'Room A-102'),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Digital Marketing Intensive', 'Kelas intensif digital marketing', '2024-03-01', '2024-03-15', '09:00:00', '17:00:00', 25, 'Garuda Academy', 'Room B-201'),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'Data Science Workshop', 'Workshop data science hands-on', '2024-04-01', '2024-04-30', '10:00:00', '15:00:00', 20, 'Garuda Academy', 'Room C-301'),
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'Leadership Masterclass', 'Masterclass kepemimpinan', '2024-05-01', '2024-05-20', '09:00:00', '16:00:00', 15, 'Garuda Academy', 'Room D-401')
ON CONFLICT (id) DO NOTHING;

-- Insert sample forum categories
INSERT INTO forum_categories (id, program_id, name, description, order_index) VALUES
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'General Discussion', 'Diskusi umum tentang AI & Machine Learning', 1),
('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Assignments & Projects', 'Pembahasan tugas dan proyek', 2),
('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Q&A', 'Tanya jawab seputar materi', 3),
('750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'General Discussion', 'Diskusi umum tentang Digital Marketing', 1),
('750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Case Studies', 'Studi kasus digital marketing', 2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 12: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to create enrollment
CREATE OR REPLACE FUNCTION create_enrollment(
    p_program_id UUID,
    p_participant_id UUID,
    p_class_id UUID DEFAULT NULL,
    p_payment_proof_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    enrollment_id UUID;
    program_price DECIMAL(10,2);
    program_status program_status;
BEGIN
    -- Check if program exists and is published
    SELECT price, status INTO program_price, program_status
    FROM programs 
    WHERE id = p_program_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Program not found';
    END IF;
    
    IF program_status != 'published' THEN
        RAISE EXCEPTION 'Program is not published';
    END IF;
    
    -- Check if participant exists
    IF NOT EXISTS (SELECT 1 FROM participants WHERE id = p_participant_id) THEN
        RAISE EXCEPTION 'Participant not found';
    END IF;
    
    -- Check if already enrolled
    IF EXISTS (SELECT 1 FROM enrollments WHERE program_id = p_program_id AND participant_id = p_participant_id) THEN
        RAISE EXCEPTION 'Already enrolled in this program';
    END IF;
    
    -- Create enrollment
    INSERT INTO enrollments (program_id, class_id, participant_id, payment_proof_url, status, payment_status)
    VALUES (
        p_program_id, 
        p_class_id, 
        p_participant_id, 
        p_payment_proof_url,
        CASE WHEN program_price = 0 THEN 'approved' ELSE 'pending' END,
        CASE WHEN program_price = 0 THEN 'paid' ELSE 'unpaid' END
    )
    RETURNING id INTO enrollment_id;
    
    -- Update program participant count
    UPDATE programs 
    SET current_participants = current_participants + 1 
    WHERE id = p_program_id;
    
    -- Update class participant count if class specified
    IF p_class_id IS NOT NULL THEN
        UPDATE classes 
        SET current_participants = current_participants + 1 
        WHERE id = p_class_id;
    END IF;
    
    RETURN enrollment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user enrollment status
CREATE OR REPLACE FUNCTION get_user_enrollment_status(p_user_id UUID, p_program_id UUID)
RETURNS enrollment_status AS $$
DECLARE
    enrollment_status enrollment_status;
BEGIN
    SELECT e.status INTO enrollment_status
    FROM enrollments e
    JOIN participants p ON e.participant_id = p.id
    WHERE p.user_id = p_user_id AND e.program_id = p_program_id;
    
    RETURN COALESCE(enrollment_status, NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 13: VERIFICATION QUERIES
-- ============================================================================

-- Verify all tables exist
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'user_profiles', 'programs', 'classes', 'class_trainers', 
    'participants', 'enrollments', 'forum_categories', 
    'forum_threads', 'forum_replies', 'forum_reactions'
)
ORDER BY tablename;

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'user_profiles', 'programs', 'classes', 'class_trainers', 
    'participants', 'enrollments', 'forum_categories', 
    'forum_threads', 'forum_replies', 'forum_reactions'
)
ORDER BY tablename;

-- Verify storage bucket exists
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE id = 'payment-proofs';

-- Verify sample data
SELECT 'Programs' as table_name, COUNT(*) as count FROM programs
UNION ALL
SELECT 'Classes', COUNT(*) FROM classes
UNION ALL
SELECT 'Forum Categories', COUNT(*) FROM forum_categories;

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================
-- 
-- Your Supabase self-hosting instance is now ready!
-- 
-- Next steps:
-- 1. Update your .env.local with new Supabase URL and keys
-- 2. Create your first admin user in auth.users
-- 3. Update the admin user profile in user_profiles table
-- 4. Test the application with the new instance
-- 
-- ============================================================================
