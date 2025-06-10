
-- Add pending battles column to trueskill_sessions table
ALTER TABLE trueskill_sessions 
ADD COLUMN pending_battles jsonb DEFAULT '[]'::jsonb;

-- Add an index for better performance when querying pending battles
CREATE INDEX idx_trueskill_sessions_pending_battles 
ON trueskill_sessions USING gin (pending_battles);
