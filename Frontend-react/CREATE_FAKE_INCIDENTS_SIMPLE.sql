-- ============================================
-- SIMPLE VERSION: Create Fake CPR Incidents
-- Just run this - it will use the first available user
-- ============================================
-- Adjust the coordinates (latitude, longitude) to match your location
-- Default coordinates are for NYC area - change them to your location
-- ============================================

-- Delete any existing test incidents (optional - comment out if you want to keep them)
-- DELETE FROM public.incidents WHERE incident_type = 'CPR/AED' AND status = 'awaiting_responder';

-- Create 5 CPR/AED incidents nearby
-- CHANGE THESE COORDINATES to match your location:
-- - Get your location from Google Maps (right-click → coordinates)
-- - Replace 40.7128 with your latitude
-- - Replace -74.0060 with your longitude

INSERT INTO public.incidents (
  requester_id,
  incident_type,
  status,
  latitude,
  longitude,
  address,
  additional_info,
  created_at
) 
SELECT 
  (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) as requester_id,
  'CPR/AED' as incident_type,
  'awaiting_responder' as status,
  -- Incident 1: Very close (0.3km)
  40.7150 as latitude,  -- CHANGE THIS to your_lat + 0.003
  -74.0080 as longitude, -- CHANGE THIS to your_lng - 0.003
  '123 Main Street, Downtown' as address,
  'Elderly person collapsed, needs immediate CPR. Family member performing chest compressions but needs help.' as additional_info,
  NOW() - INTERVAL '5 minutes' as created_at

UNION ALL

SELECT 
  (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
  'CPR/AED',
  'awaiting_responder',
  -- Incident 2: Close (0.5km)
  40.7100,  -- CHANGE THIS to your_lat - 0.004
  -74.0040, -- CHANGE THIS to your_lng + 0.004
  '456 Park Avenue, Midtown',
  'Person found unresponsive. AED available nearby. Need certified CPR responder ASAP.',
  NOW() - INTERVAL '10 minutes'

UNION ALL

SELECT 
  (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
  'CPR/AED',
  'awaiting_responder',
  -- Incident 3: Medium (0.8km)
  40.7180,  -- CHANGE THIS to your_lat + 0.007
  -74.0100, -- CHANGE THIS to your_lng - 0.002
  '789 Broadway, Uptown',
  'Cardiac arrest suspected. Witnesses started CPR. Need professional help immediately.',
  NOW() - INTERVAL '15 minutes'

UNION ALL

SELECT 
  (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
  'CPR/AED',
  'awaiting_responder',
  -- Incident 4: Close (0.6km)
  40.7135,  -- CHANGE THIS to your_lat + 0.001
  -74.0070, -- CHANGE THIS to your_lng - 0.001
  '321 Oak Street, Central Park Area',
  'Medical emergency - person not breathing. Need CPR certified responder urgently.',
  NOW() - INTERVAL '2 minutes'

UNION ALL

SELECT 
  (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
  'CPR/AED',
  'awaiting_responder',
  -- Incident 5: Further (1.0km)
  40.7090,  -- CHANGE THIS to your_lat - 0.004
  -74.0050, -- CHANGE THIS to your_lng + 0.001
  '555 Elm Avenue, Business District',
  'Emergency: Someone collapsed at the office. Need CPR assistance immediately.',
  NOW() - INTERVAL '8 minutes';

-- Show created incidents
SELECT 
  id,
  incident_type,
  status,
  ROUND(latitude::numeric, 6) as lat,
  ROUND(longitude::numeric, 6) as lng,
  address,
  created_at
FROM public.incidents
WHERE incident_type = 'CPR/AED'
  AND status = 'awaiting_responder'
ORDER BY created_at DESC;

