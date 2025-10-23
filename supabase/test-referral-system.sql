-- Test Referral System
-- Script ini untuk testing sistem referral setelah migration

-- ============================================================================
-- STEP 1: CREATE TEST TRAINER
-- ============================================================================

-- Insert test trainer (pastikan user sudah ada di auth.users)
INSERT INTO user_profiles (
    id,
    email,
    full_name,
    role,
    phone,
    is_active
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'trainer@test.com',
    'John Doe Trainer',
    'trainer',
    '081234567890',
    true
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone;

-- ============================================================================
-- STEP 2: CREATE TEST PROGRAM
-- ============================================================================

INSERT INTO programs (
    id,
    title,
    description,
    category,
    price,
    start_date,
    end_date,
    max_participants,
    status,
    trainer_id
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Test Program for Referral',
    'Program untuk testing sistem referral',
    'Technology',
    1000000,
    CURRENT_DATE + INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '60 days',
    50,
    'published',
    '11111111-1111-1111-1111-111111111111'
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    price = EXCLUDED.price;

-- ============================================================================
-- STEP 3: CREATE TEST REFERRAL CODES
-- ============================================================================

-- Create referral code dengan diskon 10% dan komisi 5%
SELECT create_trainer_referral_code(
    '11111111-1111-1111-1111-111111111111'::UUID,
    'Kode referral untuk program baru - Diskon 10%',
    100, -- max uses
    10,  -- discount percentage
    0,   -- discount amount
    5,   -- commission percentage
    0,   -- commission amount
    NULL -- valid until (no expiry)
);

-- Create referral code dengan diskon tetap Rp 100,000
SELECT create_trainer_referral_code(
    '11111111-1111-1111-1111-111111111111'::UUID,
    'Kode referral dengan diskon tetap',
    50,  -- max uses
    0,   -- discount percentage
    100000, -- discount amount
    0,   -- commission percentage
    50000, -- commission amount
    CURRENT_DATE + INTERVAL '90 days' -- valid until
);

-- ============================================================================
-- STEP 4: CREATE TEST PARTICIPANT
-- ============================================================================

INSERT INTO participants (
    id,
    user_id,
    name,
    email,
    phone,
    status
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    'Test Participant',
    'participant@test.com',
    '081234567891',
    'active'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email;

-- ============================================================================
-- STEP 5: TEST REFERRAL CODE APPLICATION
-- ============================================================================

-- Test apply referral code
SELECT * FROM apply_referral_code(
    'JOH001', -- kode referral pertama
    '22222222-2222-2222-2222-222222222222'::UUID, -- program id
    '33333333-3333-3333-3333-333333333333'::UUID  -- participant id
);

-- ============================================================================
-- STEP 6: CREATE TEST ENROLLMENT
-- ============================================================================

INSERT INTO enrollments (
    id,
    program_id,
    participant_id,
    status,
    payment_status,
    referral_code_id,
    referral_discount,
    final_price,
    notes
) VALUES (
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    'approved',
    'paid',
    (SELECT id FROM referral_codes WHERE code = 'JOH001' LIMIT 1),
    100000, -- discount applied
    900000, -- final price
    'Test enrollment dengan referral code'
);

-- ============================================================================
-- STEP 7: TRACK REFERRAL
-- ============================================================================

-- Track the referral
SELECT track_referral_enrollment(
    (SELECT id FROM referral_codes WHERE code = 'JOH001' LIMIT 1),
    '55555555-5555-5555-5555-555555555555'::UUID,
    100000, -- discount amount
    50000   -- commission amount
);

-- ============================================================================
-- STEP 8: VERIFY RESULTS
-- ============================================================================

-- Check referral codes
SELECT 
    code,
    description,
    is_active,
    current_uses,
    discount_percentage,
    commission_percentage
FROM referral_codes 
WHERE trainer_id = '11111111-1111-1111-1111-111111111111';

-- Check referral tracking
SELECT 
    rt.status,
    rt.discount_applied,
    rt.commission_earned,
    p.title as program_title,
    pt.name as participant_name
FROM referral_tracking rt
JOIN programs p ON rt.program_id = p.id
JOIN participants pt ON rt.participant_id = pt.id
WHERE rt.trainer_id = '11111111-1111-1111-1111-111111111111';

-- Check trainer stats
SELECT * FROM trainer_referral_stats 
WHERE trainer_id = '11111111-1111-1111-1111-111111111111';

-- Check program stats
SELECT * FROM program_referral_stats 
WHERE program_id = '22222222-2222-2222-2222-222222222222';

-- ============================================================================
-- STEP 9: TEST API ENDPOINTS (Manual Testing)
-- ============================================================================

/*
Test these endpoints manually:

1. GET /api/referral/codes
   - Should return referral codes for trainer

2. GET /api/referral/apply?code=JOH001&program_id=22222222-2222-2222-2222-222222222222
   - Should return referral code details

3. GET /api/referral/stats
   - Should return trainer statistics

4. POST /api/referral/codes
   - Should create new referral code

5. PUT /api/referral/codes
   - Should update referral code

6. DELETE /api/referral/codes?id={id}
   - Should delete referral code
*/

-- ============================================================================
-- CLEANUP (Optional)
-- ============================================================================

/*
-- Uncomment to clean up test data

DELETE FROM referral_tracking WHERE trainer_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM referral_codes WHERE trainer_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM enrollments WHERE id = '55555555-5555-5555-5555-555555555555';
DELETE FROM participants WHERE id = '33333333-3333-3333-3333-333333333333';
DELETE FROM programs WHERE id = '22222222-2222-2222-2222-222222222222';
DELETE FROM user_profiles WHERE id = '11111111-1111-1111-1111-111111111111';
*/

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Referral system test completed successfully!';
    RAISE NOTICE '📊 Test data created:';
    RAISE NOTICE '   • Test trainer: John Doe Trainer';
    RAISE NOTICE '   • Test program: Test Program for Referral';
    RAISE NOTICE '   • Test participant: Test Participant';
    RAISE NOTICE '   • 2 referral codes created';
    RAISE NOTICE '   • 1 test enrollment with referral';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next steps:';
    RAISE NOTICE '   1. Test the API endpoints';
    RAISE NOTICE '   2. Test the UI components';
    RAISE NOTICE '   3. Verify the dashboard';
    RAISE NOTICE '   4. Clean up test data if needed';
END $$;
