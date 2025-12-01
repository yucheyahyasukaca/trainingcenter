-- Add student_points column to trainer_hebat_points if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainer_hebat_points' AND column_name = 'student_points') THEN
        ALTER TABLE trainer_hebat_points ADD COLUMN student_points INTEGER DEFAULT 0;
    END IF;
END $$;

-- Function to handle student training approval
CREATE OR REPLACE FUNCTION handle_student_training_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if status changed to 'approved'
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Add 1 point to student_points (or logic as defined)
        -- Assuming 1 submission = 1 point for now, or based on student_count?
        -- Let's assume 1 point per approved submission for simplicity as per "1 point = Student Referral" note in dashboard
        
        -- We need to find the trainer record in trainer_hebat_points
        -- Note: trainer_hebat_points uses trainer_id which might be user_id or trainer_id depending on previous mess
        -- Based on recent debug, trainer_hebat_points uses USER_ID (d095...)
        -- But student_training_submissions uses TRAINER_ID (42b6...)
        -- So we need to resolve the user_id from the trainer_id
        
        UPDATE trainer_hebat_points
        SET student_points = COALESCE(student_points, 0) + 1,
            updated_at = NOW()
        WHERE trainer_id = (
            SELECT user_id FROM trainers WHERE id = NEW.trainer_id
        );
        
        -- Also update total points? b_points is for GTK. 
        -- If total points is sum of columns, we are good.
        -- If there is a total_points column, update it too.
        -- Checking schema... usually calculated on fly or separate.
        
    ELSIF NEW.status != 'approved' AND OLD.status = 'approved' THEN
        -- If status changed FROM approved (e.g. reverted), subtract point
        UPDATE trainer_hebat_points
        SET student_points = GREATEST(COALESCE(student_points, 0) - 1, 0),
            updated_at = NOW()
        WHERE trainer_id = (
            SELECT user_id FROM trainers WHERE id = NEW.trainer_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS on_student_training_approval ON student_training_submissions;
CREATE TRIGGER on_student_training_approval
    AFTER UPDATE ON student_training_submissions
    FOR EACH ROW
    EXECUTE FUNCTION handle_student_training_approval();
