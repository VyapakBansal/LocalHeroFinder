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
    'Elderly person collapsed, needs immediate CPR. Family member performing chest compressions but needs help.',
    NOW() - INTERVAL '3 minutes'
  ),
  (
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    'CPR/AED',
    'awaiting_responder',
    40.7100,
    -74.0040,
    '456 Park Avenue',
    'Person found unresponsive. AED available nearby. Need certified CPR responder ASAP.',
    NOW() - INTERVAL '7 minutes'
  ),
  (
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    'CPR/AED',
    'awaiting_responder',
    40.7180,
    -74.0100,
    '789 Broadway',
    'Cardiac arrest suspected. Witnesses started CPR. Need professional help immediately.',
    NOW() - INTERVAL '12 minutes'
  ),
  (
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    'CPR/AED',
    'awaiting_responder',
    40.7135,
    -74.0070,
    '321 Oak Street',
    'Medical emergency - person not breathing. Need CPR certified responder urgently.',
    NOW() - INTERVAL '18 minutes'
  ),
  (
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    'CPR/AED',
    'awaiting_responder',
    40.7090,
    -74.0050,
    '555 Elm Avenue',
    'Emergency: Someone collapsed at the office. Need CPR assistance immediately.',
    NOW() - INTERVAL '25 minutes'
  );

SELECT 
  id,
  incident_type,
  status,
  ROUND(latitude::numeric, 6) as latitude,
  ROUND(longitude::numeric, 6) as longitude,
  address,
  additional_info,
  created_at
FROM public.incidents
WHERE incident_type = 'CPR/AED'
  AND status = 'awaiting_responder'
ORDER BY created_at DESC;
