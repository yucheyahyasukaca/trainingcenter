-- Create student_training_submissions table
CREATE TABLE IF NOT EXISTS student_training_submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
    training_date DATE NOT NULL,
    student_count INTEGER NOT NULL,
    topic TEXT NOT NULL,
    duration_hours NUMERIC(4, 1) NOT NULL,
    training_format VARCHAR(20) CHECK (training_format IN ('daring', 'luring', 'hybrid')),
    documentation_url TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE student_training_submissions ENABLE ROW LEVEL SECURITY;

-- Policies
-- Trainers can view their own submissions
DROP POLICY IF EXISTS "Trainers can view own student submissions" ON student_training_submissions;
CREATE POLICY "Trainers can view own student submissions" ON student_training_submissions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM trainers
            WHERE trainers.id = student_training_submissions.trainer_id
            AND trainers.user_id = auth.uid()
        )
    );

-- Trainers can insert their own submissions
DROP POLICY IF EXISTS "Trainers can insert own student submissions" ON student_training_submissions;
CREATE POLICY "Trainers can insert own student submissions" ON student_training_submissions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainers
            WHERE trainers.id = trainer_id
            AND trainers.user_id = auth.uid()
        )
    );

-- Admins can view all
DROP POLICY IF EXISTS "Admins can view all student submissions" ON student_training_submissions;
CREATE POLICY "Admins can view all student submissions" ON student_training_submissions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
        )
    );

-- Admins can update (approve/reject)
DROP POLICY IF EXISTS "Admins can update student submissions" ON student_training_submissions;
CREATE POLICY "Admins can update student submissions" ON student_training_submissions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
        )
    );

-- Storage bucket for student training evidence
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-training-evidence', 'student-training-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Public read student evidence" ON storage.objects;
CREATE POLICY "Public read student evidence"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'student-training-evidence');

DROP POLICY IF EXISTS "Authenticated upload student evidence" ON storage.objects;
CREATE POLICY "Authenticated upload student evidence"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'student-training-evidence');

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_student_submissions_updated_at ON student_training_submissions;
CREATE TRIGGER update_student_submissions_updated_at
    BEFORE UPDATE ON student_training_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
