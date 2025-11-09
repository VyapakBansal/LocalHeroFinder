-- Create role enum
CREATE TYPE public.app_role AS ENUM ('responder', 'requester', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create responder_profiles table for responder-specific data
CREATE TABLE public.responder_profiles (
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

-- Create incidents table
CREATE TABLE public.incidents (
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

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
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

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for responder_profiles
CREATE POLICY "Responders can view their own profile"
  ON public.responder_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Responders can update their own profile"
  ON public.responder_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Responders can insert their own profile"
  ON public.responder_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Requesters can view available responders"
  ON public.responder_profiles FOR SELECT
  USING (
    public.has_role(auth.uid(), 'requester') AND 
    verification_status = 'verified' AND 
    availability_status = true
  );

-- creating all tha RLS Policiy stuff for incidents
CREATE POLICY "Requesters can view their own incidents"
  ON public.incidents FOR SELECT
  USING (auth.uid() = requester_id);

CREATE POLICY "Responders can view incidents in their area"
  ON public.incidents FOR SELECT
  USING (
    public.has_role(auth.uid(), 'responder') AND
    status IN ('awaiting_responder', 'accepted', 'en_route', 'arrived')
  );

CREATE POLICY "Responders can view their accepted incidents"
  ON public.incidents FOR SELECT
  USING (auth.uid() = responder_id);

CREATE POLICY "Requesters can create incidents"
  ON public.incidents FOR INSERT
  WITH CHECK (
    auth.uid() = requester_id AND
    public.has_role(auth.uid(), 'requester')
  );

CREATE POLICY "Responders can update incidents they accepted"
  ON public.incidents FOR UPDATE
  USING (
    auth.uid() = responder_id AND
    public.has_role(auth.uid(), 'responder')
  );

CREATE POLICY "Requesters can update their own incidents"
  ON public.incidents FOR UPDATE
  USING (auth.uid() = requester_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_responder_profiles_updated_at
  BEFORE UPDATE ON public.responder_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  
  -- Insert default role (requester)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'requester');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for incidents
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;