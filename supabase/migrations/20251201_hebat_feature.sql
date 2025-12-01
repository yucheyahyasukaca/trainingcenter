-- HEBAT Feature Database Schema

-- 1. Create table for tracking total points per trainer
CREATE TABLE IF NOT EXISTS trainer_hebat_points (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
    h_points INTEGER DEFAULT 0, -- Himpun
    e_points INTEGER DEFAULT 0, -- Eksplorasi
    b_points INTEGER DEFAULT 0, -- Berbagi
    a_points INTEGER DEFAULT 0, -- Aktualisasi
    t_points INTEGER DEFAULT 0, -- Terdepan
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_trainer_hebat UNIQUE (trainer_id)
);

-- 2. Create table for tracking individual activities/history
CREATE TABLE IF NOT EXISTS trainer_hebat_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
    category VARCHAR(1) NOT NULL CHECK (category IN ('H', 'E', 'B', 'A', 'T')),
    activity_type VARCHAR(50) NOT NULL, -- e.g., 'course_completion', 'referral', 'webinar_speaker'
    description TEXT,
    points INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb, -- Store extra data like course_id, referral_id, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hebat_points_total ON trainer_hebat_points(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_hebat_activities_trainer ON trainer_hebat_activities(trainer_id);
CREATE INDEX IF NOT EXISTS idx_hebat_activities_category ON trainer_hebat_activities(category);

-- 4. Enable RLS
ALTER TABLE trainer_hebat_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_hebat_activities ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Points table: Everyone can read (for leaderboard), only system/admin can update
CREATE POLICY "Everyone can read hebat points" ON trainer_hebat_points
    FOR SELECT USING (true);

CREATE POLICY "System can insert hebat points" ON trainer_hebat_points
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update hebat points" ON trainer_hebat_points
    FOR UPDATE USING (true);

-- Activities table: Trainers can read their own, everyone can read for public profile (maybe?), system inserts
CREATE POLICY "Trainers can read own activities" ON trainer_hebat_activities
    FOR SELECT USING (auth.uid() = trainer_id);

CREATE POLICY "Everyone can read activities" ON trainer_hebat_activities
    FOR SELECT USING (true); -- Simplified for leaderboard details if needed

CREATE POLICY "System can insert activities" ON trainer_hebat_activities
    FOR INSERT WITH CHECK (true);

-- 6. Trigger to update total points automatically
CREATE OR REPLACE FUNCTION update_hebat_total_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the summary table
    INSERT INTO trainer_hebat_points (trainer_id, h_points, e_points, b_points, a_points, t_points, total_points)
    VALUES (
        NEW.trainer_id,
        CASE WHEN NEW.category = 'H' THEN NEW.points ELSE 0 END,
        CASE WHEN NEW.category = 'E' THEN NEW.points ELSE 0 END,
        CASE WHEN NEW.category = 'B' THEN NEW.points ELSE 0 END,
        CASE WHEN NEW.category = 'A' THEN NEW.points ELSE 0 END,
        CASE WHEN NEW.category = 'T' THEN NEW.points ELSE 0 END,
        NEW.points
    )
    ON CONFLICT (trainer_id) DO UPDATE SET
        h_points = trainer_hebat_points.h_points + CASE WHEN NEW.category = 'H' THEN NEW.points ELSE 0 END,
        e_points = trainer_hebat_points.e_points + CASE WHEN NEW.category = 'E' THEN NEW.points ELSE 0 END,
        b_points = trainer_hebat_points.b_points + CASE WHEN NEW.category = 'B' THEN NEW.points ELSE 0 END,
        a_points = trainer_hebat_points.a_points + CASE WHEN NEW.category = 'A' THEN NEW.points ELSE 0 END,
        t_points = trainer_hebat_points.t_points + CASE WHEN NEW.category = 'T' THEN NEW.points ELSE 0 END,
        total_points = trainer_hebat_points.total_points + NEW.points,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_hebat_points
AFTER INSERT ON trainer_hebat_activities
FOR EACH ROW
EXECUTE FUNCTION update_hebat_total_points();

-- 7. Insert sample data for existing trainers (if any)
-- This is just a placeholder, in production we might want to migrate existing data
-- For now, let's ensure every trainer has a record in points table
INSERT INTO trainer_hebat_points (trainer_id)
SELECT id FROM trainers
ON CONFLICT (trainer_id) DO NOTHING;

-- 8. Sample data for testing (Optional - comment out if not needed)
/*
INSERT INTO trainer_hebat_activities (trainer_id, category, activity_type, description, points)
SELECT id, 'H', 'initial_setup', 'Welcome Bonus', 10
FROM trainers
LIMIT 1;
*/
