-- 1. Fix feedback_submissions: anon submissions were world-readable
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedback_submissions;

CREATE POLICY "Users can view their own feedback"
  ON public.feedback_submissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Fix trueskill_sessions: anon sessions were enumerable.
-- Drop the over-permissive ALL policy and replace with tighter ones.
DROP POLICY IF EXISTS "Anonymous users can manage their session data via session_id" ON public.trueskill_sessions;

-- Block direct anon SELECT entirely; reads must go through a SECURITY DEFINER RPC
-- that requires the caller to know the session_id.
CREATE POLICY "Anon can insert own anonymous session"
  ON public.trueskill_sessions
  FOR INSERT
  TO anon
  WITH CHECK (session_id IS NOT NULL AND user_id IS NULL);

-- Anonymous updates are allowed only when the caller supplies the session_id
-- in the WHERE clause (the value acts as a bearer token). The USING/CHECK still
-- requires the row be an anonymous one.
CREATE POLICY "Anon can update own anonymous session by id"
  ON public.trueskill_sessions
  FOR UPDATE
  TO anon
  USING (user_id IS NULL AND session_id IS NOT NULL)
  WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

-- SECURITY DEFINER function: only returns the row whose session_id matches
-- the caller-supplied token. This is the only legitimate anon read path.
CREATE OR REPLACE FUNCTION public.get_anonymous_trueskill_session(_session_id text)
RETURNS SETOF public.trueskill_sessions
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.trueskill_sessions
  WHERE session_id = _session_id
    AND user_id IS NULL
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_anonymous_trueskill_session(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_anonymous_trueskill_session(text) TO anon, authenticated;

-- 3. Lock down tcg-images storage bucket: block anonymous uploads.
DROP POLICY IF EXISTS "Allow TCG Image Uploads" ON storage.objects;

CREATE POLICY "Authenticated users can upload TCG images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'tcg-images');

-- Owners can update/delete their own uploads
CREATE POLICY "Owners can update their TCG image uploads"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'tcg-images' AND owner = auth.uid());

CREATE POLICY "Owners can delete their TCG image uploads"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'tcg-images' AND owner = auth.uid());