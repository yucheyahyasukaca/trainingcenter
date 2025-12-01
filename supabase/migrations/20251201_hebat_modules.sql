-- Create hebat_modules table
CREATE TABLE IF NOT EXISTS hebat_modules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'HIMPUN',
    points INTEGER DEFAULT 0,
    duration_minutes INTEGER DEFAULT 0,
    image_url TEXT,
    content JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trainer_module_progress table
CREATE TABLE IF NOT EXISTS trainer_module_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
    module_id UUID REFERENCES hebat_modules(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'started', -- 'started', 'completed'
    progress INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trainer_id, module_id)
);

-- Enable RLS
ALTER TABLE hebat_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_module_progress ENABLE ROW LEVEL SECURITY;

-- Policies for hebat_modules
-- Admins can do everything
CREATE POLICY "Admins can do everything on hebat_modules" ON hebat_modules
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
        )
    );

-- Trainers can view published modules
CREATE POLICY "Trainers can view published modules" ON hebat_modules
    FOR SELECT
    USING (is_published = true);

-- Policies for trainer_module_progress
-- Trainers can view and update their own progress
CREATE POLICY "Trainers can view own progress" ON trainer_module_progress
    FOR SELECT
    USING (trainer_id = auth.uid());

CREATE POLICY "Trainers can update own progress" ON trainer_module_progress
    FOR INSERT
    WITH CHECK (trainer_id = auth.uid());

CREATE POLICY "Trainers can update own progress update" ON trainer_module_progress
    FOR UPDATE
    USING (trainer_id = auth.uid());

-- Admins can view all progress
CREATE POLICY "Admins can view all progress" ON trainer_module_progress
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
        )
    );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hebat_modules_updated_at
    BEFORE UPDATE ON hebat_modules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
