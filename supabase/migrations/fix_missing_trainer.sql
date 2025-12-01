-- Insert missing trainer record for the current user
-- ID: 42b63c7d-40fa-4b23-9be2-55b4dad1d97c
-- This is required because the points system relies on the trainers table

INSERT INTO trainers (
    id,
    name,
    email,
    phone,
    specialization,
    experience_years,
    created_at,
    updated_at
)
VALUES (
    '42b63c7d-40fa-4b23-9be2-55b4dad1d97c',
    'Trainer (System Fixed)', -- Placeholder name
    'fixed_trainer@example.com', -- Placeholder email
    '-',
    'General',
    0,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;
