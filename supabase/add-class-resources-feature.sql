-- ============================================================================
-- ADD CLASS RESOURCES FEATURE
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- This script adds:
-- 1. Module URL field to classes table (for Google Drive/OneDrive links)
-- 2. Face-to-face sessions table (for Zoom/Google Meet/Teams links)
-- 3. Session recordings table (for recorded sessions)
-- ============================================================================

-- ============================================================================
-- STEP 1: ADD MODULE URL TO CLASSES TABLE
-- ============================================================================

ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS module_url TEXT;

COMMENT ON COLUMN classes.module_url IS 'URL to training module files (Google Drive or Microsoft OneDrive)';

-- ============================================================================
-- STEP 2: CREATE FACE-TO-FACE SESSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS face_to_face_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    meeting_platform VARCHAR(50) NOT NULL CHECK (meeting_platform IN ('zoom', 'google_meet', 'microsoft_teams', 'other')),
    meeting_link TEXT NOT NULL,
    meeting_id VARCHAR(255),
    meeting_password VARCHAR(255),
    is_required BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
    created_by UUID REFERENCES auth.users(id),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_face_to_face_sessions_class_id ON face_to_face_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_face_to_face_sessions_date ON face_to_face_sessions(session_date, session_time);
CREATE INDEX IF NOT EXISTS idx_face_to_face_sessions_status ON face_to_face_sessions(status);

COMMENT ON TABLE face_to_face_sessions IS 'Face-to-face sessions for classes (Zoom, Google Meet, Microsoft Teams)';
COMMENT ON COLUMN face_to_face_sessions.is_required IS 'Whether attendance is mandatory for this session';

-- ============================================================================
-- STEP 3: CREATE SESSION RECORDINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS session_recordings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    session_id UUID REFERENCES face_to_face_sessions(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    recording_url TEXT NOT NULL,
    recording_type VARCHAR(50) DEFAULT 'video' CHECK (recording_type IN ('video', 'audio', 'transcript')),
    duration_minutes INTEGER,
    file_size_mb DECIMAL(10, 2),
    uploaded_by UUID REFERENCES auth.users(id),
    is_public BOOLEAN DEFAULT true,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_session_recordings_session_id ON session_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_session_recordings_public ON session_recordings(is_public);

COMMENT ON TABLE session_recordings IS 'Recordings of face-to-face sessions';
COMMENT ON COLUMN session_recordings.recording_url IS 'URL to the recording (can be Google Drive, OneDrive, YouTube, etc.)';

-- ============================================================================
-- STEP 4: ENABLE RLS (Row Level Security)
-- ============================================================================

-- Enable RLS on face_to_face_sessions
ALTER TABLE face_to_face_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view published sessions
CREATE POLICY "Anyone can view face-to-face sessions"
    ON face_to_face_sessions
    FOR SELECT
    USING (true);

-- Policy: Admins, managers, and assigned trainers can insert/update/delete
CREATE POLICY "Admins and trainers can manage face-to-face sessions"
    ON face_to_face_sessions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.role IN ('admin', 'manager')
        )
        OR EXISTS (
            SELECT 1 FROM class_trainers ct
            JOIN trainers t ON t.id = ct.trainer_id
            WHERE ct.class_id = face_to_face_sessions.class_id
            AND t.user_id = auth.uid()
        )
    );

-- Enable RLS on session_recordings
ALTER TABLE session_recordings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view public recordings
CREATE POLICY "Anyone can view public recordings"
    ON session_recordings
    FOR SELECT
    USING (is_public = true OR EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.role IN ('admin', 'manager', 'trainer')
    ));

-- Policy: Admins, managers, and assigned trainers can insert/update/delete
CREATE POLICY "Admins and trainers can manage recordings"
    ON session_recordings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.role IN ('admin', 'manager')
        )
        OR EXISTS (
            SELECT 1 FROM face_to_face_sessions f2f
            JOIN class_trainers ct ON ct.class_id = f2f.class_id
            JOIN trainers t ON t.id = ct.trainer_id
            WHERE f2f.id = session_recordings.session_id
            AND t.user_id = auth.uid()
        )
    );

-- ============================================================================
-- STEP 5: CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_face_to_face_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_face_to_face_sessions_updated_at
    BEFORE UPDATE ON face_to_face_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_face_to_face_sessions_updated_at();

CREATE OR REPLACE FUNCTION update_session_recordings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_recordings_updated_at
    BEFORE UPDATE ON session_recordings
    FOR EACH ROW
    EXECUTE FUNCTION update_session_recordings_updated_at();

-- ============================================================================
-- COMPLETED
-- ============================================================================

