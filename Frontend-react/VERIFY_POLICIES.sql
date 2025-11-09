-- ============================================
-- Verify RLS Policies Are Set Up Correctly
-- Run this to confirm policies exist
-- ============================================

-- Check all policies on user_roles table
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN with_check IS NOT NULL THEN with_check::text
    WHEN qual IS NOT NULL THEN qual::text
    ELSE 'N/A'
  END as policy_condition,
  CASE 
    WHEN cmd = 'INSERT' AND with_check IS NOT NULL THEN '✓ INSERT policy exists'
    WHEN cmd = 'SELECT' AND qual IS NOT NULL THEN '✓ SELECT policy exists'
    WHEN cmd = 'UPDATE' AND qual IS NOT NULL THEN '✓ UPDATE policy exists'
    WHEN cmd = 'DELETE' AND qual IS NOT NULL THEN '✓ DELETE policy exists'
    ELSE '⚠ Check needed'
  END as status
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY 
  CASE cmd
    WHEN 'INSERT' THEN 1
    WHEN 'SELECT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
  END,
  policyname;

-- Check that RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✓ RLS is enabled'
    ELSE '✗ RLS is NOT enabled'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_roles';

-- Count policies (should be at least 4: INSERT, SELECT, UPDATE, DELETE)
SELECT 
  COUNT(*) as total_policies,
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✓ All policies exist'
    ELSE '⚠ Missing some policies'
  END as status
FROM pg_policies 
WHERE tablename = 'user_roles';

