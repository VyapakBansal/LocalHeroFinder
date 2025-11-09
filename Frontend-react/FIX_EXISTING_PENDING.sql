UPDATE public.responder_profiles
SET verification_status = 'verified'
WHERE verification_status = 'pending';

SELECT 
  rp.user_id,
  u.email,
  rp.verification_status,
  rp.skills,
  rp.created_at
FROM public.responder_profiles rp
JOIN auth.users u ON rp.user_id = u.id
ORDER BY rp.created_at DESC;
