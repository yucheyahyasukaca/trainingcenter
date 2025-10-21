-- Fix progress to 100% for completed main materials
-- This script will mark all sub-materials as completed when their parent main material is completed

-- First, let's see what we have
SELECT 
  c.id,
  c.title,
  c.material_type,
  c.parent_id,
  lp.status,
  lp.progress_percentage
FROM learning_contents c
LEFT JOIN learning_progress lp ON c.id = lp.content_id
ORDER BY c.order_index;

-- Update sub-materials to completed if their parent main material is completed
UPDATE learning_progress 
SET 
  status = 'completed',
  progress_percentage = 100,
  completed_at = NOW()
WHERE content_id IN (
  SELECT sub.id 
  FROM learning_contents sub
  JOIN learning_contents main ON sub.parent_id = main.id
  JOIN learning_progress main_progress ON main.id = main_progress.content_id
  WHERE main_progress.status = 'completed'
  AND sub.material_type = 'sub'
  AND (sub.id NOT IN (SELECT content_id FROM learning_progress WHERE content_id = sub.id) 
       OR (SELECT status FROM learning_progress WHERE content_id = sub.id) != 'completed')
);

-- Insert missing progress records for sub-materials whose parents are completed
INSERT INTO learning_progress (user_id, content_id, enrollment_id, status, progress_percentage, completed_at)
SELECT DISTINCT
  main_progress.user_id,
  sub.id as content_id,
  main_progress.enrollment_id,
  'completed' as status,
  100 as progress_percentage,
  NOW() as completed_at
FROM learning_contents sub
JOIN learning_contents main ON sub.parent_id = main.id
JOIN learning_progress main_progress ON main.id = main_progress.content_id
WHERE main_progress.status = 'completed'
AND sub.material_type = 'sub'
AND sub.id NOT IN (SELECT content_id FROM learning_progress WHERE content_id = sub.id)
ON CONFLICT (user_id, content_id) DO UPDATE SET
  status = 'completed',
  progress_percentage = 100,
  completed_at = NOW();

-- Verify the results
SELECT 
  c.id,
  c.title,
  c.material_type,
  c.parent_id,
  lp.status,
  lp.progress_percentage,
  lp.completed_at
FROM learning_contents c
LEFT JOIN learning_progress lp ON c.id = lp.content_id
ORDER BY c.order_index;
