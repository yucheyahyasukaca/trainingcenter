-- 1. Drop the INSERT trigger
DROP TRIGGER IF EXISTS trigger_hebat_submission_points ON hebat_submissions;

-- 2. Create UPDATE trigger function
CREATE OR REPLACE FUNCTION process_hebat_submission_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Only award points if status changes to 'approved'
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
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
            NEW.category, -- Use the category from the submission (E or A)
            'submission_approved',
            CASE 
                WHEN NEW.category = 'E' THEN 'Laporan Eksplorasi Disetujui'
                WHEN NEW.category = 'A' THEN 'Laporan Aktualisasi Disetujui'
                ELSE 'Laporan HEBAT Disetujui'
            END,
            5, -- 5 points per approved submission
            jsonb_build_object('submission_id', NEW.id)
        );
    END IF;

    -- Optional: If status changes from 'approved' to something else, maybe deduct points?
    -- For now, let's keep it simple and only add points on approval.
    -- Deducting is complex because we need to find the specific activity record.

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create UPDATE trigger
CREATE TRIGGER trigger_hebat_submission_approval
AFTER UPDATE ON hebat_submissions
FOR EACH ROW
EXECUTE FUNCTION process_hebat_submission_approval();
