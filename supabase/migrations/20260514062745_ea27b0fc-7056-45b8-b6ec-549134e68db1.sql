-- Authenticated users can read anonymous sessions (no owner yet) so they can
-- migrate guest ratings into their account on sign-up. Once user_id is set,
-- the regular owner policy takes over.
CREATE POLICY "Authenticated can read unclaimed anon sessions"
  ON public.trueskill_sessions
  FOR SELECT
  TO authenticated
  USING (user_id IS NULL);

CREATE POLICY "Authenticated can claim unclaimed anon sessions"
  ON public.trueskill_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);