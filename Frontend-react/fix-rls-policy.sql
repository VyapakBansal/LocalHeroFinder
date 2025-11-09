-- ============================================
-- Fix RLS Policy for user_roles INSERT
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop the conflicting "Admins can manage all roles" policy if it exists
-- We'll recreate it to be more specific
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Ensure the insert policy exists and is correct
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
CREATE POLICY "Users can insert their own roles"
ON public.user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Recreate the admin policy but make it more specific to avoid conflicts
-- Admins can do everything (SELECT, UPDATE, DELETE) but INSERT is handled by the above policy
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all roles"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY policyname;

