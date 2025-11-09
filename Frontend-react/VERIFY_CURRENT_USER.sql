-- ============================================
-- Quick Script: Verify Your Current User
-- ============================================
-- This will verify the most recently created responder profile
-- Run this in Supabase SQL Editor
-- ============================================

-- Verify the most recent responder application
UPDATE public.responder_profiles
SET verification_status = 'verified'
WHERE id = (
  SELECT id 
  FROM public.responder_profiles 
  ORDER BY created_at DESC 
  LIMIT 1
)
RETURNING *;

-- Or verify all pending responders (if you want to verify everyone)
-- UPDATE public.responder_profiles
-- SET verification_status = 'verified'
-- WHERE verification_status = 'pending';

