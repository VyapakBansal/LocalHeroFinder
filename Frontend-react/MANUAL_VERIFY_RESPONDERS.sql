-- ============================================
-- Manual Verification Script
-- Use this to manually verify responder accounts
-- ============================================
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nlhidtzfltbpkhkttzwb/sql/new
-- ============================================

-- Option 1: Verify a specific user by email
-- Replace 'user@example.com' with the actual email
UPDATE public.responder_profiles
SET verification_status = 'verified'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'user@example.com'
);

-- Option 2: Verify all pending responders
UPDATE public.responder_profiles
SET verification_status = 'verified'
WHERE verification_status = 'pending';

-- Option 3: Verify a specific user by user_id (UUID)
-- Replace the UUID with the actual user ID
-- UPDATE public.responder_profiles
-- SET verification_status = 'verified'
-- WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- Verify the changes
SELECT 
  rp.user_id,
  u.email,
  rp.verification_status,
  rp.skills,
  rp.created_at
FROM public.responder_profiles rp
JOIN auth.users u ON rp.user_id = u.id
ORDER BY rp.created_at DESC;

