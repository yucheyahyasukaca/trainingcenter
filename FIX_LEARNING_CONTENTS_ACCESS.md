# Fix: Learning Contents Not Showing for Enrolled Users

## Problem
When logged in as a user role, only 2 out of 6 learning materials were displayed on the materials list page ("Daftar Materi"), even though all 6 materials should have been visible.

## Root Cause
The issue was in the Row Level Security (RLS) policy for the `learning_contents` table. The policy was incorrectly checking enrollment by comparing `e.participant_id = auth.uid()`, but:

- `participant_id` in the `enrollments` table references the `participants` table (not users directly)
- The actual `user_id` is stored in the `participants` table
- The policy needed to join through the `participants` table to correctly match the authenticated user

### Incorrect Policy (Before):
```sql
OR EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.classes c ON e.class_id = c.id
    WHERE c.id = learning_contents.class_id
    AND e.participant_id = auth.uid()  -- ❌ WRONG: participant_id ≠ user_id
    AND e.status = 'approved'
)
```

### Correct Policy (After):
```sql
OR EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.participants p ON e.participant_id = p.id  -- ✅ Join through participants
    JOIN public.classes c ON e.class_id = c.id
    WHERE c.id = learning_contents.class_id
    AND p.user_id = auth.uid()  -- ✅ Use user_id from participants table
    AND e.status = 'approved'
)
```

## Solution
1. Created fix file: `supabase/fix-learning-contents-rls.sql`
2. Updated main SQL files to prevent future issues:
   - `supabase/create-learning-content-system.sql`
   - `supabase/step2-create-learning-contents-policies.sql`

## How to Apply the Fix

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/fix-learning-contents-rls.sql`
4. Run the SQL query

### Option 2: Using Supabase CLI
```bash
supabase db execute -f supabase/fix-learning-contents-rls.sql
```

## Testing
After applying the fix:
1. Log in as a user with approved enrollment
2. Navigate to the learning materials page
3. All 6 materials should now be visible
4. Verify that locked materials show "Terkunci" (Locked) status
5. Verify that unlocked materials are accessible

## Files Modified
- ✅ `supabase/fix-learning-contents-rls.sql` (created)
- ✅ `supabase/create-learning-content-system.sql` (updated)
- ✅ `supabase/step2-create-learning-contents-policies.sql` (updated)

## Notes
- This fix only affects the SELECT policy (reading learning contents)
- INSERT, UPDATE, DELETE policies remain unchanged
- The fix maintains all existing security checks while ensuring correct user identification

