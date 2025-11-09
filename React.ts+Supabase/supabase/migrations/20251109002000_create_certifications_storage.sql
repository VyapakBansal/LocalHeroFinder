-- Create storage bucket for certifications
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certifications',
  'certifications',
  false,
  10485760, -- 10MB in bytes
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for certifications bucket
-- Users can upload their own certifications
CREATE POLICY "Users can upload their own certifications"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'certifications' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own certifications
CREATE POLICY "Users can view their own certifications"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'certifications' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own certifications
CREATE POLICY "Users can delete their own certifications"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'certifications' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can view all certifications
CREATE POLICY "Admins can view all certifications"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'certifications' AND
  public.has_role(auth.uid(), 'admin')
);

