
-- 1. Make session_id NOT NULL and UNIQUE (so we can safely remove it later)
ALTER TABLE public.trueskill_sessions
  ALTER COLUMN session_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS trueskill_sessions_session_id_idx 
  ON public.trueskill_sessions(session_id) 
  WHERE session_id IS NOT NULL;

-- 2. Ensure user_id is present, and unique per user
ALTER TABLE public.trueskill_sessions
  ALTER COLUMN user_id DROP DEFAULT; -- just in case
-- Set user_id nullability (leave as is for now to handle guests)

-- 3. Enforce one trueskill_session row per user (where user_id is set)
CREATE UNIQUE INDEX IF NOT EXISTS trueskill_sessions_user_id_idx
  ON public.trueskill_sessions(user_id)
  WHERE user_id IS NOT NULL;

-- 4. For all future sync/load, clients must use user_id for all reads/writes.

-- (Optional safety: Remove session_id in the future after migration)
