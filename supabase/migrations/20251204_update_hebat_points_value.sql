-- Update function to award 5 points instead of 20
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
        5, -- Updated to 5 points per submission
        jsonb_build_object('submission_id', NEW.id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
