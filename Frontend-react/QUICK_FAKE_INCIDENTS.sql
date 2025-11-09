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
  (
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    'CPR/AED',
    'awaiting_responder',
    40.7150,
    -74.0080,
    '123 Main Street',
    'Elderly person collapsed, needs immediate CPR assistance.',
    NOW() - INTERVAL '3 minutes'
  ),
  (
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    'CPR/AED',
    'awaiting_responder',
    40.7100,
    -74.0040,
    '456 Park Avenue',
    'Person found unresponsive. AED available. Need certified responder.',
    NOW() - INTERVAL '7 minutes'
  ),
  (
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    'CPR/AED',
    'awaiting_responder',
    40.7180,
    -74.0100,
    '789 Broadway',
    'Cardiac arrest suspected. Witnesses started CPR. Need help immediately.',
    NOW() - INTERVAL '12 minutes'
  ),
  (
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    'CPR/AED',
    'awaiting_responder',
    40.7135,
    -74.0070,
    '321 Oak Street',
    'Medical emergency - person not breathing. Urgent CPR needed.',
    NOW() - INTERVAL '2 minutes'
  ),
  (
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    'CPR/AED',
    'awaiting_responder',
    40.7090,
    -74.0050,
    '555 Elm Avenue',
    'Emergency at office building. Someone collapsed. Need CPR assistance.',
    NOW() - INTERVAL '8 minutes'
  );

SELECT 
  incident_type,
  status,
  ROUND(latitude::numeric, 4) as lat,
  ROUND(longitude::numeric, 4) as lng,
  address,
  created_at
FROM public.incidents
WHERE incident_type = 'CPR/AED' AND status = 'awaiting_responder'
ORDER BY created_at DESC;

