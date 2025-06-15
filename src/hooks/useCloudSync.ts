
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

  // Main sync and session reconciliation logic
  useEffect(() => {
    const syncAndReconcile = async () => {
      const isAuth = !!(user || session?.user);

      // For anonymous users, we must wait for local storage to hydrate.
      // After that, this hook has no more responsibilities for them.
      if (!isAuth) {
        if (!isHydrated) {
          console.log(`🚨🚨🚨 [SYNC_AUDIT] 👤 Anonymous user, awaiting local storage hydration.`);
          return;
        }
        console.log(`🚨🚨🚨 [SYNC_AUDIT] 👤 Anonymous user is hydrated. No cloud sync needed.`);
        setSessionReconciled(false);
        return;
      }
      
      // For authenticated users, if we are already hydrated, it means
      // the initial cloud sync has completed. We don't need to run this full flow again.
      if (isHydrated) {
          console.log(`🚨🚨🚨 [SYNC_AUDIT] ✅ Authenticated user already synced from cloud. Reconciliation logic will not re-run.`);
          return;
      }

      // If we reach here, we are an AUTHENTICATED, NON-HYDRATED user.
      // This is the trigger for the initial cloud data load.
      
      console.log('🔐 [AUTH_CLEANUP] Clearing local trueskill-storage to prevent conflicts.');
      localStorage.removeItem('trueskill-storage');

      console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== INITIAL CLOUD SYNC & RECONCILE =====`);
      console.log(`🚨🚨🚨 [SYNC_AUDIT] User ID: ${user?.id || session?.user?.id}`);
      console.log(
        `🚨🚨🚨 [SYNC_AUDIT] Current Store Session ID: ${sessionId}`
      );

      let reconciled = false;
      try {
        const effectiveUserId = user?.id || session?.user?.id;
        if (!effectiveUserId) { // Should not happen due to checks above, but for type safety
            console.error("🚨🚨🚨 [SYNC_AUDIT] Logic error: User disappeared during sync flow.");
            return;
        }
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('trueskill_session_id')
          .eq('id', effectiveUserId)
          .single();

        if (error && error.code !== 'PGRST116') {
          // Ignore 'exact one row' error if no profile
          throw error;
        }

        const profileSessionId = profile?.trueskill_session_id;

        if (profileSessionId && profileSessionId !== sessionId) {
          console.log(
            `🚨🚨🚨 [SYNC_AUDIT] Session ID mismatch. Reconciling Store[${sessionId}] with Profile[${profileSessionId}]`
          );
          toast({
            title: 'Syncing Your Account',
            description: 'Loading your saved progress from the cloud...',
            duration: 4000,
          });
          setSessionId(profileSessionId);
          reconciled = true;
        } else if (!profileSessionId) {
          console.log(
            `🚨🚨🚨 [SYNC_AUDIT] No session on profile. Linking current session [${sessionId}] to user [${effectiveUserId}]`
          );
          try {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ trueskill_session_id: sessionId })
              .eq('id', effectiveUserId);

            if (updateError) throw updateError;

            toast({
              title: 'Account Synced',
              description:
                'Your local progress has been linked to your account.',
              duration: 3000,
            });
          } catch (err) {
            console.error(
              `🚨🚨🚨 [SYNC_AUDIT] Failed to link session to profile:`,
              err
            );
            toast({
              title: 'Sync Error',
              description:
                'Could not link your local progress to your account.',
              variant: 'destructive',
            });
          }
        } else {
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Session ID is aligned.`);
        }
        
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ✅ Session reconciliation complete. Unlocking writes.`);
        setSessionReconciled(true);

      } catch (error) {
        console.error(
          '🚨🚨🚨 [SYNC_AUDIT] Failed to fetch profile for reconciliation:',
          error
        );
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ❌ Session not reconciled due to error. Writes will be blocked.`);
        setSessionReconciled(false); // Keep writes blocked
        return; // Exit here.
      }

      console.log(`🚨🚨🚨 [SYNC_AUDIT] Starting main smart sync.`);
      const ratingsBeforeSync = getAllRatings();
      const rankedCountBefore = Object.keys(ratingsBeforeSync).length;

      await smartSync();

      const ratingsAfterSync = getAllRatings();
      const rankedCountAfter = Object.keys(ratingsAfterSync).length;

      if (reconciled || rankedCountAfter !== rankedCountBefore) {
        toast({
          title: 'Sync Complete',
          description: `Your progress is up to date. ${rankedCountAfter} Pokémon ranked.`,
          duration: 3000,
        });
      } else {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] No new data from cloud.`);
      }
    };

    syncAndReconcile();
  }, [user, session, isHydrated, sessionId, setSessionId, setSessionReconciled, getAllRatings, smartSync]);

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
