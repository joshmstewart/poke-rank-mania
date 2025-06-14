
-- Add total_battles_last_updated column to trueskill_sessions table
ALTER TABLE public.trueskill_sessions
ADD COLUMN IF NOT EXISTS total_battles_last_updated BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000);

-- Add refinement_queue column to trueskill_sessions table
ALTER TABLE public.trueskill_sessions
ADD COLUMN IF NOT EXISTS refinement_queue JSONB NOT NULL DEFAULT '[]'::jsonb;
