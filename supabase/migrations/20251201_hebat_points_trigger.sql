-- Function to award points when a submission is created
CREATE OR REPLACE FUNCTION process_hebat_submission_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into activities (which triggers the total points update)
    INSERT INTO trainer_hebat_activities (
        trainer_id,
        category,
        activity_type,
        description,
        points,
        metadata
    )
    VALUES (
        NEW.trainer_id,
        'E', -- Eksplorasi
        'submission',
        'Laporan Kegiatan Eksplorasi',
        20, -- 20 points per submission
        jsonb_build_object('submission_id', NEW.id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on hebat_submissions
DROP TRIGGER IF EXISTS trigger_hebat_submission_points ON hebat_submissions;
CREATE TRIGGER trigger_hebat_submission_points
AFTER INSERT ON hebat_submissions
FOR EACH ROW
EXECUTE FUNCTION process_hebat_submission_points();
