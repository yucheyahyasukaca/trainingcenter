-- Enforce Uniqueness for Program Registrations

-- 1. Ensure 1 User = 1 Participant Profile
-- We already have UNIQUE(email), but we should also enforce UNIQUE(user_id)
-- This prevents a user from having multiple participant profiles (which would allow multiple enrollments)

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'participants_user_id_key'
    ) THEN
        ALTER TABLE participants ADD CONSTRAINT participants_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 2. Ensure 1 Participant = 1 Enrollment per Program
-- This prevents a participant from enrolling in the same program multiple times

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'enrollments_participant_program_key'
    ) THEN
        -- Cleanup duplicates first
        -- Keep the "best" record: Completed > Approved > Pending > Others, then Newest
        WITH duplicates AS (
            SELECT id,
                   ROW_NUMBER() OVER (
                       PARTITION BY participant_id, program_id 
                       ORDER BY 
                           CASE status 
                               WHEN 'completed' THEN 1 
                               WHEN 'approved' THEN 2 
                               WHEN 'pending' THEN 3 
                               ELSE 4 
                           END ASC,
                           created_at DESC
                   ) as rn
            FROM enrollments
        )
        DELETE FROM enrollments
        WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

        -- Now add the constraint
        ALTER TABLE enrollments ADD CONSTRAINT enrollments_participant_program_key UNIQUE (participant_id, program_id);
    END IF;
END $$;
