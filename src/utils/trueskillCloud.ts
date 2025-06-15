
import { supabase } from '@/integrations/supabase/client';

// Always get the current user via supabase.auth.getSession()
export async function getUserIdFromAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
}

export async function loadTrueSkillSession() {
  const userId = await getUserIdFromAuth();
  if (!userId) return null;

  // Use user_id for lookup
  const { data, error } = await supabase
    .from('trueskill_sessions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('[TrueSkillCloud] Load error:', error);
    return null;
  }
  return data;
}

export async function saveTrueSkillSession(state: any) {
  const userId = await getUserIdFromAuth();
  if (!userId) return false;

  // Always use a session_id (can just use userId string for now)
  const sessionId = userId;
  const upsertData = {
    user_id: userId,
    session_id: sessionId,
    ratings_data: state.ratings,
    total_battles: state.totalBattles,
    total_battles_last_updated: state.totalBattlesLastUpdated,
    pending_battles: state.pendingBattles,
    refinement_queue: state.refinementQueue,
    last_updated: new Date().toISOString()
  };

  const { error } = await supabase
    .from('trueskill_sessions')
    .upsert(upsertData, { onConflict: 'session_id' });
  if (error) {
    console.error('[TrueSkillCloud] Save error:', error);
    return false;
  }
  return true;
}

export async function clearTrueSkillSession() {
  const userId = await getUserIdFromAuth();
  if (!userId) return;
  await supabase
    .from('trueskill_sessions')
    .delete()
    .eq('user_id', userId);
}
