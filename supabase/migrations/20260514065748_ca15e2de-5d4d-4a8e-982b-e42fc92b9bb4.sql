
-- Hardening: feedback_submissions input validation
ALTER TABLE public.feedback_submissions
  ADD CONSTRAINT feedback_email_format CHECK (
    email IS NULL OR (
      length(email) <= 255
      AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
  ),
  ADD CONSTRAINT feedback_title_length  CHECK (length(title)  BETWEEN 1 AND 200),
  ADD CONSTRAINT feedback_description_length CHECK (length(description) BETWEEN 1 AND 5000),
  ADD CONSTRAINT feedback_type_allowed  CHECK (type IN ('bug','feature','improvement','question','other')),
  ADD CONSTRAINT feedback_url_length    CHECK (url IS NULL OR length(url) <= 2048),
  ADD CONSTRAINT feedback_console_logs_length CHECK (console_logs IS NULL OR length(console_logs) <= 50000),
  ADD CONSTRAINT feedback_user_agent_length   CHECK (user_agent  IS NULL OR length(user_agent)  <= 1000);

-- Normalize email on insert (lowercase + trim)
CREATE OR REPLACE FUNCTION public.normalize_feedback_email()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := lower(trim(NEW.email));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS feedback_normalize_email ON public.feedback_submissions;
CREATE TRIGGER feedback_normalize_email
  BEFORE INSERT OR UPDATE ON public.feedback_submissions
  FOR EACH ROW EXECUTE FUNCTION public.normalize_feedback_email();

-- Hardening: tcg-images storage bucket — size + mime-type limits
UPDATE storage.buckets
   SET file_size_limit = 5242880,  -- 5 MB
       allowed_mime_types = ARRAY['image/png','image/jpeg','image/webp']
 WHERE id = 'tcg-images';

-- Hardening: trainer-avatars bucket — size + mime-type limits
UPDATE storage.buckets
   SET file_size_limit = 2097152,  -- 2 MB
       allowed_mime_types = ARRAY['image/png','image/jpeg','image/webp']
 WHERE id = 'trainer-avatars';
