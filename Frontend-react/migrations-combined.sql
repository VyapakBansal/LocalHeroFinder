CREATE TYPE public.app_role AS ENUM ('responder', 'requester', 'admin');

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.responder_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  skills TEXT[] DEFAULT '{}',
  certifications JSONB DEFAULT '[]',
  experience_log JSONB DEFAULT '[]',
  availability_status BOOLEAN NOT NULL DEFAULT false,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 5.0,
  hero_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  responder_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('CPR/AED', 'Choking', 'Severe Bleeding', 'Road Accident', 'Anaphylaxis', 'Elderly Fall', 'Blood Donation', 'Missing Person')),
  status TEXT NOT NULL DEFAULT 'awaiting_responder' CHECK (status IN ('awaiting_responder', 'accepted', 'en_route', 'arrived', 'completed', 'cancelled')),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  additional_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete all roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Responders can view their own profile" ON public.responder_profiles;
CREATE POLICY "Responders can view their own profile"
  ON public.responder_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Responders can update their own profile" ON public.responder_profiles;
CREATE POLICY "Responders can update their own profile"
  ON public.responder_profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Responders can insert their own profile" ON public.responder_profiles;
CREATE POLICY "Responders can insert their own profile"
  ON public.responder_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Requesters can view available responders" ON public.responder_profiles;
CREATE POLICY "Requesters can view available responders"
  ON public.responder_profiles FOR SELECT
  USING (
    public.has_role(auth.uid(), 'requester') AND 
    verification_status = 'verified' AND 
    availability_status = true
  );

DROP POLICY IF EXISTS "Requesters can view their own incidents" ON public.incidents;
CREATE POLICY "Requesters can view their own incidents"
  ON public.incidents FOR SELECT
  USING (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Responders can view incidents in their area" ON public.incidents;
CREATE POLICY "Responders can view incidents in their area"
  ON public.incidents FOR SELECT
  USING (
    public.has_role(auth.uid(), 'responder') AND
    status IN ('awaiting_responder', 'accepted', 'en_route', 'arrived')
  );

DROP POLICY IF EXISTS "Responders can view their accepted incidents" ON public.incidents;
CREATE POLICY "Responders can view their accepted incidents"
  ON public.incidents FOR SELECT
  USING (auth.uid() = responder_id);

DROP POLICY IF EXISTS "Requesters can create incidents" ON public.incidents;
CREATE POLICY "Requesters can create incidents"
  ON public.incidents FOR INSERT
  WITH CHECK (
    auth.uid() = requester_id AND
    public.has_role(auth.uid(), 'requester')
  );

DROP POLICY IF EXISTS "Responders can update incidents they accepted" ON public.incidents;
CREATE POLICY "Responders can update incidents they accepted"
  ON public.incidents FOR UPDATE
  USING (
    auth.uid() = responder_id AND
    public.has_role(auth.uid(), 'responder')
  );

DROP POLICY IF EXISTS "Requesters can update their own incidents" ON public.incidents;
CREATE POLICY "Requesters can update their own incidents"
  ON public.incidents FOR UPDATE
  USING (auth.uid() = requester_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_responder_profiles_updated_at ON public.responder_profiles;
CREATE TRIGGER update_responder_profiles_updated_at
  BEFORE UPDATE ON public.responder_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  )
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'requester')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certifications',
  'certifications',
  false,
  10485760,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload their own certifications" ON storage.objects;
CREATE POLICY "Users can upload their own certifications"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'certifications' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can view their own certifications" ON storage.objects;
CREATE POLICY "Users can view their own certifications"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'certifications' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own certifications" ON storage.objects;
CREATE POLICY "Users can delete their own certifications"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'certifications' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Admins can view all certifications" ON storage.objects;
CREATE POLICY "Admins can view all certifications"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'certifications' AND
  public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
CREATE POLICY "Users can insert their own roles"
ON public.user_roles FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  auth.uid() IS NOT NULL
);
