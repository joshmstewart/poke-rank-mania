import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useCloudSync = () => {
  const { user, session } = useAuth();
  const {
    smartSync,
    isHydrated,
    setSessionId,
    syncInProgress,
    setSyncStatus,
    setSessionReconciled,
  } = useTrueSkillStore((state) => ({
    smartSync: state.smartSync,
    isHydrated: state.isHydrated,
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
      // The isHydrated check is removed from here because for logged-in users,
      // this effect is the *source* of hydration.

      const effectiveUserId = user?.id || session?.user?.id;
      if (!effectiveUserId) {
        console.log(
          `🚨🚨🚨 [SYNC_AUDIT] 👤 No user logged in, running in anonymous mode.`
        );
        // For anonymous users, if they aren't hydrated, we mark them as such.
        // This handles fresh visits with no localStorage.
        if (!useTrueSkillStore.getState().isHydrated) {
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Marking anonymous user as hydrated.`);
          useTrueSkillStore.setState({ sessionReconciled: true, isHydrated: true });
        }
        return;
      }

      // Gatekeeper to prevent re-reconciliation.
      if (useTrueSkillStore.getState().sessionReconciled) {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ✅ Session already reconciled, skipping.`);
        // If we are reconciled but not hydrated, it means something went wrong.
        // Let's force hydration to unblock the app.
        if (!isHydrated) {
          console.warn(`🚨🚨🚨 [SYNC_AUDIT] Reconciled but not hydrated. Forcing hydration flag.`);
          useTrueSkillStore.setState({ isHydrated: true });
        }
        return;
      }

      console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== NEW RECONCILIATION FLOW TRIGGERED =====`);
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
          // smartSync will now load cloud data and mark as hydrated.
          await smartSync();

        } else if (localSessionId) {
          // User has no session in the cloud, but has an anonymous one on this device. Link it.
          console.log(`🚨🚨🚨 [SYNC_AUDIT] No session on profile. Linking local session ${localSessionId}.`);
          const { error: updateError } = await supabase.from('profiles').update({ trueskill_session_id: localSessionId }).eq('id', effectiveUserId);
          if (updateError) throw updateError;
          toast({ title: 'Account Synced', description: 'Your local progress is now linked to your account.', duration: 3000 });
          // Sync to ensure local data is pushed and state is hydrated.
          await smartSync();
        } else {
          // Should not happen, as a sessionId is always generated. But as a fallback:
          console.log(`🚨🚨🚨 [SYNC_AUDIT] No cloud session and no local session. This is a fresh start.`);
           const newSessionId = useTrueSkillStore.getState().sessionId;
           await supabase.from('profiles').update({ trueskill_session_id: newSessionId }).eq('id', effectiveUserId);
           // Hydrate the app after linking.
           await smartSync();
        }

        console.log(`🚨🚨🚨 [SYNC_AUDIT] ✅ Reconciliation complete. Unlocking writes.`);
        setSessionReconciled(true);
      } catch (error) {
        console.error('🚨🚨🚨 [SYNC_AUDIT] CRITICAL: Reconciliation failed:', error);
        toast({ title: 'Sync Error', description: 'Could not synchronize your account data. Writes are paused.', variant: 'destructive'});
        setSessionReconciled(false); // Keep it locked
        // Still mark as hydrated to unblock UI, even on failure.
        if (!isHydrated) {
            useTrueSkillStore.setState({ isHydrated: true });
        }
      }
    };

    syncAndReconcile();
  }, [user?.id, session?.user?.id, setSessionId, smartSync, setSessionReconciled, isHydrated]);

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
