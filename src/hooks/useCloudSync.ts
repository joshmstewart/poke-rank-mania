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
      if (!isHydrated) {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ❌ SYNC HALTED: Store not hydrated yet`);
        return;
      }

      const effectiveUserId = user?.id || session?.user?.id;
      if (!effectiveUserId) {
        console.log(
          `🚨🚨🚨 [SYNC_AUDIT] 👤 No user logged in, running in anonymous mode.`
        );
        // For anonymous users, we now mark as reconciled during hydration.
        // If not reconciled for some reason, we do it here to be safe.
        if (!useTrueSkillStore.getState().sessionReconciled) {
          setSessionReconciled(true);
        }
        return;
      }

      // Thanks to our new hydration logic, this check is now the main gatekeeper.
      if (useTrueSkillStore.getState().sessionReconciled) {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ✅ Session already reconciled, skipping.`);
        return;
      }

      console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== NEW RECONCILIATION FLOW =====`);
      try {
        const localSessionId = useTrueSkillStore.getState().sessionId;

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('trueskill_session_id')
          .eq('id', effectiveUserId)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') throw profileError;

        const profileSessionId = profile?.trueskill_session_id;

        console.log(`🚨🚨🚨 [SYNC_AUDIT] Local Session ID on device: ${localSessionId}`);
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Cloud Profile Session ID: ${profileSessionId}`);

        if (profileSessionId) {
          // Cloud is the source of truth. User has a session linked to their account.
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Cloud profile has session ${profileSessionId}. This is the source of truth.`);
          if (profileSessionId !== localSessionId) {
            toast({ title: 'Syncing Your Account', description: 'Loading your progress from the cloud...', duration: 4000 });
          }
          // Set the authoritative session ID from the cloud. If it's different, this will reset local data.
          setSessionId(profileSessionId); 
          // smartSync will now load cloud data into the (potentially just-cleared) local state.
          await smartSync();

        } else if (localSessionId) {
          // User has no session in the cloud, but has an anonymous one on this device. Link it.
          console.log(`🚨🚨🚨 [SYNC_AUDIT] No session on profile. Linking local session ${localSessionId}.`);
          const { error: updateError } = await supabase.from('profiles').update({ trueskill_session_id: localSessionId }).eq('id', effectiveUserId);
          if (updateError) throw updateError;
          toast({ title: 'Account Synced', description: 'Your local progress is now linked to your account.', duration: 3000 });
          // Sync to ensure local data is pushed to the cloud under the new account association.
          await smartSync();
        } else {
          // Should not happen, as a sessionId is always generated. But as a fallback:
          console.log(`🚨🚨🚨 [SYNC_AUDIT] No cloud session and no local session. This is a fresh start.`);
           const newSessionId = useTrueSkillStore.getState().sessionId;
           await supabase.from('profiles').update({ trueskill_session_id: newSessionId }).eq('id', effectiveUserId);
        }

        console.log(`🚨🚨🚨 [SYNC_AUDIT] ✅ Reconciliation complete. Unlocking writes.`);
        setSessionReconciled(true);
      } catch (error) {
        console.error('🚨🚨🚨 [SYNC_AUDIT] CRITICAL: Reconciliation failed:', error);
        toast({ title: 'Sync Error', description: 'Could not synchronize your account data. Writes are paused.', variant: 'destructive'});
        setSessionReconciled(false); // Keep it locked
      }
    };

    syncAndReconcile();
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
