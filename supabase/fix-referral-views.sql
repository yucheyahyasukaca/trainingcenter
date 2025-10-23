-- Fix Referral Views
-- Script ini untuk memperbaiki view yang mungkin belum dibuat

-- Drop views if they exist
DROP VIEW IF EXISTS trainer_referral_stats CASCADE;
DROP VIEW IF EXISTS program_referral_stats CASCADE;

-- Recreate trainer_referral_stats view
CREATE VIEW trainer_referral_stats AS
SELECT 
    up.id as trainer_id,
    up.full_name as trainer_name,
    up.email as trainer_email,
    COUNT(rt.id) as total_referrals,
    COUNT(CASE WHEN rt.status = 'confirmed' THEN 1 END) as confirmed_referrals,
    COUNT(CASE WHEN rt.status = 'pending' THEN 1 END) as pending_referrals,
    COUNT(CASE WHEN rt.status = 'cancelled' THEN 1 END) as cancelled_referrals,
    COALESCE(SUM(rt.commission_earned), 0) as total_commission_earned,
    COALESCE(SUM(CASE WHEN rt.status = 'confirmed' THEN rt.commission_earned ELSE 0 END), 0) as confirmed_commission,
    COALESCE(SUM(rt.discount_applied), 0) as total_discount_given,
    COUNT(DISTINCT rc.id) as total_referral_codes,
    COUNT(DISTINCT CASE WHEN rc.is_active = true THEN rc.id END) as active_referral_codes
FROM user_profiles up
LEFT JOIN referral_codes rc ON up.id = rc.trainer_id
LEFT JOIN referral_tracking rt ON rc.id = rt.referral_code_id
WHERE up.role = 'trainer'
GROUP BY up.id, up.full_name, up.email;

-- Recreate program_referral_stats view
CREATE VIEW program_referral_stats AS
SELECT 
    p.id as program_id,
    p.title as program_title,
    p.price as program_price,
    COUNT(rt.id) as total_referrals,
    COUNT(CASE WHEN rt.status = 'confirmed' THEN 1 END) as confirmed_referrals,
    COALESCE(SUM(rt.discount_applied), 0) as total_discount_given,
    COALESCE(SUM(rt.commission_earned), 0) as total_commission_paid,
    COALESCE(AVG(rt.discount_applied), 0) as avg_discount_per_referral
FROM programs p
LEFT JOIN referral_tracking rt ON p.id = rt.program_id
GROUP BY p.id, p.title, p.price;

-- Grant permissions
GRANT SELECT ON trainer_referral_stats TO authenticated;
GRANT SELECT ON program_referral_stats TO authenticated;

-- Test the views
SELECT 'trainer_referral_stats created successfully' as status;
SELECT 'program_referral_stats created successfully' as status;
