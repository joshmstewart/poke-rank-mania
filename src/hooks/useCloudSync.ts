
import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useCloudSync = () => {
  const { user, session } = useAuth();
  const { smartSync, getAllRatings, isHydrated, sessionId, setSessionId } = useTrueSkillStore(
    (state) => ({
      smartSync: state.smartSync,
      getAllRatings: state.getAllRatings,
      isHydrated: state.isHydrated,
      sessionId: state.sessionId,
      setSessionId: state.setSessionId,
    })
  );

  useEffect(() => {
    const checkEdgeFunctionHealth = async () => {
        console.log('🚨🚨🚨 [HEALTH_CHECK] Checking edge function connectivity...');
        try {
            const { data, error } = await supabase.functions.invoke('health-check', {
                body: { message: 'ping' }
            });

            if (error) throw error;

            console.log('✅ [HEALTH_CHECK] Edge function is healthy:', data);
        } catch (error) {
            console.error('❌ [HEALTH_CHECK] Edge function health check failed:', error);
            toast({
                title: 'System Status',
                description: 'Could not connect to cloud services. Some features may not work.',
                variant: 'destructive',
            });
        }
    };

    checkEdgeFunctionHealth();
  }, []); // Run once on mount

  // Main sync and session reconciliation logic
  useEffect(() => {
    const syncAndReconcile = async () => {
      if (!isHydrated) {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ❌ SYNC HALTED: Store not hydrated yet`);
        return;
      }

      const effectiveUserId = user?.id || session?.user?.id;
      if (!effectiveUserId) {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] 👤 No user logged in, running in anonymous mode.`);
        // Potentially load anonymous session here if desired in the future.
        // For now, we only sync for logged-in users to fix the primary issue.
        return;
      }
      
      console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== SYNC & RECONCILE FLOW =====`);
      console.log(`🚨🚨🚨 [SYNC_AUDIT] User ID: ${effectiveUserId}`);
      console.log(`🚨🚨🚨 [SYNC_AUDIT] Current Store Session ID: ${sessionId}`);
      
      let reconciled = false;
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('trueskill_session_id')
          .eq('id', effectiveUserId)
          .single();

        if (error && error.code !== 'PGRST116') { // Ignore 'exact one row' error if no profile
            throw error;
        }
        
        const profileSessionId = profile?.trueskill_session_id;

        if (profileSessionId && profileSessionId !== sessionId) {
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Session ID mismatch. Reconciling Store[${sessionId}] with Profile[${profileSessionId}]`);
          toast({
            title: "Syncing Your Account",
            description: "Loading your saved progress...",
            duration: 4000
          });
          setSessionId(profileSessionId);
          reconciled = true;
        } else {
            console.log(`🚨🚨🚨 [SYNC_AUDIT] Session ID is aligned.`);
        }
      } catch (error) {
        console.error('🚨🚨🚨 [SYNC_AUDIT] Failed to fetch profile for reconciliation:', error);
      }

      console.log(`🚨🚨🚨 [SYNC_AUDIT] Starting main smart sync.`);
      const ratingsBeforeSync = getAllRatings();
      const rankedCountBefore = Object.keys(ratingsBeforeSync).length;

      await smartSync();

      const ratingsAfterSync = getAllRatings();
      const rankedCountAfter = Object.keys(ratingsAfterSync).length;
      
      if (reconciled || rankedCountAfter !== rankedCountBefore) {
          toast({
            title: "Sync Complete",
            description: `Your progress is up to date. ${rankedCountAfter} Pokémon ranked.`,
            duration: 3000
          });
      } else {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] No new data from cloud.`);
      }
    };

    syncAndReconcile();
  }, [user?.id, session?.user?.id, isHydrated]); // Re-run when user or hydration state changes

  const triggerManualSync = useCallback(async () => {
    console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== MANUAL SYNC TRIGGERED =====`);
    await smartSync();
    toast({
        title: "Manual Sync Complete",
        description: `Your data has been synced with the cloud.`,
        duration: 3000
    });
  }, [smartSync]);

  // All other functions are now obsolete as sync is automatic.
  // They are kept for compatibility but are now no-ops.
  const obsoleteFunc = (name: string) => () => {
     console.log(`🚨🚨🚨 [SYNC_AUDIT] "${name}" is now obsolete. Sync is automatic.`);
     toast({
        title: "Action Not Needed",
        description: "Your progress is saved automatically now!",
        duration: 3000
     });
  };

  return {
    saveBattleToCloud: obsoleteFunc('saveBattleToCloud'),
    loadBattleFromCloud: obsoleteFunc('loadBattleFromCloud'),
    saveRankingsToCloud: obsoleteFunc('saveRankingsToCloud'),
    saveSessionToCloud: obsoleteFunc('saveSessionToCloud'),
    loadSessionFromCloud: obsoleteFunc('loadSessionFromCloud'),
    triggerManualSync,
    isAuthenticated: !!(user || session?.user)
  };
};
