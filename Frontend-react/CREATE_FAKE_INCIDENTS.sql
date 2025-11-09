-- ============================================
-- Create Fake Emergency Requests for Testing
-- Creates CPR/AED incidents nearby for testing
-- ============================================
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nlhidtzfltbpkhkttzwb/sql/new
-- ============================================

-- Step 1: Create a fake requester user (if it doesn't exist)
-- This will be "Jason" who needs CPR help
DO $$
DECLARE
  fake_user_id UUID;
BEGIN
  -- Check if fake user already exists
  SELECT id INTO fake_user_id
  FROM auth.users
  WHERE email = 'jason.requester@test.local'
  LIMIT 1;

  -- If user doesn't exist, create one
  IF fake_user_id IS NULL THEN
    -- Insert into auth.users (this requires service role, so we'll use a workaround)
    -- Instead, we'll use an existing user or create incidents with a placeholder
    -- For now, let's use the first available user or create a test user via Supabase Auth UI
    RAISE NOTICE 'Please create a test user "jason.requester@test.local" via Supabase Auth, or we will use an existing user';
  END IF;
END $$;

-- Step 2: Get or create a requester user ID
-- Option A: Use an existing user (replace with actual user ID if you have one)
-- Option B: Create test incidents using a placeholder approach

-- For now, let's create incidents that will work with any requester
-- We'll use a subquery to get the first user, or you can manually set the UUID

-- Step 3: Create multiple CPR/AED incidents nearby
-- Using coordinates around a central location (adjust these to match your location)
-- Default: NYC area (40.7128, -74.0060) - you can change these

INSERT INTO public.incidents (
  requester_id,
  incident_type,
  status,
  latitude,
  longitude,
  address,
  additional_info,
  created_at
) VALUES
  -- Incident 1: CPR needed at nearby location (0.5km away)
  (
    (SELECT id FROM auth.users LIMIT 1), -- Uses first available user
    'CPR/AED',
    'awaiting_responder',
    40.7150,  -- Slightly north of center
    -74.0080, -- Slightly west of center
    '123 Main Street, Downtown',
    'Elderly person collapsed, needs immediate CPR. Family member performing chest compressions but needs help.',
    NOW() - INTERVAL '5 minutes'
  ),
  -- Incident 2: CPR needed at another nearby location (0.8km away)
  (
    (SELECT id FROM auth.users LIMIT 1),
    'CPR/AED',
    'awaiting_responder',
    40.7100,  -- Slightly south
    -74.0040, -- Slightly east
    '456 Park Avenue, Midtown',
    'Person found unresponsive. AED available nearby. Need certified CPR responder ASAP.',
    NOW() - INTERVAL '10 minutes'
  ),
  -- Incident 3: CPR needed (1.2km away)
  (
    (SELECT id FROM auth.users LIMIT 1),
    'CPR/AED',
    'awaiting_responder',
    40.7180,  -- Further north
    -74.0100, -- Further west
    '789 Broadway, Uptown',
    'Cardiac arrest suspected. Witnesses started CPR. Need professional help immediately.',
    NOW() - INTERVAL '15 minutes'
  ),
  -- Incident 4: Another CPR request (0.6km away)
  (
    (SELECT id FROM auth.users LIMIT 1),
    'CPR/AED',
    'awaiting_responder',
    40.7135,  -- Close to center
    -74.0070, -- Close to center
    '321 Oak Street, Central Park Area',
    'Medical emergency - person not breathing. Need CPR certified responder urgently.',
    NOW() - INTERVAL '2 minutes'
  ),
  -- Incident 5: One more CPR request (1.0km away)
  (
    (SELECT id FROM auth.users LIMIT 1),
    'CPR/AED',
    'awaiting_responder',
    40.7090,  -- South
    -74.0050, -- East
    '555 Elm Avenue, Business District',
    'Emergency: Someone collapsed at the office. Need CPR assistance immediately.',
    NOW() - INTERVAL '8 minutes'
  )
ON CONFLICT DO NOTHING;

-- Step 4: Verify the incidents were created
SELECT 
  i.id,
  i.incident_type,
  i.status,
  i.latitude,
  i.longitude,
  i.address,
  i.additional_info,
  i.created_at,
  u.email as requester_email
FROM public.incidents i
LEFT JOIN auth.users u ON i.requester_id = u.id
WHERE i.incident_type = 'CPR/AED'
  AND i.status = 'awaiting_responder'
ORDER BY i.created_at DESC;

-- ============================================
-- To customize the location:
-- Replace the latitude/longitude values above with your actual location
-- You can find your coordinates by:
-- 1. Opening Google Maps
-- 2. Right-clicking on your location
-- 3. The coordinates will be in the format: lat, lng
-- ============================================

