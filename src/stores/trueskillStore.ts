import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Rating } from 'ts-trueskill';
import { toast } from '@/hooks/use-toast';

interface TrueSkillRating {
  mu: number;
  sigma: number;
  battleCount: number;
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
  initiatePendingBattle: boolean;
  localStateVersion: number; // For conflict resolution
  
  // Actions
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
  
  // Enhanced cloud sync actions
  syncToCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
  smartSync: () => Promise<void>;
  waitForHydration: () => Promise<void>;
  restoreSessionFromCloud: (userId: string) => Promise<void>;
  mergePendingState: (cloudPending: number[], localPending: number[]) => number[];
  mergeRatingsState: (cloudRatings: Record<string, TrueSkillRating>, localRatings: Record<string, TrueSkillRating>) => Record<string, TrueSkillRating>;
}

const generateSessionId = () => crypto.randomUUID();

// CRITICAL FIX: Remove debounce completely for immediate sync
let syncTimeout: ReturnType<typeof setTimeout> | null = null;

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
      initiatePendingBattle: false,
      localStateVersion: 0,

      updateRating: (pokemonId: string, rating: Rating) => {
        console.log(`🔄 [SYNC_PHASE1] UpdateRating called for Pokemon ${pokemonId} - mu: ${rating.mu.toFixed(2)}`);
        set((state) => ({
          ratings: {
            ...state.ratings,
            [pokemonId]: {
              mu: rating.mu,
              sigma: rating.sigma,
              battleCount: (state.ratings[pokemonId]?.battleCount || 0) + 1
            }
          },
          localStateVersion: state.localStateVersion + 1
        }));
        
        console.log(`🔄 [SYNC_PHASE1] Triggering immediate syncToCloud from updateRating`);
        get().syncToCloud();
      },

      incrementBattleCount: (pokemonId: string) => {
        console.log(`🔄 [SYNC_PHASE1] IncrementBattleCount called for Pokemon ${pokemonId}`);
        set((state) => ({
          ratings: {
            ...state.ratings,
            [pokemonId]: {
              ...state.ratings[pokemonId],
              battleCount: (state.ratings[pokemonId]?.battleCount || 0) + 1
            }
          },
          localStateVersion: state.localStateVersion + 1
        }));
      },

      incrementTotalBattles: () => {
        console.log(`🔄 [SYNC_PHASE1] IncrementTotalBattles called`);
        set((state) => ({
          totalBattles: state.totalBattles + 1,
          localStateVersion: state.localStateVersion + 1
        }));
        
        console.log(`🔄 [SYNC_PHASE1] Triggering immediate syncToCloud from incrementTotalBattles`);
        get().syncToCloud();
      },

      setTotalBattles: (count: number) => {
        console.log(`🔄 [SYNC_PHASE1] SetTotalBattles called with count: ${count}`);
        set({ totalBattles: count });
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
        console.log(`🔄 [SYNC_PHASE1] ClearAllRatings called`);
        set({ 
          ratings: {},
          totalBattles: 0,
          localStateVersion: 0
        });
        console.log(`🔄 [SYNC_PHASE1] Triggering immediate syncToCloud from clearAllRatings`);
        get().syncToCloud();
      },

      forceScoreBetweenNeighbors: (pokemonId: string, higherNeighborId?: string, lowerNeighborId?: string) => {
        console.log(`🔒 [SIMPLIFIED] ForceScoreBetweenNeighbors called for Pokemon ${pokemonId} - MANUAL DRAG OPERATION`);
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
        
        console.log(`🔒 [SIMPLIFIED] Setting manual score for ${pokemonId}: ${targetScore.toFixed(2)}`);
        
        const newRating = new Rating(targetScore, 8.333); // Use default sigma
        set((state) => ({
          ratings: {
            ...state.ratings,
            [pokemonId]: {
              mu: newRating.mu,
              sigma: newRating.sigma,
              battleCount: (state.ratings[pokemonId]?.battleCount || 0) + 1
            }
          },
          localStateVersion: state.localStateVersion + 1
        }));
        
        console.log(`🔒 [SIMPLIFIED] Triggering immediate syncToCloud from manual drag operation`);
        get().syncToCloud();
      },

      // PHASE 2: Enhanced pending battles with conflict resolution
      addPendingBattle: (pokemonId: number) => {
        console.log(`🔄 [SYNC_PHASE2] AddPendingBattle called for Pokemon ${pokemonId}`);
        set((state) => {
          if (!state.pendingBattles.includes(pokemonId)) {
            console.log(`🔄 [SYNC_PHASE2] Adding Pokemon ${pokemonId} to pending battles`);
            const newPendingBattles = [...state.pendingBattles, pokemonId];
            return { 
              pendingBattles: newPendingBattles,
              localStateVersion: state.localStateVersion + 1
            };
          }
          return state;
        });
        
        console.log(`🔄 [SYNC_PHASE2] Triggering immediate syncToCloud from addPendingBattle`);
        get().syncToCloud();
      },

      removePendingBattle: (pokemonId: number) => {
        console.log(`🔄 [SYNC_PHASE2] RemovePendingBattle called for Pokemon ${pokemonId}`);
        set((state) => ({
          pendingBattles: state.pendingBattles.filter(id => id !== pokemonId),
          localStateVersion: state.localStateVersion + 1
        }));
        
        console.log(`🔄 [SYNC_PHASE2] Triggering immediate syncToCloud from removePendingBattle`);
        get().syncToCloud();
      },

      clearAllPendingBattles: () => {
        console.log(`🔄 [SYNC_PHASE2] ClearAllPendingBattles called`);
        set((state) => ({ 
          pendingBattles: [],
          localStateVersion: state.localStateVersion + 1
        }));
        console.log(`🔄 [SYNC_PHASE2] Triggering immediate syncToCloud from clearAllPendingBattles`);
        get().syncToCloud();
      },

      isPokemonPending: (pokemonId: number) => {
        return get().pendingBattles.includes(pokemonId);
      },

      getAllPendingBattles: () => {
        return get().pendingBattles;
      },

      // PHASE 2: Enhanced conflict resolution methods
      mergePendingState: (cloudPending: number[], localPending: number[]) => {
        console.log(`🔄 [SYNC_PHASE2] Merging pending state - Cloud: ${cloudPending.length}, Local: ${localPending.length}`);
        
        // Prefer local pending state for recently completed battles
        // but merge new additions from cloud
        const merged = [...new Set([...localPending, ...cloudPending])];
        
        console.log(`🔄 [SYNC_PHASE2] Merged pending result: ${merged.length} Pokemon`);
        return merged;
      },

      mergeRatingsState: (cloudRatings: Record<string, TrueSkillRating>, localRatings: Record<string, TrueSkillRating>) => {
        console.log(`🔄 [SYNC_PHASE2] Merging ratings state - Cloud: ${Object.keys(cloudRatings).length}, Local: ${Object.keys(localRatings).length}`);
        
        const merged: Record<string, TrueSkillRating> = { ...cloudRatings };
        
        // For each local rating, decide whether to use local or cloud version
        Object.entries(localRatings).forEach(([pokemonId, localRating]) => {
          const cloudRating = cloudRatings[pokemonId];
          
          if (!cloudRating) {
            // New local rating, use it
            merged[pokemonId] = localRating;
            console.log(`🔄 [SYNC_PHASE2] Using new local rating for ${pokemonId}`);
          } else if (localRating.battleCount > cloudRating.battleCount) {
            // Local has more battles, prefer it
            merged[pokemonId] = localRating;
            console.log(`🔄 [SYNC_PHASE2] Using local rating with more battles for ${pokemonId}`);
          } else {
            // Use cloud rating
            console.log(`🔄 [SYNC_PHASE2] Using cloud rating for ${pokemonId}`);
          }
        });
        
        console.log(`🔄 [SYNC_PHASE2] Merged ratings result: ${Object.keys(merged).length} Pokemon`);
        return merged;
      },

      queueBattlesForReorder: (primaryPokemonId: number, opponentIds: number[], priority: number) => {
        console.log(`🔄 [SYNC_PHASE1] QueueBattlesForReorder called for Pokemon ${primaryPokemonId}`);
        
        const newBattles: RefinementBattle[] = opponentIds.map(opponentPokemonId => ({
          primaryPokemonId,
          opponentPokemonId,
          priority
        }));
        
        set((state) => {
          const updatedQueue = [...state.refinementQueue, ...newBattles]
            .sort((a, b) => a.priority - b.priority);
          
          return { 
            refinementQueue: updatedQueue,
            localStateVersion: state.localStateVersion + 1
          };
        });
        
        const finalLength = get().refinementQueue.length;
        
        console.log(`🔄 [SYNC_PHASE1] Triggering immediate syncToCloud from queueBattlesForReorder`);
        get().syncToCloud();
        
        return finalLength;
      },

      getNextRefinementBattle: () => {
        const queue = get().refinementQueue;
        return queue.length > 0 ? queue[0] : null;
      },

      popRefinementBattle: () => {
        console.log(`🔄 [SYNC_PHASE1] PopRefinementBattle called`);
        set((state) => {
          const newQueue = state.refinementQueue.slice(1);
          return { 
            refinementQueue: newQueue,
            localStateVersion: state.localStateVersion + 1
          };
        });
        
        console.log(`🔄 [SYNC_PHASE1] Triggering immediate syncToCloud from popRefinementBattle`);
        get().syncToCloud();
      },

      hasRefinementBattles: () => {
        return get().refinementQueue.length > 0;
      },

      getRefinementBattleCount: () => {
        return get().refinementQueue.length;
      },

      clearRefinementQueue: () => {
        console.log(`🔄 [SYNC_PHASE1] ClearRefinementQueue called`);
        set((state) => ({ 
          refinementQueue: [],
          localStateVersion: state.localStateVersion + 1
        }));
        console.log(`🔄 [SYNC_PHASE1] Triggering immediate syncToCloud from clearRefinementQueue`);
        get().syncToCloud();
      },

      setInitiatePendingBattle: (value: boolean) => {
        console.log(`🔄 [SYNC_PHASE1] SetInitiatePendingBattle called with value: ${value}`);
        set({ initiatePendingBattle: value });
      },

      // PHASE 1 & 3: Enhanced sync with immediate execution and detailed logging
      syncToCloud: async () => {
        console.log(`🔄 [SYNC_PHASE3] ===== IMMEDIATE SYNC TO CLOUD CALLED =====`);
        
        // PHASE 3: Remove debounce completely for critical operations
        if (syncTimeout) {
          console.log(`🔄 [SYNC_PHASE3] Clearing any existing sync timeout`);
          clearTimeout(syncTimeout);
          syncTimeout = null;
        }
        
        const state = get();
        
        console.log(`🔄 [SYNC_PHASE3] Checking sync in progress: ${state.syncInProgress}`);
        if (state.syncInProgress) {
          console.log(`🔄 [SYNC_PHASE3] Sync already in progress, aborting`);
          return;
        }

        set({ syncInProgress: true });
        
        try {
          const ratingsBeforeSync = Object.keys(state.ratings).length;
          const pendingBeforeSync = state.pendingBattles.length;
          console.log(`🔄 [SYNC_PHASE3] Starting immediate sync - ${ratingsBeforeSync} ratings, ${state.totalBattles} battles, ${pendingBeforeSync} pending`);
          
          // PHASE 1: Enhanced logging for what's being synced
          const syncData = {
            sessionId: state.sessionId,
            ratings: state.ratings,
            totalBattles: state.totalBattles,
            pendingBattles: state.pendingBattles,
            refinementQueue: state.refinementQueue,
            localStateVersion: state.localStateVersion,
            lastUpdated: new Date().toISOString()
          };
          
          console.log(`🔄 [SYNC_PHASE3] Sync payload prepared:`, {
            ratingsCount: Object.keys(syncData.ratings).length,
            pendingCount: syncData.pendingBattles.length,
            totalBattles: syncData.totalBattles,
            stateVersion: syncData.localStateVersion
          });
          
          const response = await fetch('https://irgivbujlgezbxosxqgb.supabase.co/functions/v1/sync-trueskill', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2l2YnVqbGdlemJ4b3N4cWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1Njg0ODgsImV4cCI6MjA2NDE0NDQ4OH0.KFBQazOEgvy4Q14OHpHLve12brZG7Rgaf_CypY74zrs`
            },
            body: JSON.stringify(syncData)
          });

          const raw = await response.text();
          console.log(`🔄 [SYNC_PHASE3] Sync response status: ${response.status}`);

          if (!response.ok) {
            throw new Error(`Sync failed: ${response.status} - ${raw}`);
          }

          let result: any;
          try {
            result = JSON.parse(raw);
          } catch (jsonError) {
            console.error(`🔄 [SYNC_PHASE3] Failed to parse JSON: ${raw}`);
            toast({
              title: 'Sync Error',
              description: 'Unexpected response from the server.',
              variant: 'destructive'
            });
            return;
          }

          if (result.success) {
            set({ lastSyncTime: Date.now() });
            console.log(`🔄 [SYNC_PHASE3] ✅ Immediate sync successful!`);
            
            // PHASE 4: Visual confirmation of successful sync
            if (ratingsBeforeSync > 0 || pendingBeforeSync > 0) {
              console.log(`🔄 [SYNC_PHASE4] Sync confirmed - data persisted to cloud`);
            }
          } else {
            throw new Error(result.error || 'Unknown sync error');
          }
        } catch (error) {
          console.error(`🔄 [SYNC_PHASE3] ❌ Immediate sync failed:`, error);
          
          // PHASE 4: Error recovery notification
          toast({
            title: 'Sync Failed',
            description: 'Changes may not be saved. Please try again.',
            variant: 'destructive'
          });
        } finally {
          set({ syncInProgress: false });
          console.log(`🔄 [SYNC_PHASE3] Immediate sync operation complete`);
        }
      },

      loadFromCloud: async () => {
        console.log(`🔄 [SYNC_PHASE2] ===== LOAD FROM CLOUD CALLED =====`);
        try {
          const currentState = get();
          const ratingsBeforeLoad = Object.keys(currentState.ratings).length;
          const pendingBeforeLoad = currentState.pendingBattles.length;
          console.log(`🔄 [SYNC_PHASE2] Loading from cloud - current local state: ${ratingsBeforeLoad} ratings, ${pendingBeforeLoad} pending`);
          
          const response = await fetch('https://irgivbujlgezbxosxqgb.supabase.co/functions/v1/get-trueskill', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2l2YnVqbGdlemJ4b3N4cWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1Njg0ODgsImV4cCI6MjA2NDE0NDQ4OH0.KFBQazOEgvy4Q14OHpHLve12brZG7Rgaf_CypY74zrs`
            },
            body: JSON.stringify({ sessionId: currentState.sessionId })
          });
          
          console.log(`🔄 [SYNC_PHASE2] Load response status: ${response.status}`);
          
          if (!response.ok) {
            throw new Error(`Load failed: ${response.status}`);
          }
          
          const result = await response.json();
          if (result.success && result.ratings) {
            const cloudRatingsCount = Object.keys(result.ratings).length;
            const cloudPendingCount = (result.pendingBattles || []).length;
            console.log(`🔄 [SYNC_PHASE2] Loaded from cloud: ${cloudRatingsCount} ratings, ${cloudPendingCount} pending`);
            
            // PHASE 2: Smart state merging instead of overwriting
            const mergedRatings = get().mergeRatingsState(result.ratings || {}, currentState.ratings);
            const mergedPending = get().mergePendingState(result.pendingBattles || [], currentState.pendingBattles);
            
            console.log(`🔄 [SYNC_PHASE2] After merging: ${Object.keys(mergedRatings).length} ratings, ${mergedPending.length} pending`);
            
            set({
              ratings: mergedRatings,
              totalBattles: Math.max(result.totalBattles || 0, currentState.totalBattles),
              pendingBattles: mergedPending,
              refinementQueue: result.refinementQueue || currentState.refinementQueue,
              isHydrated: true
            });
            
            console.log(`🔄 [SYNC_PHASE2] ✅ Smart hydration complete with state merging`);
          }
        } catch (error) {
          console.error(`🔄 [SYNC_PHASE2] ❌ Load from cloud failed:`, error);
        }
      },

      smartSync: async () => {
        console.log(`🔄 [SYNC_PHASE3] ===== SMART SYNC CALLED =====`);
        const state = get();
        
        console.log(`🔄 [SYNC_PHASE3] Smart sync checking - sync in progress: ${state.syncInProgress}`);
        
        if (state.syncInProgress) {
          console.log(`🔄 [SYNC_PHASE3] Smart sync aborting - sync already in progress`);
          return;
        }

        set({ syncInProgress: true });
        
        const ratingsBeforeSmartSync = Object.keys(state.ratings).length;
        const pendingBeforeSmartSync = state.pendingBattles.length;
        console.log(`🔄 [SYNC_PHASE3] Smart sync starting - current state: ${ratingsBeforeSmartSync} ratings, ${pendingBeforeSmartSync} pending`);

        try {
          const localState = {
            ratings: state.ratings,
            totalBattles: state.totalBattles,
            pendingBattles: state.pendingBattles,
            refinementQueue: state.refinementQueue,
            localStateVersion: state.localStateVersion
          };
          
          console.log(`🔄 [SYNC_PHASE3] Local state summary:`, {
            ratingsCount: Object.keys(localState.ratings).length,
            pendingCount: localState.pendingBattles.length,
            totalBattles: localState.totalBattles,
            stateVersion: localState.localStateVersion
          });
          
          // First try to get the latest from cloud
          await get().loadFromCloud();
          
          // Then sync our local changes
          await get().syncToCloud();
          
          console.log(`🔄 [SYNC_PHASE3] ✅ Smart sync completed successfully`);
        } catch (error) {
          console.error(`🔄 [SYNC_PHASE3] ❌ Smart sync failed:`, error);
        } finally {
          set({ syncInProgress: false });
        }
      },

      waitForHydration: async () => {
        return new Promise<void>((resolve) => {
          const checkHydration = () => {
            if (get().isHydrated) {
              resolve();
            } else {
              setTimeout(checkHydration, 100);
            }
          };
          checkHydration();
        });
      },

      restoreSessionFromCloud: async (userId: string) => {
        console.log(`🔄 [SYNC_PHASE2] ===== RESTORE SESSION FROM CLOUD =====`);
        console.log(`🔄 [SYNC_PHASE2] Restoring for user: ${userId}`);
        
        try {
          await get().smartSync();
          console.log(`🔄 [SYNC_PHASE2] ✅ Session restore completed with smart sync`);
        } catch (error) {
          console.error(`🔄 [SYNC_PHASE2] ❌ Session restore failed:`, error);
        }
      }
    }),
    {
      name: 'trueskill-storage',
      onRehydrateStorage: () => (state) => {
        console.log(`🔄 [SYNC_PHASE2] Store rehydrated with ${Object.keys(state?.ratings || {}).length} ratings`);
        if (state) {
          state.isHydrated = true;
        }
      }
    }
  )
);
