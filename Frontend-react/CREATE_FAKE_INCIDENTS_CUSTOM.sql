-- ============================================
-- Create Fake CPR Incidents - CUSTOM LOCATION
-- ============================================
-- INSTRUCTIONS:
-- 1. Replace YOUR_LATITUDE and YOUR_LONGITUDE below with your actual coordinates
-- 2. Get your coordinates from Google Maps (right-click → coordinates)
-- 3. The script will create incidents within 1-2km of your location
-- ============================================

-- SET YOUR LOCATION HERE (replace these values)
\set center_lat 40.7128  -- Replace with your latitude
\set center_lng -74.0060  -- Replace with your longitude

-- Create fake CPR/AED incidents nearby your location
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
  -- Incident 1: Very close (0.3km away)
  (
    (SELECT id FROM auth.users LIMIT 1),
    'CPR/AED',
    'awaiting_responder',
    :center_lat + 0.003,  -- ~0.3km north
    :center_lng - 0.003,  -- ~0.3km west
    '123 Nearby Street',
    'Elderly person collapsed, needs immediate CPR assistance.',
    NOW() - INTERVAL '3 minutes'
  ),
  -- Incident 2: Close (0.5km away)
  (
    (SELECT id FROM auth.users LIMIT 1),
    'CPR/AED',
    'awaiting_responder',
    :center_lat - 0.004,  -- ~0.5km south
    :center_lng + 0.004,  -- ~0.5km east
    '456 Close Avenue',
    'Person found unresponsive. AED available. Need certified responder.',
    NOW() - INTERVAL '7 minutes'
  ),
  -- Incident 3: Medium distance (0.8km away)
  (
    (SELECT id FROM auth.users LIMIT 1),
    'CPR/AED',
    'awaiting_responder',
    :center_lat + 0.007,  -- ~0.8km north
    :center_lng - 0.002,  -- ~0.2km west
    '789 Medium Road',
    'Cardiac arrest suspected. Witnesses started CPR. Need help immediately.',
    NOW() - INTERVAL '12 minutes'
  ),
  -- Incident 4: A bit further (1.2km away)
  (
    (SELECT id FROM auth.users LIMIT 1),
    'CPR/AED',
    'awaiting_responder',
    :center_lat - 0.010,  -- ~1.1km south
    :center_lng + 0.005,  -- ~0.4km east
    '321 Further Lane',
    'Medical emergency - person not breathing. Urgent CPR needed.',
    NOW() - INTERVAL '18 minutes'
  ),
  -- Incident 5: Further but still reachable (1.5km away)
  (
    (SELECT id FROM auth.users LIMIT 1),
    'CPR/AED',
    'awaiting_responder',
    :center_lat + 0.013,  -- ~1.4km north
    :center_lng - 0.006,  -- ~0.5km west
    '555 Distant Boulevard',
    'Emergency at office building. Someone collapsed. Need CPR assistance.',
    NOW() - INTERVAL '25 minutes'
  );

-- Verify incidents
SELECT 
  i.id,
  i.incident_type,
  i.status,
  ROUND(i.latitude::numeric, 6) as lat,
  ROUND(i.longitude::numeric, 6) as lng,
  i.address,
  i.created_at
FROM public.incidents i
WHERE i.incident_type = 'CPR/AED'
  AND i.status = 'awaiting_responder'
ORDER BY i.created_at DESC;

