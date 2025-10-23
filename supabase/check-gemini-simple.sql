-- Simple check for Gemini program and its classes
SELECT 
    p.id as program_id,
    p.title as program_title,
    p.status as program_status,
    COUNT(c.id) as class_count
FROM programs p
LEFT JOIN classes c ON p.id = c.program_id
WHERE p.title ILIKE '%gemini%'
GROUP BY p.id, p.title, p.status;

-- Check classes for Gemini program
SELECT 
    c.id as class_id,
    c.name as class_name,
    c.status as class_status,
    c.start_date,
    c.end_date,
    p.title as program_title
FROM classes c
JOIN programs p ON c.program_id = p.id
WHERE p.title ILIKE '%gemini%'
ORDER BY c.created_at DESC;
