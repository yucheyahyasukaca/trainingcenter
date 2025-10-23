-- Test query yang sama seperti di aplikasi untuk program Gemini
-- Ganti dengan ID program Gemini yang sebenarnya

-- 1. Cari ID program Gemini
SELECT id, title, status FROM programs WHERE title ILIKE '%gemini%' OR title ILIKE '%pendidik%';

-- 2. Test query classes untuk program Gemini (ganti dengan ID yang benar)
-- SELECT c.*, p.title as program_title 
-- FROM classes c 
-- JOIN programs p ON c.program_id = p.id 
-- WHERE c.program_id = 'GANTI_DENGAN_ID_PROGRAM_GEMINI';

-- 3. Test query dengan class_trainers
-- SELECT c.*, ct.*, t.name as trainer_name
-- FROM classes c
-- LEFT JOIN class_trainers ct ON c.id = ct.class_id
-- LEFT JOIN trainers t ON ct.trainer_id = t.id
-- WHERE c.program_id = 'GANTI_DENGAN_ID_PROGRAM_GEMINI';
