
-- Drop redundant/overly-permissive policies on profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Owner-only access to the base table (which contains email)
CREATE POLICY "Profiles owner can select"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Profiles owner can insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles owner can update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Public view exposing only non-sensitive fields
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = on) AS
  SELECT id, display_name, username, avatar_url, created_at
  FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;
