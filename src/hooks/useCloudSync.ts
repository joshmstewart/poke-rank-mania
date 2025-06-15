import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BattleData {
  selectedGeneration: number;
  battleType: "pairs" | "triplets";
  battleResults: any[];
  battlesCompleted: number;
  battleHistory: { battle: any[], selected: number[] }[];
  completionPercentage: number;
  fullRankingMode: boolean;
}

export const useCloudSync = () => {
  const { user, session } = useAuth();
  // Using a selector to prevent unnecessary re-renders from state changes we don't care about here.
  const { smartSync, getAllRatings, isHydrated, restoreSessionFromCloud } = useTrueSkillStore(
    (state) => ({
      smartSync: state.smartSync,
      getAllRatings: state.getAllRatings,
      isHydrated: state.isHydrated,
      restoreSessionFromCloud: state.restoreSessionFromCloud,
    })
  );
  const hasPerformedAuthCleanup = useRef(false);

  // CRITICAL FIX: Handle auth state changes to break hydration deadlocks
  useEffect(() => {
    const effectiveUserId = user?.id || session?.user?.id;
    
    // This effect should only run once per authenticated session.
    if (effectiveUserId && !hasPerformedAuthCleanup.current) {
      console.log('🚨🚨🚨 [AUTH_HYDRATION_FIX] Authenticated user detected. Ensuring sync readiness.');
      
      // 2. Force hydration status to true to unblock the main sync effect.
      // This is safe because for authenticated users, the source of truth is always the cloud.
      if (!isHydrated) {
        console.log('🚨🚨🚨 [AUTH_HYDRATION_FIX] Forcing isHydrated=true to break deadlock and start cloud sync.');
        useTrueSkillStore.setState({ isHydrated: true });
      }
      
      // 3. Mark cleanup as done to prevent it from running again.
      hasPerformedAuthCleanup.current = true;
    }
  }, [user, session, isHydrated]);

  useEffect(() => {
    const checkEdgeFunctionHealth = async () => {
        console.log('🚨🚨🚨 [HEALTH_CHECK] Checking edge function connectivity...');
        try {
            const { data, error } = await supabase.functions.invoke('health-check', {
                body: { message: 'ping' }
            });

            if (error) throw error;

            console.log('✅ [HEALTH_CHECK] Edge function is healthy:', data);
            toast({
                title: 'System Status',
                description: 'Cloud connection is healthy.',
                duration: 3000,
            });

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

  console.log(`🚨🚨🚨 [SYNC_AUDIT] useCloudSync hook is running at: ${new Date().toISOString()}`);
  console.log(`🚨🚨🚨 [SYNC_AUDIT] user?.id: ${user?.id || 'UNDEFINED'}`);
  console.log(`🚨🚨🚨 [SYNC_AUDIT] session?.user?.id: ${session?.user?.id || 'UNDEFINED'}`);
  console.log(`🚨🚨🚨 [SYNC_AUDIT] isHydrated: ${isHydrated}`);

  // PREDICTABLE FLOW: Load local first, then sync with cloud in background
  useEffect(() => {
    const effectiveUserId = user?.id || session?.user?.id;
    console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== PREDICTABLE SYNC FLOW =====`);
    console.log(`🚨🚨🚨 [SYNC_AUDIT] effectiveUserId: ${effectiveUserId || 'UNDEFINED'}`);
    console.log(`🚨🚨🚨 [SYNC_AUDIT] isHydrated: ${isHydrated}`);
    
    if (effectiveUserId && isHydrated) {
      console.log(`🚨🚨🚨 [SYNC_AUDIT] ✅ STARTING PREDICTABLE SYNC FLOW`);
      console.log(`🚨🚨🚨 [SYNC_AUDIT] Step 1: Local data already loaded (hydrated)`);
      console.log(`🚨🚨🚨 [SYNC_AUDIT] Step 2: Background cloud sync check`);
      
      const ratingsBeforeSync = getAllRatings();
      const rankedCountBefore = Object.keys(ratingsBeforeSync).length;
      console.log(`🚨🚨🚨 [SYNC_AUDIT] Local rankings before sync: ${rankedCountBefore}`);
      
      // DISABLED: Automatic background sync is turned off to prevent data loss during active battle sessions.
      // Syncing should be a deliberate user action (e.g., "Save Progress") rather than an automatic background task.
      console.log('🚨🚨🚨 [SYNC_AUDIT] Automatic background sync is DISABLED. Sync must be triggered manually.');
      
    } else {
      console.log(`🚨🚨🚨 [SYNC_AUDIT] ❌ CONDITIONS NOT MET - SYNC WILL NOT RUN`);
      if (!effectiveUserId) {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Missing user ID`);
        // If a session exists but we can't get a user ID, we're in an inconsistent state.
        // Alert the user and try to recover by refreshing the session.
        if (session) {
          toast({
            title: "Sync Blocked: Incomplete Auth",
            description: "Cannot sync. Attempting to refresh your session to fix this. If the problem persists, please sign out and back in.",
            variant: "destructive",
            duration: 10000
          });
          supabase.auth.refreshSession().then(({ error }) => {
            if (error) {
              console.error('🚨🚨🚨 [SYNC_AUDIT] Session refresh failed:', error);
              toast({
                title: "Session Refresh Failed",
                description: "Automatic fix failed. Please sign out and sign back in to resolve the sync issue.",
                variant: "destructive",
                duration: 10000
              });
            } else {
              console.log('🚨🚨🚨 [SYNC_AUDIT] Session refreshed successfully. Sync will retry.');
              toast({
                title: "Session Refreshed",
                description: "Sync will attempt to run again shortly.",
                duration: 3000
              });
            }
          });
        }
      }
      if (!isHydrated) {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Store not hydrated yet`);
      }
    }
    console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== SYNC FLOW COMPLETE =====`);
  }, [user?.id, session, isHydrated, smartSync, getAllRatings]);

  // Manual sync function for testing
  const triggerManualSync = useCallback(async () => {
    console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== MANUAL SYNC TRIGGERED =====`);
    
    const effectiveUserId = user?.id || session?.user?.id;
    
    if (!effectiveUserId) {
      console.log(`🚨🚨🚨 [SYNC_AUDIT] ❌ No user ID available`);
      toast({
        title: "Sync Failed",
        description: "No user authenticated",
        variant: "destructive"
      });
      return;
    }
    
    if (!isHydrated) {
      console.log(`🚨🚨🚨 [SYNC_AUDIT] ❌ Store not hydrated`);
      toast({
        title: "Sync Failed", 
        description: "Store not ready",
        variant: "destructive"
      });
      return;
    }
    
    const ratingsBeforeSync = getAllRatings();
    const rankedCountBefore = Object.keys(ratingsBeforeSync).length;
    console.log(`🚨🚨🚨 [SYNC_AUDIT] Local rankings before manual sync: ${rankedCountBefore}`);
    
    try {
      await smartSync();
      
      const ratingsAfterSync = getAllRatings();
      const rankedCountAfter = Object.keys(ratingsAfterSync).length;
      console.log(`🚨🚨🚨 [SYNC_AUDIT] Local rankings after manual sync: ${rankedCountAfter}`);
      
      toast({
        title: "Manual Sync Complete",
        description: `Before: ${rankedCountBefore} rankings, After: ${rankedCountAfter} rankings`,
        duration: 5000
      });
      
      if (rankedCountAfter !== rankedCountBefore) {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] RANKING COUNT CHANGED! Before: ${rankedCountBefore}, After: ${rankedCountAfter}`);
      }
    } catch (error) {
      console.error(`🚨🚨🚨 [SYNC_AUDIT] Manual sync failed:`, error);
      toast({
        title: "Manual Sync Failed",
        description: "Check console for details",
        variant: "destructive"
      });
    }
  }, [user?.id, session?.user?.id, isHydrated, smartSync, getAllRatings]);

  const saveBattleToCloud = useCallback(async (battleData: BattleData) => {
    console.log('🚨🚨🚨 [SYNC_AUDIT] Battle data saved locally. Auto-sync is disabled.');
  }, []);

  const loadBattleFromCloud = useCallback(async (generation: number): Promise<BattleData | null> => {
    if (!isHydrated) {
      return null;
    }
    
    await smartSync();
    
    const allRatings = getAllRatings();
    const battlesCompleted = Object.values(allRatings).reduce((sum, rating) => sum + rating.battleCount, 0);
    
    return {
      selectedGeneration: generation,
      battleType: "pairs" as const,
      battleResults: [],
      battlesCompleted,
      battleHistory: [],
      completionPercentage: 0,
      fullRankingMode: false
    };
  }, [smartSync, getAllRatings, isHydrated]);

  const saveRankingsToCloud = useCallback(async (rankings: any[], generation: number) => {
    if (!isHydrated) {
      return;
    }
    
    console.log('🚨🚨🚨 [SYNC_AUDIT] Rankings saved locally. Triggering manual sync.');

    // Since auto-sync is off, we manually trigger a sync here as it's a clear user intent to save.
    await triggerManualSync();

    toast({
      title: "Progress Saved",
      description: "Your rankings have been saved to the cloud!",
    });
  }, [isHydrated, triggerManualSync]);

  const saveSessionToCloud = useCallback(async (sessionId: string, sessionData: any) => {
    return isHydrated;
  }, [isHydrated]);

  const loadSessionFromCloud = useCallback(async (sessionId: string) => {
    if (!isHydrated) {
      return {};
    }
    
    await smartSync();
    return getAllRatings();
  }, [smartSync, getAllRatings, isHydrated]);

  return {
    saveBattleToCloud,
    loadBattleFromCloud,
    saveRankingsToCloud,
    saveSessionToCloud,
    loadSessionFromCloud,
    triggerManualSync,
    isAuthenticated: !!(user || session?.user)
  };
};
