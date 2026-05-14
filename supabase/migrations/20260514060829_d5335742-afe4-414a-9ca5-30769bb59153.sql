
-- preview_image_cache: public read, service-role write
DROP POLICY IF EXISTS "Allow all operations on preview cache" ON public.preview_image_cache;

CREATE POLICY "Anyone can read preview cache"
  ON public.preview_image_cache FOR SELECT
  USING (true);

CREATE POLICY "Service role manages preview cache"
  ON public.preview_image_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- tcg_cards_cache: public read, service-role write
DROP POLICY IF EXISTS "Anyone can insert TCG card cache" ON public.tcg_cards_cache;
DROP POLICY IF EXISTS "Anyone can update TCG card cache" ON public.tcg_cards_cache;

-- Keep the existing public SELECT policy as-is.
CREATE POLICY "Service role manages tcg cache"
  ON public.tcg_cards_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Server-side cleanup for expired tcg cache entries (older than 7 days).
CREATE OR REPLACE FUNCTION public.cleanup_expired_tcg_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.tcg_cards_cache
  WHERE updated_at < now() - interval '7 days';
END;
$$;

-- Fix search_path on existing functions flagged by the linter
ALTER FUNCTION public.update_feedback_updated_at() SET search_path = public;
ALTER FUNCTION public.update_global_rankings() SET search_path = public;
ALTER FUNCTION public.update_user_preferences_updated_at() SET search_path = public;
