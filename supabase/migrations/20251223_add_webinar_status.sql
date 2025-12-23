-- Add status column to webinars table
ALTER TABLE public.webinars 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft' 
CHECK (status IN ('draft', 'waiting_approval', 'published', 'rejected'));

-- Backfill status based on is_published for existing records
UPDATE public.webinars
SET status = CASE 
    WHEN is_published = true THEN 'published'
    ELSE 'draft'
END
WHERE status = 'draft' AND is_published IS NOT NULL;

-- Create trigger function to sync is_published with status
CREATE OR REPLACE FUNCTION public.sync_webinar_status_published()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'published' THEN
        NEW.is_published = true;
    ELSE
        NEW.is_published = false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_sync_webinar_status ON public.webinars;
CREATE TRIGGER trigger_sync_webinar_status
BEFORE INSERT OR UPDATE OF status ON public.webinars
FOR EACH ROW
EXECUTE FUNCTION public.sync_webinar_status_published();

-- Create trigger function to sync status from is_published (if is_published is updated directly)
CREATE OR REPLACE FUNCTION public.sync_webinar_published_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_published = true AND OLD.is_published = false AND NEW.status != 'published' THEN
        NEW.status = 'published';
    ELSIF NEW.is_published = false AND OLD.is_published = true AND NEW.status = 'published' THEN
        NEW.status = 'draft'; -- Default to draft if un-published via boolean
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reverse sync
DROP TRIGGER IF EXISTS trigger_sync_webinar_published ON public.webinars;
CREATE TRIGGER trigger_sync_webinar_published
BEFORE UPDATE OF is_published ON public.webinars
FOR EACH ROW
WHEN (pg_trigger_depth() = 0) -- Prevent recursion
EXECUTE FUNCTION public.sync_webinar_published_status();


-- Policies for Trainers
-- Trainers can view all published webinars (handled by existing policy likely, but let's verify/ensure)
-- Trainers can insert their own webinars
CREATE POLICY "Trainers can insert their own webinars"
ON public.webinars
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by 
  AND 
  (
    -- Check if user is a trainer (simple check via auth.jwt() -> app_metadata or checking public.users/profiles if needed)
    -- Assuming basic auth check is enough here, as created_by is forced to auth.uid() often
    -- Better: check if user exists in public.trainers or has role 'trainer' in profiles
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('trainer', 'admin', 'manager')
    )
  )
);

-- Trainers can update their own webinars if not published (or if they want to move to draft/waiting)
CREATE POLICY "Trainers can update their own webinars"
ON public.webinars
FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by 
  AND 
  -- Allow editing if it's their own. Status restrictions can be handled in UI or here.
  -- Let's allow full edit for now, but maybe restrict if 'published' ?
  -- For now, allow edit.
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role IN ('trainer', 'admin', 'manager')
  )
)
WITH CHECK (
  auth.uid() = created_by
);

-- Trainers can delete their own webinars
CREATE POLICY "Trainers can delete their own webinars"
ON public.webinars
FOR DELETE
TO authenticated
USING (
  auth.uid() = created_by
);

-- Ensure Admin policies cover everything (usually admins have bypass or broad policies)
-- Re-applying admin all access just in case
DROP POLICY IF EXISTS "Admins can do everything on webinars" ON public.webinars;
CREATE POLICY "Admins can do everything on webinars"
ON public.webinars
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
