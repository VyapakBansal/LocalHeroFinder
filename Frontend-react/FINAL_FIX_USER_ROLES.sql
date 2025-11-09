SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check::text
    WHEN qual IS NOT NULL THEN 'USING: ' || qual::text
    ELSE 'N/A'
  END as policy_condition
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY policyname;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Users can insert their own roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = user_id
  );

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

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
ORDER BY 
  CASE cmd
    WHEN 'INSERT' THEN 1
    WHEN 'SELECT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
  END,
  policyname;

SELECT 
  auth.uid() as current_user_id,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN 'User is authenticated ✓'
    ELSE 'User is NOT authenticated ✗'
  END as auth_status;
