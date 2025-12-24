-- Check columns in referral_codes table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'referral_codes';
