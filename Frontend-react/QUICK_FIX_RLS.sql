-- ============================================
-- QUICK FIX: Fix RLS Policy for user_roles INSERT
-- Run this FIRST in your NEW Supabase project
-- Project: nlhidtzfltbpkhkttzwb
-- ============================================
-- Go to: https://supabase.com/dashboard/project/nlhidtzfltbpkhkttzwb/sql/new
-- ============================================

-- Fix the conflicting admin policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create specific admin policies instead of FOR ALL
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Ensure the insert policy exists and works correctly
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
CREATE POLICY "Users can insert their own roles"
ON public.user_roles FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  auth.uid() IS NOT NULL
);

-- Verify the policies are set up correctly
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN with_check IS NOT NULL THEN with_check::text
    WHEN qual IS NOT NULL THEN qual::text
    ELSE 'N/A'
  END as policy_condition
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY policyname;

