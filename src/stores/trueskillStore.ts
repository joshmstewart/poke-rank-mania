import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Rating } from 'ts-trueskill';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TrueSkillRating {
  mu: number;
  sigma: number;
  battleCount: number;
  lastUpdated: number; // Timestamp in milliseconds
}

interface RefinementBattle {
  primaryPokemonId: number;
  opponentPokemonId: number;
  priority: number;
}

interface TrueSkillStore {
  ratings: Record<string, TrueSkillRating>;
  pendingBattles: number[];
  refinementQueue: RefinementBattle[];
  sessionId: string;
  isHydrated: boolean;
  lastSyncTime: number;
  syncInProgress: boolean;
  totalBattles: number;
  totalBattlesLastUpdated: number;
  initiatePendingBattle: boolean;
  sessionReconciled: boolean;
  
  // Actions
  setSessionId: (newSessionId: string) => void;
  updateRating: (pokemonId: string, rating: Rating) => void;
  incrementBattleCount: (pokemonId: string) => void;
  incrementTotalBattles: () => void;
  setTotalBattles: (count: number) => void;
  getAllRatings: () => Record<string, TrueSkillRating>;
  getRating: (pokemonId: string) => Rating;
  hasRating: (pokemonId: string) => boolean;
  clearAllRatings: () => void;
  forceScoreBetweenNeighbors: (pokemonId: string, higherNeighborId?: string, lowerNeighborId?: string) => void;
  
  // Pending battles actions
  addPendingBattle: (pokemonId: number) => void;
  removePendingBattle: (pokemonId: number) => void;
  clearAllPendingBattles: () => void;
  isPokemonPending: (pokemonId: number) => boolean;
  getAllPendingBattles: () => number[];
  
  // Refinement queue actions
  queueBattlesForReorder: (primaryPokemonId: number, opponentIds: number[], priority: number) => number;
  getNextRefinementBattle: () => RefinementBattle | null;
  popRefinementBattle: () => void;
  hasRefinementBattles: () => boolean;
  getRefinementBattleCount: () => number;
  clearRefinementQueue: () => void;
  
  // Mode switch coordination
  setInitiatePendingBattle: (value: boolean) => void;
  setSyncStatus: (inProgress: boolean) => void;
  setSessionReconciled: (reconciled: boolean) => void;
  
  // Simplified cloud sync action
  syncToCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
  smartSync: () => Promise<void>;
  mergeCloudData: (cloudData: any) => void;
  waitForHydration: () => Promise<void>;
  restoreSessionFromCloud: (userId: string) => Promise<void>;
}

const generateSessionId = () => crypto.randomUUID();

