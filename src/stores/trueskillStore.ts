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

interface ChangeTracker {
  changedRatings: Set<string>;
  changedPending: boolean;
  lastSyncVersion: number;
}

interface TrueSkillStore {
  ratings: Record<string, TrueSkillRating>;
  pendingBattles: number[];
  refinementQueue: RefinementBattle[];
  sessionId: string;
  isHydrated: boolean;
  lastSyncTime: number;
  lastSyncTimestamp: string;
  syncInProgress: boolean;
  totalBattles: number;
  initiatePendingBattle: boolean;
  localStateVersion: number;
  
  // NEW: Performance tracking
  changeTracker: ChangeTracker;
  batchSyncTimeout: ReturnType<typeof setTimeout> | null;
  
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
  
  // NEW: Optimized sync actions
  incrementalSync: () => Promise<void>;
  batchedSync: () => void;
  backgroundSync: () => void;
  resetChangeTracker: () => void;
  
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

export const useTrueSkillStore = create<TrueSkillStore>()(
  persist(
    (set, get) => ({
      ratings: {},
      pendingBattles: [],
      refinementQueue: [],
      sessionId: generateSessionId(),
      isHydrated: false,
      lastSyncTime: 0,
      lastSyncTimestamp: '',
      syncInProgress: false,
      totalBattles: 0,
      initiatePendingBattle: false,
      localStateVersion: 0,
      
      // NEW: Performance tracking
      changeTracker: {
        changedRatings: new Set(),
        changedPending: false,
        lastSyncVersion: 0
      },
      batchSyncTimeout: null,

      updateRating: (pokemonId: string, rating: Rating) => {
        console.log(`🚀 [PERF_SYNC] UpdateRating called for Pokemon ${pokemonId} - mu: ${rating.mu.toFixed(2)}`);
        console.log(`🐛 [STORE_DEBUG] BEFORE updateRating - existing rating: ${JSON.stringify(get().ratings[pokemonId])}`);
        
        set((state) => ({
          ratings: {
            ...state.ratings,
            [pokemonId]: {
              mu: rating.mu,
              sigma: rating.sigma,
              battleCount: (state.ratings[pokemonId]?.battleCount || 0) + 1
            }
          },
          localStateVersion: state.localStateVersion + 1,
          changeTracker: {
            ...state.changeTracker,
            changedRatings: new Set([...state.changeTracker.changedRatings, pokemonId])
          }
        }));
        
        console.log(`🐛 [STORE_DEBUG] AFTER updateRating - new rating: ${JSON.stringify(get().ratings[pokemonId])}`);
        console.log(`🚀 [PERF_SYNC] Triggering batched sync for rating update`);
        get().batchedSync();
      },

      incrementBattleCount: (pokemonId: string) => {
        console.log(`🚀 [PERF_SYNC] IncrementBattleCount called for Pokemon ${pokemonId}`);
        set((state) => ({
          ratings: {
            ...state.ratings,
            [pokemonId]: {
              ...state.ratings[pokemonId],
              battleCount: (state.ratings[pokemonId]?.battleCount || 0) + 1
            }
          },
          localStateVersion: state.localStateVersion + 1,
          changeTracker: {
            ...state.changeTracker,
            changedRatings: new Set([...state.changeTracker.changedRatings, pokemonId])
          }
        }));
      },

      incrementTotalBattles: () => {
        console.log(`🚀 [PERF_SYNC] IncrementTotalBattles called`);
        set((state) => ({
          totalBattles: state.totalBattles + 1,
          localStateVersion: state.localStateVersion + 1
        }));
        
        console.log(`🚀 [PERF_SYNC] Triggering batched sync for total battles`);
        get().batchedSync();
      },

      setTotalBattles: (count: number) => {
        console.log(`🚀 [PERF_SYNC] SetTotalBattles called with count: ${count}`);
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
        console.log(`🚀 [PERF_SYNC] ClearAllRatings called`);
        set({ 
          ratings: {},
          totalBattles: 0,
          localStateVersion: 0,
          changeTracker: {
            changedRatings: new Set(),
            changedPending: true,
            lastSyncVersion: 0
          }
        });
        console.log(`🚀 [PERF_SYNC] Triggering immediate sync for clear all`);
        get().syncToCloud();
      },

      forceScoreBetweenNeighbors: (pokemonId: string, higherNeighborId?: string, lowerNeighborId?: string) => {
        console.log(`🚀 [PERF_SYNC] ForceScoreBetweenNeighbors called for Pokemon ${pokemonId} - MANUAL DRAG OPERATION`);
        console.log(`🐛 [STORE_DEBUG] ===== FORCE SCORE DEBUG START =====`);
        
        const state = get();
        
        console.log(`🐛 [STORE_DEBUG] Current rating BEFORE force: ${JSON.stringify(state.ratings[pokemonId])}`);
        
        const higherNeighborScore = higherNeighborId ? state.ratings[higherNeighborId]?.mu : undefined;
        const lowerNeighborScore = lowerNeighborId ? state.ratings[lowerNeighborId]?.mu : undefined;
        
        console.log(`🐛 [STORE_DEBUG] Higher neighbor ${higherNeighborId} score: ${higherNeighborScore}`);
        console.log(`🐛 [STORE_DEBUG] Lower neighbor ${lowerNeighborId} score: ${lowerNeighborScore}`);
        
        let targetScore: number;
        
        if (higherNeighborScore !== undefined && lowerNeighborScore !== undefined) {
          targetScore = (higherNeighborScore + lowerNeighborScore) / 2;
          console.log(`🐛 [STORE_DEBUG] Calculated midpoint score: ${targetScore}`);
        } else if (higherNeighborScore !== undefined) {
          targetScore = higherNeighborScore + 1.0;
          console.log(`🐛 [STORE_DEBUG] Calculated above highest score: ${targetScore}`);
        } else if (lowerNeighborScore !== undefined) {
          targetScore = lowerNeighborScore - 1.0;
          console.log(`🐛 [STORE_DEBUG] Calculated below lowest score: ${targetScore}`);
        } else {
          targetScore = 25.0; // Default TrueSkill rating
          console.log(`🐛 [STORE_DEBUG] Using default score: ${targetScore}`);
        }
        
        console.log(`🚀 [PERF_SYNC] Setting manual score for ${pokemonId}: ${targetScore.toFixed(2)}`);
        
        const newRating = new Rating(targetScore, 8.333); // Use default sigma
        
        console.log(`🐛 [STORE_DEBUG] ABOUT TO SET STATE with new rating: mu=${newRating.mu}, sigma=${newRating.sigma}`);
        
        set((state) => {
          const updatedRatings = {
            ...state.ratings,
            [pokemonId]: {
              mu: newRating.mu,
              sigma: newRating.sigma,
              battleCount: (state.ratings[pokemonId]?.battleCount || 0) + 1
            }
          };
          
          console.log(`🐛 [STORE_DEBUG] STATE UPDATE: Pokemon ${pokemonId} rating set to: ${JSON.stringify(updatedRatings[pokemonId])}`);
          
          return {
            ratings: updatedRatings,
            localStateVersion: state.localStateVersion + 1,
            changeTracker: {
              ...state.changeTracker,
              changedRatings: new Set([...state.changeTracker.changedRatings, pokemonId])
            }
          };
        });
        
        // Verify the update happened
        const updatedState = get();
        console.log(`🐛 [STORE_DEBUG] VERIFICATION: Pokemon ${pokemonId} rating after set: ${JSON.stringify(updatedState.ratings[pokemonId])}`);
        console.log(`🐛 [STORE_DEBUG] ===== FORCE SCORE DEBUG END =====`);
        
        console.log(`🚀 [PERF_SYNC] Triggering batched sync for manual drag`);
        get().batchedSync();
      },

      addPendingBattle: (pokemonId: number) => {
        console.log(`🚀 [PERF_SYNC] AddPendingBattle called for Pokemon ${pokemonId}`);
        set((state) => {
          if (!state.pendingBattles.includes(pokemonId)) {
            console.log(`🚀 [PERF_SYNC] Adding Pokemon ${pokemonId} to pending battles`);
            const newPendingBattles = [...state.pendingBattles, pokemonId];
            return { 
              pendingBattles: newPendingBattles,
              localStateVersion: state.localStateVersion + 1,
              changeTracker: {
                ...state.changeTracker,
                changedPending: true
              }
            };
          }
          return state;
        });
        
        console.log(`🚀 [PERF_SYNC] Triggering batched sync for add pending`);
        get().batchedSync();
      },

      removePendingBattle: (pokemonId: number) => {
        console.log(`🚀 [PERF_SYNC] RemovePendingBattle called for Pokemon ${pokemonId}`);
        set((state) => ({
          pendingBattles: state.pendingBattles.filter(id => id !== pokemonId),
          localStateVersion: state.localStateVersion + 1,
          changeTracker: {
            ...state.changeTracker,
            changedPending: true
          }
        }));
        
        console.log(`🚀 [PERF_SYNC] Triggering batched sync for remove pending`);
        get().batchedSync();
      },

      clearAllPendingBattles: () => {
        console.log(`🚀 [PERF_SYNC] ClearAllPendingBattles called`);
        set((state) => ({ 
          pendingBattles: [],
          localStateVersion: state.localStateVersion + 1,
          changeTracker: {
            ...state.changeTracker,
            changedPending: true
          }
        }));
        console.log(`🚀 [PERF_SYNC] Triggering batched sync for clear pending`);
        get().batchedSync();
      },

      isPokemonPending: (pokemonId: number) => {
        return get().pendingBattles.includes(pokemonId);
      },

      getAllPendingBattles: () => {
        return get().pendingBattles;
      },

      mergePendingState: (cloudPending: number[], localPending: number[]) => {
        console.log(`🚀 [PERF_SYNC] Merging pending state - Cloud: ${cloudPending.length}, Local: ${localPending.length}`);
        const merged = [...new Set([...localPending, ...cloudPending])];
        console.log(`🚀 [PERF_SYNC] Merged pending result: ${merged.length} Pokemon`);
        return merged;
      },

      mergeRatingsState: (cloudRatings: Record<string, TrueSkillRating>, localRatings: Record<string, TrueSkillRating>) => {
        const mergeId = `MERGE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`🚀 [PERF_SYNC] [${mergeId}] Merging ratings - Cloud: ${Object.keys(cloudRatings).length}, Local: ${Object.keys(localRatings).length}`);
        
        const merged: Record<string, TrueSkillRating> = { ...cloudRatings };
        let newLocalCount = 0;
        let localPreferredCount = 0;
        
        Object.entries(localRatings).forEach(([pokemonId, localRating]) => {
          const cloudRating = cloudRatings[pokemonId];
          
          if (!cloudRating) {
            merged[pokemonId] = localRating;
            newLocalCount++;
          } else if (localRating.battleCount > cloudRating.battleCount) {
            merged[pokemonId] = localRating;
            localPreferredCount++;
          }
        });
        
        console.log(`🚀 [PERF_SYNC] [${mergeId}] Merge complete - New: ${newLocalCount}, Local preferred: ${localPreferredCount}, Final: ${Object.keys(merged).length}`);
        return merged;
      },

      queueBattlesForReorder: (primaryPokemonId: number, opponentIds: number[], priority: number) => {
        console.log(`🚀 [PERF_SYNC] QueueBattlesForReorder called for Pokemon ${primaryPokemonId}`);
        
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
        console.log(`🚀 [PERF_SYNC] Triggering batched sync for queue battles`);
        get().batchedSync();
        
        return finalLength;
      },

      getNextRefinementBattle: () => {
        const queue = get().refinementQueue;
        return queue.length > 0 ? queue[0] : null;
      },

      popRefinementBattle: () => {
        console.log(`🚀 [PERF_SYNC] PopRefinementBattle called`);
        set((state) => {
          const newQueue = state.refinementQueue.slice(1);
          return { 
            refinementQueue: newQueue,
            localStateVersion: state.localStateVersion + 1
          };
        });
        
        console.log(`🚀 [PERF_SYNC] Triggering batched sync for pop battle`);
        get().batchedSync();
      },

      hasRefinementBattles: () => {
        return get().refinementQueue.length > 0;
      },

      getRefinementBattleCount: () => {
        return get().refinementQueue.length;
      },

      clearRefinementQueue: () => {
        console.log(`🚀 [PERF_SYNC] ClearRefinementQueue called`);
        set((state) => ({ 
          refinementQueue: [],
          localStateVersion: state.localStateVersion + 1
        }));
        console.log(`🚀 [PERF_SYNC] Triggering batched sync for clear queue`);
        get().batchedSync();
      },

      setInitiatePendingBattle: (value: boolean) => {
        console.log(`🚀 [PERF_SYNC] SetInitiatePendingBattle called with value: ${value}`);
        set({ initiatePendingBattle: value });
      },

      // NEW: Batch Operations - Group multiple changes before syncing
      batchedSync: () => {
        const state = get();
        
        // Clear existing timeout
        if (state.batchSyncTimeout) {
          clearTimeout(state.batchSyncTimeout);
        }
        
        // Set new timeout to batch changes
        const timeout = setTimeout(() => {
          console.log(`🚀 [PERF_SYNC] Executing batched sync after 500ms delay`);
          get().incrementalSync();
        }, 500);
        
        set({ batchSyncTimeout: timeout });
      },

      // NEW: Background Sync - Non-blocking sync operations
      backgroundSync: () => {
        console.log(`🚀 [PERF_SYNC] Starting background sync`);
        
        // Use requestIdleCallback if available, otherwise setTimeout
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            get().incrementalSync();
          });
        } else {
          setTimeout(() => {
            get().incrementalSync();
          }, 0);
        }
      },

      // NEW: Incremental Sync - Only send changed data
      incrementalSync: async () => {
        const state = get();
        
        console.log(`🚀 [PERF_SYNC] ===== INCREMENTAL SYNC STARTED =====`);
        
        if (state.syncInProgress) {
          console.log(`🚀 [PERF_SYNC] Sync already in progress, skipping`);
          return;
        }

        const { changedRatings, changedPending } = state.changeTracker;
        
        // If no changes, skip sync
        if (changedRatings.size === 0 && !changedPending) {
          console.log(`🚀 [PERF_SYNC] No changes detected, skipping sync`);
          return;
        }

        set({ syncInProgress: true });
        
        try {
          console.log(`🚀 [PERF_SYNC] Changes detected - Ratings: ${changedRatings.size}, Pending: ${changedPending}`);
          
          // Build incremental payload with only changed data
          const incrementalData: any = {
            sessionId: state.sessionId,
            localStateVersion: state.localStateVersion,
            lastUpdated: new Date().toISOString()
          };

          // Only include changed ratings (not all 987!)
          if (changedRatings.size > 0) {
            const changedRatingData: Record<string, TrueSkillRating> = {};
            changedRatings.forEach(pokemonId => {
              if (state.ratings[pokemonId]) {
                changedRatingData[pokemonId] = state.ratings[pokemonId];
              }
            });
            incrementalData.changedRatings = changedRatingData;
            console.log(`🚀 [PERF_SYNC] Including ${Object.keys(changedRatingData).length} changed ratings instead of all ${Object.keys(state.ratings).length}`);
          }

          // Only include pending if it changed
          if (changedPending) {
            incrementalData.pendingBattles = state.pendingBattles;
            console.log(`🚀 [PERF_SYNC] Including pending battles: ${state.pendingBattles.length}`);
          }

          // Always include total battles for now (small data)
          incrementalData.totalBattles = state.totalBattles;

          console.log(`🚀 [PERF_SYNC] Incremental payload size: ${JSON.stringify(incrementalData).length} chars vs full size would be: ~${JSON.stringify({ratings: state.ratings}).length} chars`);
          
          const response = await fetch('https://irgivbujlgezbxosxqgb.supabase.co/functions/v1/sync-trueskill-incremental', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2l2YnVqbGdlemJ4b3N4cWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1Njg0ODgsImV4cCI6MjA2NDE0NDQ4OH0.KFBQazOEgvy4Q14OHpHLve12brZG7Rgaf_CypY74zrs`
            },
            body: JSON.stringify(incrementalData)
          });

          const raw = await response.text();
          console.log(`🚀 [PERF_SYNC] Incremental sync response status: ${response.status}`);

          if (!response.ok) {
            // Fallback to full sync if incremental fails
            console.log(`🚀 [PERF_SYNC] Incremental sync failed, falling back to full sync`);
            await get().syncToCloud();
            return;
          }

          let result: any;
          try {
            result = JSON.parse(raw);
          } catch (jsonError) {
            console.error(`🚀 [PERF_SYNC] Failed to parse incremental response: ${raw}`);
            throw new Error('Invalid response format');
          }

          if (result.success) {
            const now = Date.now();
            const timestamp = new Date().toLocaleString();
            
            // Reset change tracker after successful sync
            set({ 
              lastSyncTime: now,
              lastSyncTimestamp: timestamp,
              changeTracker: {
                changedRatings: new Set(),
                changedPending: false,
                lastSyncVersion: state.localStateVersion
              }
            });
            
            console.log(`🚀 [PERF_SYNC] ✅ Incremental sync successful at ${timestamp}!`);
            console.log(`🚀 [PERF_SYNC] Synced ${changedRatings.size} ratings instead of all ${Object.keys(state.ratings).length} - MASSIVE performance improvement!`);
          } else {
            throw new Error(result.error || 'Unknown incremental sync error');
          }
        } catch (error) {
          console.error(`🚀 [PERF_SYNC] ❌ Incremental sync failed:`, error);
          
          toast({
            title: 'Sync Failed',
            description: 'Changes may not be saved. Please try again.',
            variant: 'destructive'
          });
        } finally {
          set({ syncInProgress: false });
          console.log(`🚀 [PERF_SYNC] Incremental sync operation complete`);
        }
      },

