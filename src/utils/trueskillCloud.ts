
import { supabase } from '@/integrations/supabase/client';

export async function getUserIdFromAuth() {
  const session = supabase.auth?.session?.() || (await supabase.auth.getSession())?.data?.session;
  return session?.user?.id || null;
}

export async function loadTrueSkillSession() {
  const userId = await getUserIdFromAuth();
  if (!userId) return null;

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

export async function saveTrueSkillSession(state) {
  const userId = await getUserIdFromAuth();
  if (!userId) return false;

  const upsertData = {
    user_id: userId,
    ratings_data: state.ratings,
    total_battles: state.totalBattles,
    total_battles_last_updated: state.totalBattlesLastUpdated,
    pending_battles: state.pendingBattles,
    refinement_queue: state.refinementQueue,
    last_updated: new Date().toISOString()
  };
  const { error } = await supabase
    .from('trueskill_sessions')
    .upsert(upsertData, { onConflict: 'user_id' });
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
