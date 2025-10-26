-- Check trainer names in database
SELECT id, name, email, status, avatar_url
FROM trainers
ORDER BY created_at DESC;