      resetChangeTracker: () => {
        set((state) => ({
          changeTracker: {
            changedRatings: new Set(),
            changedPending: false,
            lastSyncVersion: state.localStateVersion
          }
        }));
      },

      // Keep existing sync methods for backwards compatibility and fallback
      syncToCloud: async () => {
        console.log(`🚀 [PERF_SYNC] ===== FULL SYNC TO CLOUD (FALLBACK) =====`);
        
        const state = get();
        
        if (state.syncInProgress) {
          console.log(`🚀 [PERF_SYNC] Full sync already in progress, aborting`);
          return;
        }

        set({ syncInProgress: true });
        
        try {
          const ratingsBeforeSync = Object.keys(state.ratings).length;
          const pendingBeforeSync = state.pendingBattles.length;
          console.log(`🚀 [PERF_SYNC] Starting full sync - ${ratingsBeforeSync} ratings, ${state.totalBattles} battles, ${pendingBeforeSync} pending`);
          
          const syncData = {
            sessionId: state.sessionId,
            ratings: state.ratings,
            totalBattles: state.totalBattles,
            pendingBattles: state.pendingBattles,
            refinementQueue: state.refinementQueue,
            localStateVersion: state.localStateVersion,
            lastUpdated: new Date().toISOString()
          };
          
          console.log(`🚀 [PERF_SYNC] Full sync payload: ${JSON.stringify(syncData).length} chars`);
          
          const response = await fetch('https://irgivbujlgezbxosxqgb.supabase.co/functions/v1/sync-trueskill', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2l2YnVqbGdlemJ4b3N4cWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1Njg0ODgsImV4cCI6MjA2NDE0NDQ4OH0.KFBQazOEgvy4Q14OHpHLve12brZG7Rgaf_CypY74zrs`
            },
            body: JSON.stringify(syncData)
          });

          const raw = await response.text();
          console.log(`🚀 [PERF_SYNC] Full sync response status: ${response.status}`);

          if (!response.ok) {
            throw new Error(`Full sync failed: ${response.status} - ${raw}`);
          }

          let result: any;
          try {
            result = JSON.parse(raw);
          } catch (jsonError) {
            console.error(`🚀 [PERF_SYNC] Failed to parse JSON: ${raw}`);
            toast({
              title: 'Sync Error',
              description: 'Unexpected response from the server.',
              variant: 'destructive'
            });
            return;
          }

          if (result.success) {
            const now = Date.now();
            const timestamp = new Date().toLocaleString();
            set({ 
              lastSyncTime: now,
              lastSyncTimestamp: timestamp
            });
            console.log(`🚀 [PERF_SYNC] ✅ Full sync successful at ${timestamp}!`);
            
            if (ratingsBeforeSync > 0 || pendingBeforeSync > 0) {
              console.log(`🚀 [PERF_SYNC] Full sync confirmed - data persisted to cloud at ${timestamp}`);
            }
          } else {
            throw new Error(result.error || 'Unknown sync error');
          }
        } catch (error) {
          console.error(`🚀 [PERF_SYNC] ❌ Full sync failed:`, error);
          
          toast({
            title: 'Sync Failed',
            description: 'Changes may not be saved. Please try again.',
            variant: 'destructive'
          });
        } finally {
          set({ syncInProgress: false });
          console.log(`🚀 [PERF_SYNC] Full sync operation complete`);
        }
      },

      loadFromCloud: async () => {
        const loadId = `LOAD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`🚀 [PERF_SYNC] [${loadId}] ===== LOAD FROM CLOUD =====`);
        
        try {
          const currentState = get();
          const ratingsBeforeLoad = Object.keys(currentState.ratings).length;
          const pendingBeforeLoad = currentState.pendingBattles.length;
          console.log(`🚀 [PERF_SYNC] [${loadId}] BEFORE LOAD - Local state: ${ratingsBeforeLoad} ratings, ${pendingBeforeLoad} pending`);
          
          const response = await fetch('https://irgivbujlgezbxosxqgb.supabase.co/functions/v1/get-trueskill', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2l2YnVqbGdlemJ4b3N4cWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1Njg0ODgsImV4cCI6MjA2NDE0NDQ4OH0.KFBQazOEgvy4Q14OHpHLve12brZG7Rgaf_CypY74zrs`
            },
            body: JSON.stringify({ sessionId: currentState.sessionId })
          });
          
          console.log(`🚀 [PERF_SYNC] [${loadId}] Cloud response status: ${response.status}`);
          
          if (!response.ok) {
            throw new Error(`Load failed: ${response.status}`);
          }
          
          const raw = await response.text();
          const result = await JSON.parse(raw);
          
          if (result.success && result.ratings) {
            const cloudRatingsCount = Object.keys(result.ratings).length;
            const cloudPendingCount = (result.pendingBattles || []).length;
            console.log(`🚀 [PERF_SYNC] [${loadId}] RAW CLOUD DATA - ${cloudRatingsCount} ratings, ${cloudPendingCount} pending, ${result.totalBattles || 0} total battles`);
            
            const mergedRatings = get().mergeRatingsState(result.ratings || {}, currentState.ratings);
            const mergedPending = get().mergePendingState(result.pendingBattles || [], currentState.pendingBattles);
            
            const finalRatingsCount = Object.keys(mergedRatings).length;
            const finalPendingCount = mergedPending.length;
            console.log(`🚀 [PERF_SYNC] [${loadId}] AFTER MERGE - ${finalRatingsCount} ratings, ${finalPendingCount} pending`);
            
            set({
              ratings: mergedRatings,
              totalBattles: Math.max(result.totalBattles || 0, currentState.totalBattles),
              pendingBattles: mergedPending,
              refinementQueue: result.refinementQueue || currentState.refinementQueue,
              isHydrated: true
            });
            
            console.log(`🚀 [PERF_SYNC] [${loadId}] ✅ State updated with merged data`);
          } else {
            console.log(`🚀 [PERF_SYNC] [${loadId}] No valid data in cloud response`);
          }
        } catch (error) {
          console.error(`🚀 [PERF_SYNC] [${loadId}] ❌ Load from cloud failed:`, error);
        }
        
        console.log(`🚀 [PERF_SYNC] [${loadId}] ===== LOAD FROM CLOUD COMPLETE =====`);
      },

      smartSync: async () => {
        console.log(`🚀 [PERF_SYNC] ===== SMART SYNC CALLED =====`);
        const state = get();
        
        if (state.syncInProgress) {
          console.log(`🚀 [PERF_SYNC] Smart sync aborting - sync already in progress`);
          return;
        }

        set({ syncInProgress: true });
        
        try {
          console.log(`🚀 [PERF_SYNC] Smart sync starting - using incremental sync for better performance`);
          
          // First try to get the latest from cloud
          await get().loadFromCloud();
          
          // Then use incremental sync instead of full sync
          await get().incrementalSync();
          
          console.log(`🚀 [PERF_SYNC] ✅ Smart sync completed successfully with incremental sync`);
        } catch (error) {
          console.error(`🚀 [PERF_SYNC] ❌ Smart sync failed:`, error);
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
        console.log(`🚀 [PERF_SYNC] ===== RESTORE SESSION FROM CLOUD =====`);
        console.log(`🚀 [PERF_SYNC] Restoring for user: ${userId}`);
        
        try {
          await get().smartSync();
          console.log(`🚀 [PERF_SYNC] ✅ Session restore completed with smart sync`);
        } catch (error) {
          console.error(`🚀 [PERF_SYNC] ❌ Session restore failed:`, error);
        }
      }
    }),
    {
      name: 'trueskill-storage',
      onRehydrateStorage: () => (state) => {
        console.log(`🚀 [PERF_SYNC] Store rehydrated with ${Object.keys(state?.ratings || {}).length} ratings`);
        if (state) {
          state.isHydrated = true;
        }
      }
    }
  )
);
