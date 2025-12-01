-- Create hebat_submissions table
CREATE TABLE IF NOT EXISTS hebat_submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
    category VARCHAR(1) DEFAULT 'E', -- 'E' for Eksplorasi
    focus TEXT NOT NULL, -- 'A' (Class) or 'B' (Teachers)
    story TEXT NOT NULL,
    solution TEXT NOT NULL,
    documentation_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE hebat_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for hebat_submissions
-- Trainers can view their own submissions
DROP POLICY IF EXISTS "Trainers can view own submissions" ON hebat_submissions;
CREATE POLICY "Trainers can view own submissions" ON hebat_submissions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM trainers
            WHERE trainers.id = hebat_submissions.trainer_id
            AND trainers.user_id = auth.uid()
        )
    );

-- Trainers can insert their own submissions
DROP POLICY IF EXISTS "Trainers can insert own submissions" ON hebat_submissions;
CREATE POLICY "Trainers can insert own submissions" ON hebat_submissions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainers
            WHERE trainers.id = trainer_id
            AND trainers.user_id = auth.uid()
        )
    );

-- Trainers can update their own submissions if pending
DROP POLICY IF EXISTS "Trainers can update own pending submissions" ON hebat_submissions;
CREATE POLICY "Trainers can update own pending submissions" ON hebat_submissions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM trainers
            WHERE trainers.id = hebat_submissions.trainer_id
            AND trainers.user_id = auth.uid()
        )
        AND status = 'pending'
    );

-- Admins can view all submissions
DROP POLICY IF EXISTS "Admins can view all submissions" ON hebat_submissions;
CREATE POLICY "Admins can view all submissions" ON hebat_submissions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
        )
    );

-- Admins can update submissions (approve/reject)
DROP POLICY IF EXISTS "Admins can update submissions" ON hebat_submissions;
CREATE POLICY "Admins can update submissions" ON hebat_submissions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
        )
    );

-- Storage bucket for HEBAT submissions
INSERT INTO storage.buckets (id, name, public)
VALUES ('hebat-submissions', 'hebat-submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read on hebat-submissions (for admin review)
DROP POLICY IF EXISTS "Public read hebat submissions" ON storage.objects;
CREATE POLICY "Public read hebat submissions"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'hebat-submissions');

-- Allow authenticated upload (trainers)
DROP POLICY IF EXISTS "Authenticated upload hebat submissions" ON storage.objects;
CREATE POLICY "Authenticated upload hebat submissions"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'hebat-submissions');

-- Allow authenticated update own assets
DROP POLICY IF EXISTS "Authenticated update own hebat submissions" ON storage.objects;
CREATE POLICY "Authenticated update own hebat submissions"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'hebat-submissions');

-- Allow authenticated delete own assets
DROP POLICY IF EXISTS "Authenticated delete own hebat submissions" ON storage.objects;
CREATE POLICY "Authenticated delete own hebat submissions"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'hebat-submissions');

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_hebat_submissions_updated_at ON hebat_submissions;
CREATE TRIGGER update_hebat_submissions_updated_at
    BEFORE UPDATE ON hebat_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
