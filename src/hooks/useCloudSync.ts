
import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useCloudSync = () => {
  const { user, session } = useAuth();
  const {
    smartSync,
    getAllRatings,
    isHydrated,
    sessionId,
    setSessionId,
    syncInProgress,
    setSyncStatus,
    setSessionReconciled,
  } = useTrueSkillStore((state) => ({
    smartSync: state.smartSync,
    getAllRatings: state.getAllRatings,
    isHydrated: state.isHydrated,
    sessionId: state.sessionId,
    setSessionId: state.setSessionId,
    syncInProgress: state.syncInProgress,
    setSyncStatus: state.setSyncStatus,
    setSessionReconciled: state.setSessionReconciled,
  }));

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

  // Sync timeout safeguard
  useEffect(() => {
    if (!syncInProgress) return;

    const SYNC_TIMEOUT = 30000; // 30 seconds
    const timeoutId = setTimeout(() => {
      // Re-check the state directly from the store in case it has changed
      if (useTrueSkillStore.getState().syncInProgress) {
        console.error(
          `🚨🚨🚨 [SYNC_AUDIT] Sync operation timed out after ${SYNC_TIMEOUT}ms. Forcing reset.`
        );
        toast({
          title: 'Sync Timed Out',
          description:
            'Cloud sync is taking too long. Please check your connection.',
          variant: 'destructive',
          duration: 5000,
        });
        setSyncStatus(false);
      }
    }, SYNC_TIMEOUT);

    return () => clearTimeout(timeoutId);
  }, [syncInProgress, setSyncStatus]);

  // Main sync and session reconciliation logic with retries
  useEffect(() => {
    let retryTimeout: number;
    const MAX_RETRIES = 5;
    let attempt = 0;

    const syncAndReconcile = async () => {
      attempt++;
      console.log(`🚨🚨🚨 [SYNC_AUDIT] Attempting reconciliation (Attempt ${attempt}/${MAX_RETRIES})`);

      // Initial checks that should not be retried if they fail, as they depend on external state.
      if (!useTrueSkillStore.getState().isHydrated) {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ❌ SYNC HALTED: Store not hydrated yet. Will wait for hydration.`);
        // The isHydrated dependency in the useEffect will re-trigger this.
        return;
      }

      const effectiveUserId = user?.id || session?.user?.id;
      if (!effectiveUserId) {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] 👤 No user logged in, running in anonymous mode.`);
        return; // No reconciliation needed for anonymous users
      }

      if (useTrueSkillStore.getState().sessionReconciled) {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ✅ Session already reconciled, skipping heavy logic.`);
        return;
      }

      console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== HEALING SYNC & RECONCILE FLOW =====`);
      try {
        const localSessionId = useTrueSkillStore.getState().sessionId;
        const localTotalBattles = useTrueSkillStore.getState().totalBattles;

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('trueskill_session_id')
          .eq('id', effectiveUserId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;

        const profileSessionId = profile?.trueskill_session_id;

        console.log(`🚨🚨🚨 [SYNC_AUDIT] Local Session: ${localSessionId} (${localTotalBattles} battles)`);
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Profile Session: ${profileSessionId}`);

        if (profileSessionId && profileSessionId !== localSessionId) {
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Session ID mismatch. Checking which session is better.`);
          const { data: cloudSessionData, error: functionError } = await supabase.functions.invoke('get-trueskill', {
            body: { sessionId: profileSessionId },
          });
          if (functionError) throw functionError;

          const cloudTotalBattles = cloudSessionData?.totalBattles || 0;
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Cloud session ${profileSessionId} has ${cloudTotalBattles} battles.`);

          if (cloudTotalBattles > localTotalBattles) {
            console.log(`🚨🚨🚨 [SYNC_AUDIT] Cloud is richer. Switching to ${profileSessionId}.`);
            toast({ title: 'Syncing Your Account', description: 'Loading more recent progress from the cloud...', duration: 4000 });
            setSessionId(profileSessionId);
            await smartSync();
          } else {
            console.log(`🚨🚨🚨 [SYNC_AUDIT] Local is richer. Healing profile to use ${localSessionId}.`);
            const { error: updateError } = await supabase.from('profiles').update({ trueskill_session_id: localSessionId }).eq('id', effectiveUserId);
            if (updateError) throw updateError;
            toast({ title: 'Account Synced', description: 'Your progress has been linked with your account.', duration: 3000 });
            await smartSync();
          }
        } else if (!profileSessionId && localSessionId) {
          console.log(`🚨🚨🚨 [SYNC_AUDIT] No session on profile. Linking local session ${localSessionId}.`);
          const { error: updateError } = await supabase.from('profiles').update({ trueskill_session_id: localSessionId }).eq('id', effectiveUserId);
          if (updateError) throw updateError;
          toast({ title: 'Account Synced', description: 'Your local progress has been linked to your account.', duration: 3000 });
          await smartSync();
        } else {
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Sessions aligned. Performing standard sync.`);
          await smartSync();
        }

        console.log(`🚨🚨🚨 [SYNC_AUDIT] ✅ Reconciliation complete. Unlocking writes.`);
        setSessionReconciled(true);
      } catch (error) {
        console.error(`🚨🚨🚨 [SYNC_AUDIT] CRITICAL: Reconciliation failed on attempt ${attempt}:`, error);
        setSessionReconciled(false); // Keep it false
        if (attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Scheduling retry in ${delay / 1000}s...`);
          retryTimeout = window.setTimeout(syncAndReconcile, delay);
        } else {
          console.error(`🚨🚨🚨 [SYNC_AUDIT] ❌ Max retries reached. Stopping reconciliation attempts.`);
          toast({ title: 'Sync Error', description: 'Could not synchronize your account data. Writes may not save correctly.', variant: 'destructive', duration: 7000});
        }
      }
    };

    syncAndReconcile();

    return () => {
      clearTimeout(retryTimeout);
    };
  }, [user?.id, session?.user?.id, isHydrated, setSessionId, smartSync, setSessionReconciled]);

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
    isAuthenticated: !!(user || session?.user),
  };
};