export const useTrueSkillStore = create<TrueSkillStore>()(
  persist(
    (set, get) => ({
      ratings: {},
      pendingBattles: [],
      refinementQueue: [],
      sessionId: generateSessionId(),
      isHydrated: false,
      lastSyncTime: 0,
      syncInProgress: false,
      totalBattles: 0,
      totalBattlesLastUpdated: Date.now(),
      initiatePendingBattle: false,
      sessionReconciled: false,

      setSessionId: (newSessionId: string) => {
        const oldSessionId = get().sessionId;
        if (oldSessionId !== newSessionId) {
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Updating session ID from ${oldSessionId} to ${newSessionId}`);
          set({ sessionId: newSessionId, ratings: {}, totalBattles: 0 }); // Reset local state when changing session
        }
      },

      updateRating: (pokemonId: string, rating: Rating) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] UpdateRating called for Pokemon ${pokemonId}`);
        const now = Date.now();
        set((state) => ({
          ratings: {
            ...state.ratings,
            [pokemonId]: {
              mu: rating.mu,
              sigma: rating.sigma,
              battleCount: (state.ratings[pokemonId]?.battleCount || 0),
              lastUpdated: now
            }
          }
        }));
        get().syncToCloud();
      },

      incrementBattleCount: (pokemonId: string) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] IncrementBattleCount called for Pokemon ${pokemonId}`);
        const now = Date.now();
        set((state) => ({
          ratings: {
            ...state.ratings,
            [pokemonId]: {
              ...state.ratings[pokemonId],
              battleCount: (state.ratings[pokemonId]?.battleCount || 0) + 1,
              lastUpdated: now
            }
          }
        }));
        get().syncToCloud();
      },

      incrementTotalBattles: () => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] IncrementTotalBattles called`);
        const now = Date.now();
        set((state) => ({
          totalBattles: state.totalBattles + 1,
          totalBattlesLastUpdated: now
        }));
        get().syncToCloud();
      },

      setTotalBattles: (count: number) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] SetTotalBattles called with count: ${count}`);
        const now = Date.now();
        set({ 
          totalBattles: count,
          totalBattlesLastUpdated: now
        });
        get().syncToCloud();
      },

      getAllRatings: () => get().ratings,

      getRating: (pokemonId: string) => {
        const rating = get().ratings[pokemonId];
        if (rating) {
          return new Rating(rating.mu, rating.sigma);
        }
        return new Rating(); // Default rating
      },

      hasRating: (pokemonId: string) => {
        return pokemonId in get().ratings;
      },

      clearAllRatings: () => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ClearAllRatings called`);
        const now = Date.now();
        set({ 
          ratings: {},
          totalBattles: 0,
          totalBattlesLastUpdated: now
        });
        get().syncToCloud();
      },

      forceScoreBetweenNeighbors: (pokemonId: string, higherNeighborId?: string, lowerNeighborId?: string) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ForceScoreBetweenNeighbors called for Pokemon ${pokemonId}`);
        const state = get();
        const higherNeighborScore = higherNeighborId ? state.ratings[higherNeighborId]?.mu : undefined;
        const lowerNeighborScore = lowerNeighborId ? state.ratings[lowerNeighborId]?.mu : undefined;
        
        let targetScore: number;
        
        if (higherNeighborScore !== undefined && lowerNeighborScore !== undefined) {
          targetScore = (higherNeighborScore + lowerNeighborScore) / 2;
        } else if (higherNeighborScore !== undefined) {
          targetScore = higherNeighborScore + 1.0;
        } else if (lowerNeighborScore !== undefined) {
          targetScore = lowerNeighborScore - 1.0;
        } else {
          targetScore = 25.0; // Default TrueSkill rating
        }
        
        const newRating = new Rating(targetScore, 8.333); // Use default sigma
        get().updateRating(pokemonId, newRating);
      },

      addPendingBattle: (pokemonId: number) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] AddPendingBattle called for Pokemon ${pokemonId}`);
        let stateChanged = false;
        set((state) => {
          if (!state.pendingBattles.includes(pokemonId)) {
            console.log(`🚨🚨🚨 [SYNC_AUDIT] Adding Pokemon ${pokemonId} to pending battles`);
            stateChanged = true;
            const newPendingBattles = [...state.pendingBattles, pokemonId];
            return { pendingBattles: newPendingBattles };
          }
          return state;
        });
        if (stateChanged) {
            get().syncToCloud();
        }
      },

      removePendingBattle: (pokemonId: number) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] RemovePendingBattle called for Pokemon ${pokemonId}`);
        set((state) => ({
          pendingBattles: state.pendingBattles.filter(id => id !== pokemonId)
        }));
        get().syncToCloud();
      },

      clearAllPendingBattles: () => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ClearAllPendingBattles called`);
        set({ pendingBattles: [] });
        get().syncToCloud();
      },

      isPokemonPending: (pokemonId: number) => {
        return get().pendingBattles.includes(pokemonId);
      },

      getAllPendingBattles: () => {
        return get().pendingBattles;
      },

      queueBattlesForReorder: (primaryPokemonId: number, opponentIds: number[], priority: number) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] QueueBattlesForReorder called for Pokemon ${primaryPokemonId}`);
        
        const newBattles: RefinementBattle[] = opponentIds.map(opponentPokemonId => ({
          primaryPokemonId,
          opponentPokemonId,
          priority
        }));
        
        set((state) => {
          const updatedQueue = [...state.refinementQueue, ...newBattles]
            .sort((a, b) => a.priority - b.priority);
          
          return { refinementQueue: updatedQueue };
        });
        
        get().syncToCloud();
        return get().refinementQueue.length;
      },

      getNextRefinementBattle: () => {
        const queue = get().refinementQueue;
        return queue.length > 0 ? queue[0] : null;
      },

      popRefinementBattle: () => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] PopRefinementBattle called`);
        set((state) => {
          const newQueue = state.refinementQueue.slice(1);
          return { refinementQueue: newQueue };
        });
        get().syncToCloud();
      },

      hasRefinementBattles: () => {
        return get().refinementQueue.length > 0;
      },

      getRefinementBattleCount: () => {
        return get().refinementQueue.length;
      },

      clearRefinementQueue: () => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ClearRefinementQueue called`);
        set({ refinementQueue: [] });
        get().syncToCloud();
      },

      setInitiatePendingBattle: (value: boolean) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] SetInitiatePendingBattle called with value: ${value}`);
        set({ initiatePendingBattle: value });
      },

      setSyncStatus: (inProgress: boolean) => {
        if (!inProgress) {
            console.error(`🚨🚨🚨 [SYNC_AUDIT] Forcefully resetting sync status to false.`);
        }
        set({ syncInProgress: inProgress });
      },

      setSessionReconciled: (reconciled: boolean) => {
        set({ sessionReconciled: reconciled });
      },

      mergeCloudData: (cloudData: any) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== TIMESTAMP-BASED MERGE =====`);
        const currentState = get();
        
        // Merge ratings with timestamp priority
        const mergedRatings: Record<string, TrueSkillRating> = { ...currentState.ratings };
        
        if (cloudData.ratings) {
          Object.entries(cloudData.ratings).forEach(([pokemonId, cloudRating]: [string, any]) => {
            const localRating = currentState.ratings[pokemonId];
            
            // Add default timestamp if missing
            const cloudTimestamp = cloudRating.lastUpdated || 0;
            const localTimestamp = localRating?.lastUpdated || 0;
            
            if (!localRating || cloudTimestamp > localTimestamp) {
              console.log(`🚨🚨🚨 [SYNC_AUDIT] Using cloud data for Pokemon ${pokemonId} (cloud: ${cloudTimestamp} > local: ${localTimestamp})`);
              mergedRatings[pokemonId] = {
                ...cloudRating,
                lastUpdated: cloudTimestamp || Date.now()
              };
            } else {
              console.log(`🚨🚨🚨 [SYNC_AUDIT] Keeping local data for Pokemon ${pokemonId} (local: ${localTimestamp} > cloud: ${cloudTimestamp})`);
            }
          });
        }
        
        // Merge total battles with timestamp priority
        let mergedTotalBattles = currentState.totalBattles;
        let mergedTotalBattlesTimestamp = currentState.totalBattlesLastUpdated;
        
        if (cloudData.totalBattlesLastUpdated && cloudData.totalBattlesLastUpdated > currentState.totalBattlesLastUpdated) {
          mergedTotalBattles = cloudData.totalBattles || 0;
          mergedTotalBattlesTimestamp = cloudData.totalBattlesLastUpdated;
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Using cloud total battles: ${mergedTotalBattles}`);
        } else {
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Keeping local total battles: ${mergedTotalBattles}`);
        }
        
        // Merge pending battles and refinement queue (combine and dedupe)
        const mergedPending = [...new Set([...currentState.pendingBattles, ...(cloudData.pendingBattles || [])])];
        const mergedRefinements = [...currentState.refinementQueue, ...(cloudData.refinementQueue || [])];
        
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Merge complete - ${Object.keys(mergedRatings).length} ratings, ${mergedTotalBattles} battles`);
        
        set({
          ratings: mergedRatings,
          totalBattles: mergedTotalBattles,
          totalBattlesLastUpdated: mergedTotalBattlesTimestamp,
          pendingBattles: mergedPending,
          refinementQueue: mergedRefinements,
          isHydrated: true
        });
      },

      syncToCloud: async () => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== SYNC TO CLOUD CALLED (IMMEDIATE) =====`);

        const state = get();
        
        if (!state.sessionReconciled) {
          console.warn(`🚨🚨🚨 [SYNC_AUDIT] ❌ SYNC HALTED: Session not yet reconciled. Aborting write.`);
          return;
        }

        if (state.syncInProgress) {
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Sync already in progress, aborting`);
          return;
        }

        set({ syncInProgress: true });
        
        try {
          const ratingsBeforeSync = Object.keys(state.ratings).length;
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Starting sync with session ${state.sessionId} - ${ratingsBeforeSync} ratings, ${state.totalBattles} battles`);
          
          const payload = {
            sessionId: state.sessionId,
            ratings: state.ratings,
            totalBattles: state.totalBattles,
            totalBattlesLastUpdated: state.totalBattlesLastUpdated,
            pendingBattles: state.pendingBattles,
            refinementQueue: state.refinementQueue,
            lastUpdated: new Date().toISOString()
          };

          const { data, error } = await supabase.functions.invoke('sync-trueskill', {
            body: payload
          });

          if (error) {
            throw error;
          }

          if (data.success) {
            set({ lastSyncTime: Date.now() });
            console.log(`🚨🚨🚨 [SYNC_AUDIT] Sync successful!`);
          } else {
            throw new Error(data.error || 'Unknown sync error');
          }
        } catch (error) {
          console.error(`🚨🚨🚨 [SYNC_AUDIT] Sync failed:`, error);
          toast({
            title: 'Cloud Sync Failed',
            description: 'Could not save progress to the cloud. Your changes are saved locally.',
            variant: 'destructive',
          });
        } finally {
          set({ syncInProgress: false });
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Sync operation complete`);
        }
      },

      loadFromCloud: async () => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== LOAD FROM CLOUD CALLED =====`);
        try {
          const ratingsBeforeLoad = Object.keys(get().ratings).length;
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Loading from cloud - current ratings: ${ratingsBeforeLoad}`);
          
          const { data: result, error } = await supabase.functions.invoke('get-trueskill', {
            body: { sessionId: get().sessionId }
          });
          
          if (error) {
            throw error;
          }
          
          if (result.success && result.ratings) {
            const cloudRatingsCount = Object.keys(result.ratings).length;
            console.log(`🚨🚨🚨 [SYNC_AUDIT] Loaded ${cloudRatingsCount} ratings from cloud`);
            
            get().mergeCloudData(result);
            
            console.log(`🚨🚨🚨 [SYNC_AUDIT] Load complete - hydration flag set`);
          }
        } catch (error) {
          console.error(`🚨🚨🚨 [SYNC_AUDIT] Load from cloud failed:`, error);
          toast({
            title: 'Cloud Load Failed',
            description: 'Could not load data from the cloud. Using local data for now.',
            variant: 'destructive',
          });
          set({ isHydrated: true });
        }
      },

      smartSync: async () => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== SMART SYNC CALLED =====`);
        const state = get();
        
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Smart sync checking - sync in progress: ${state.syncInProgress}`);
        
        if (state.syncInProgress) {
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Smart sync aborting - sync already in progress`);
          return;
        }

        set({ syncInProgress: true });
        
        const ratingsBeforeSmartSync = Object.keys(state.ratings).length;
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Smart sync starting with session ${state.sessionId} - current ratings: ${ratingsBeforeSmartSync}`);

        try {
          const { data: result, error } = await supabase.functions.invoke('get-trueskill', {
            body: { sessionId: state.sessionId },
          });

          if (error) {
            console.warn(`🚨🚨🚨 [SYNC_AUDIT] Could not fetch cloud state, using local.`, error.message);
            set({ isHydrated: true });
            // Don't throw, just proceed with local data.
          }
          
          if (result && result.success) {
            const cloudRatingCount = Object.keys(result.ratings || {}).length;
            console.log(`🚨🚨🚨 [SYNC_AUDIT] Cloud state has ${cloudRatingCount} ratings. Merging...`);
            
            get().mergeCloudData(result);
            
            // REMOVED: The call to syncToCloud() was causing recursive loops.
            // SmartSync's job is to GET and MERGE data. User actions will trigger a save (syncToCloud).
            console.log(`🚨🚨🚨 [SYNC_AUDIT] Merge complete. Any subsequent user action will trigger a sync.`);
          } else {
            console.log(`🚨🚨🚨 [SYNC_AUDIT] No data from cloud or call failed. Using local state only.`);
            set({ isHydrated: true });
          }
          
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Smart sync complete - hydration flag set`);
          
        } catch (error) {
          console.error(`🚨🚨🚨 [SYNC_AUDIT] Smart sync failed:`, error);
          toast({
            title: 'Smart Sync Failed',
            description: 'Could not sync with the cloud. Check console for details.',
            variant: 'destructive',
          });
          set({ isHydrated: true }); // Ensure app doesn't hang
        } finally {
          set({ syncInProgress: false });
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Smart sync operation complete`);
        }
      },

      waitForHydration: () => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] WaitForHydration called`);
        return new Promise((resolve) => {
          if (get().isHydrated) {
            console.log(`🚨🚨🚨 [SYNC_AUDIT] Already hydrated`);
            resolve();
            return;
          }
          
          const checkHydration = () => {
            if (get().isHydrated) {
              console.log(`🚨🚨🚨 [SYNC_AUDIT] Hydration complete`);
              resolve();
            } else {
              setTimeout(checkHydration, 10);
            }
          };
          checkHydration();
        });
      },

      restoreSessionFromCloud: async (userId: string) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== RESTORE SESSION CALLED =====`);
        try {
          const ratingsBeforeRestore = Object.keys(get().ratings).length;
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Restoring session for user: ${userId} - current ratings: ${ratingsBeforeRestore}`);
          
          await get().smartSync();
          
          const ratingsAfterRestore = Object.keys(get().ratings).length;
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Session restore complete - final ratings: ${ratingsAfterRestore}`);
        } catch (error) {
          console.error(`🚨🚨🚨 [SYNC_AUDIT] Session restoration failed:`, error);
        }
      }
    }),
    {
      name: 'trueskill-storage',
      onRehydrateStorage: () => (state) => {
        const supabaseAuthToken = localStorage.getItem('sb-irgivbujlgezbxosxqgb-auth-token');

        if (state) {
          if (supabaseAuthToken) {
            console.log(`🚨🚨🚨 [HYDRATION_BYPASS] Auth token found. Bypassing localStorage data and forcing a clean state for cloud sync.`);
            // A user is logged in. The cloud is the source of truth.
            // We MUST clear any state that came from localStorage to prevent conflicts.
            // The existing sessionId is preserved to allow linking an anonymous session to a new account.
            state.ratings = {};
            state.pendingBattles = [];
            state.refinementQueue = [];
            state.totalBattles = 0;
            state.totalBattlesLastUpdated = 0;
            state.lastSyncTime = 0;
            state.sessionReconciled = false; // CRITICAL: This MUST be false to trigger cloud sync.
            
            console.log(`🚨🚨🚨 [HYDRATION_BYPASS] State has been reset. Ready for cloud reconciliation.`);
          } else {
            console.log(`🚨🚨🚨 [HYDRATION] Anonymous user. Hydrating from localStorage.`);
            // This is an anonymous user. The localStorage is their source of truth.
            state.sessionReconciled = true; // No cloud profile to reconcile with.
          }

          // This ensures that even if we bypass, the hydration status is correctly set.
          state.isHydrated = true;
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Zustand hydration complete. Session reconciled: ${state.sessionReconciled}`);
        } else {
          // This case happens if there's no localStorage data at all.
          console.log(`🚨🚨🚨 [HYDRATION] No state found in storage. Initializing fresh state.`);
        }
      }
    }
  )
);
