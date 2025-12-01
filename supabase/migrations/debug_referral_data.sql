-- DEBUG SCRIPT: Check Trainer IDs and Referral Data
-- Run this in Supabase SQL Editor to understand the data relationships.

-- 1. Check a sample trainer and their IDs
SELECT 
    t.id as trainer_id_pk,
    t.user_id as trainer_user_id,
    p.email,
    p.full_name
FROM trainers t
JOIN user_profiles p ON t.user_id = p.id
LIMIT 5;

-- 2. Check trainer_hebat_points
-- See if the 'trainer_id' column matches 'trainer_id_pk' or 'trainer_user_id' from above
SELECT 
    thp.trainer_id,
    thp.b_points,
    t.user_id as linked_user_id_if_match_pk,
    p.email as linked_email_if_match_pk
FROM trainer_hebat_points thp
LEFT JOIN trainers t ON thp.trainer_id = t.id
LEFT JOIN user_profiles p ON t.user_id = p.id
LIMIT 5;

-- 3. Check referral_tracking
SELECT 
    rt.trainer_id,
    rt.status,
    t.user_id as linked_user_id_if_match_pk
FROM referral_tracking rt
LEFT JOIN trainers t ON rt.trainer_id = t.id
LIMIT 5;

-- 4. Check if trainer_hebat_points uses user_id directly
SELECT 
    thp.trainer_id,
    p.email as email_if_user_id
FROM trainer_hebat_points thp
JOIN user_profiles p ON thp.trainer_id = p.id
LIMIT 5;
