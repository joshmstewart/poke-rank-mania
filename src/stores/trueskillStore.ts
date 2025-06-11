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
  
  // Cloud sync actions
  syncToCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
  smartSync: () => Promise<void>;
  waitForHydration: () => Promise<void>;
  restoreSessionFromCloud: (userId: string) => Promise<void>;
}

const generateSessionId = () => crypto.randomUUID();

// Debounce delay for syncing to the server (in milliseconds)
const SYNC_DEBOUNCE_DELAY = 1500;
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

      updateRating: (pokemonId: string, rating: Rating) => {
        set((state) => ({
          ratings: {
            ...state.ratings,
            [pokemonId]: {
              mu: rating.mu,
              sigma: rating.sigma,
              battleCount: (state.ratings[pokemonId]?.battleCount || 0)
            }
          }
        }));
        
        // Queue a sync after updates
        get().syncToCloud();
      },

      incrementBattleCount: (pokemonId: string) => {
        set((state) => ({
          ratings: {
            ...state.ratings,
            [pokemonId]: {
              ...state.ratings[pokemonId],
              battleCount: (state.ratings[pokemonId]?.battleCount || 0) + 1
            }
          }
        }));
      },

      incrementTotalBattles: () => {
        set((state) => ({
          totalBattles: state.totalBattles + 1
        }));
        
        // Queue a sync after battle count increment
        get().syncToCloud();
      },

      setTotalBattles: (count: number) => {
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
        set({ 
          ratings: {},
          totalBattles: 0
        });
        get().syncToCloud();
      },

      forceScoreBetweenNeighbors: (pokemonId: string, higherNeighborId?: string, lowerNeighborId?: string) => {
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
        set((state) => {
          if (!state.pendingBattles.includes(pokemonId)) {
            console.log(`🌥️ [CLOUD_PENDING] Adding Pokemon ${pokemonId} to pending battles`);
            const newPendingBattles = [...state.pendingBattles, pokemonId];
            return { pendingBattles: newPendingBattles };
          }
          return state;
        });
        
        // Sync to cloud immediately
        get().syncToCloud();
      },

      removePendingBattle: (pokemonId: number) => {
        set((state) => ({
          pendingBattles: state.pendingBattles.filter(id => id !== pokemonId)
        }));
        
        console.log(`🌥️ [CLOUD_PENDING] Removed Pokemon ${pokemonId} from pending battles`);
        get().syncToCloud();
      },

      clearAllPendingBattles: () => {
        console.log(`🌥️ [CLOUD_PENDING] Clearing all pending battles`);
        set({ pendingBattles: [] });
        get().syncToCloud();
      },

      isPokemonPending: (pokemonId: number) => {
        const isPending = get().pendingBattles.includes(pokemonId);
        console.log(`🌥️ [CLOUD_PENDING] Check pending for ${pokemonId}: ${isPending}`);
        return isPending;
      },

      getAllPendingBattles: () => {
        const pending = get().pendingBattles;
        console.log(`🌥️ [CLOUD_PENDING] Get all pending battles:`, pending);
        return pending;
      },

      queueBattlesForReorder: (primaryPokemonId: number, opponentIds: number[], priority: number) => {
        console.log(`🏪 [ZUSTAND_QUEUE] Queuing battles for Pokemon ${primaryPokemonId} with opponents:`, opponentIds);
        
        const newBattles: RefinementBattle[] = opponentIds.map(opponentPokemonId => ({
          primaryPokemonId,
          opponentPokemonId,
          priority
        }));
        
        set((state) => {
          const updatedQueue = [...state.refinementQueue, ...newBattles]
            .sort((a, b) => a.priority - b.priority);
          
          console.log(`🏪 [ZUSTAND_QUEUE] New queue length: ${updatedQueue.length}`);
          return { refinementQueue: updatedQueue };
        });
        
        const finalLength = get().refinementQueue.length;
        console.log(`🏪 [ZUSTAND_QUEUE] Final queue length after adding: ${finalLength}`);
        
        // Sync to cloud
        get().syncToCloud();
        
        return finalLength;
      },

      getNextRefinementBattle: () => {
        const queue = get().refinementQueue;
        const nextBattle = queue.length > 0 ? queue[0] : null;
        console.log(`🏪 [ZUSTAND_QUEUE] Getting next battle:`, nextBattle);
        return nextBattle;
      },

      popRefinementBattle: () => {
        console.log(`🏪 [ZUSTAND_QUEUE] Popping battle from queue`);
        set((state) => {
          const newQueue = state.refinementQueue.slice(1);
          console.log(`🏪 [ZUSTAND_QUEUE] Queue length after pop: ${newQueue.length}`);
          return { refinementQueue: newQueue };
        });
        
        // Sync to cloud
        get().syncToCloud();
      },

      hasRefinementBattles: () => {
        const hasRefinements = get().refinementQueue.length > 0;
        console.log(`🏪 [ZUSTAND_QUEUE] Has refinement battles: ${hasRefinements}`);
        return hasRefinements;
      },

      getRefinementBattleCount: () => {
        const count = get().refinementQueue.length;
        console.log(`🏪 [ZUSTAND_QUEUE] Refinement battle count: ${count}`);
        return count;
      },

      clearRefinementQueue: () => {
        console.log(`🏪 [ZUSTAND_QUEUE] Clearing refinement queue`);
        set({ refinementQueue: [] });
        get().syncToCloud();
      },

      setInitiatePendingBattle: (value: boolean) => {
        console.log(`🚦 [MODE_COORDINATION] Setting initiatePendingBattle flag to: ${value}`);
        set({ initiatePendingBattle: value });
      },

      syncToCloud: async () => {
        if (syncTimeout) {
          clearTimeout(syncTimeout);
        }
        syncTimeout = setTimeout(async () => {
          syncTimeout = null;
          const state = get();
          if (state.syncInProgress) return;

          set({ syncInProgress: true });
          
          try {
            console.log(`[TRUESKILL_STORE] Syncing to cloud - ${Object.keys(state.ratings).length} ratings, ${state.totalBattles} total battles, ${state.pendingBattles.length} pending battles, ${state.refinementQueue.length} refinement battles`);
            
            const response = await fetch('/api/trueskill/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: state.sessionId,
                ratings: state.ratings as any,
                totalBattles: state.totalBattles,
                pendingBattles: state.pendingBattles,
                refinementQueue: state.refinementQueue,
                lastUpdated: new Date().toISOString()
              })
            });

            const raw = await response.text();

            if (!response.ok) {
              throw new Error(`Sync failed: ${response.status} - ${raw}`);
            }

            let result: any;
            try {
              result = JSON.parse(raw);
            } catch (jsonError) {
              console.error(
                `[TRUESKILL_STORE] Failed to parse JSON: status ${response.status}, body: ${raw}`
              );
              toast({
                title: 'Sync Error',
                description: 'Unexpected response from the server.',
                variant: 'destructive'
              });
              return;
            }

            if (result.success) {
              set({ lastSyncTime: Date.now() });
              console.log(`[TRUESKILL_STORE] Successfully synced to cloud`);
            } else {
              throw new Error(result.error || 'Unknown sync error');
            }
          } catch (error) {
            console.error('[TRUESKILL_STORE] Sync to cloud failed:', error);
          } finally {
            set({ syncInProgress: false });
          }
        }, SYNC_DEBOUNCE_DELAY);
      },

      loadFromCloud: async () => {
        try {
          console.log(`[TRUESKILL_STORE] Loading from cloud...`);
          
          const response = await fetch('/api/trueskill/get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: get().sessionId })
          });
          
          if (!response.ok) {
            throw new Error(`Load failed: ${response.status}`);
          }
          
          const result = await response.json();
          if (result.success && result.ratings) {
            console.log(
              `[TRUESKILL_STORE] Loaded ${Object.keys(result.ratings).length} ratings, ${
                result.totalBattles || 0} total battles, ${
                (result.pendingBattles || []).length} pending battles, ${
                (result.refinementQueue || []).length} refinement battles from cloud`
            );
            set({
              ratings: result.ratings,
              totalBattles: result.totalBattles || 0,
              pendingBattles: result.pendingBattles || [],
              refinementQueue: result.refinementQueue || [],
              isHydrated: true
            });
            console.log('[TRUESKILL_STORE] Hydration flag set after cloud load');
          }
        } catch (error) {
          console.error('[TRUESKILL_STORE] Load from cloud failed:', error);
        }
      },

      smartSync: async () => {
        const state = get();
        if (state.syncInProgress) return;

        set({ syncInProgress: true });
        
        // ===== NEW COMPREHENSIVE MERGE LOGGING =====
        const mergeId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] ===== STARTING SMART SYNC MERGE AUDIT =====`);
        console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] Merge operation ID: ${mergeId}`);

        try {
          const localState = {
            ratings: state.ratings,
            totalBattles: state.totalBattles,
            pendingBattles: state.pendingBattles,
            refinementQueue: state.refinementQueue,
          };
          
          const localRatingCount = Object.keys(localState.ratings).length;
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] STEP 1 - LOCAL STATE BEFORE MERGE:`);
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] - Local ratings count: ${localRatingCount}`);
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] - Local total battles: ${localState.totalBattles}`);
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] - Local pending battles: ${localState.pendingBattles.length}`);
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] - Local refinement queue: ${localState.refinementQueue.length}`);

          const response = await fetch('/api/trueskill/get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: state.sessionId }),
          });

          let cloudState = {
            ratings: {},
            totalBattles: 0,
            pendingBattles: [],
            refinementQueue: [],
          };

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              cloudState = {
                ratings: result.ratings || {},
                totalBattles: result.totalBattles || 0,
                pendingBattles: result.pendingBattles || [],
                refinementQueue: result.refinementQueue || [],
              };
            }
          } else {
            console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] Could not fetch cloud state. Proceeding with local state only.`);
          }
          
          const cloudRatingCount = Object.keys(cloudState.ratings).length;
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] STEP 2 - CLOUD STATE FETCHED:`);
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] - Cloud ratings count: ${cloudRatingCount}`);
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] - Cloud total battles: ${cloudState.totalBattles}`);
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] - Cloud pending battles: ${cloudState.pendingBattles.length}`);
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] - Cloud refinement queue: ${cloudState.refinementQueue.length}`);

          // ===== DETAILED POKEMON-BY-POKEMON MERGE TRACKING =====
          const mergedRatings: Record<string, TrueSkillRating> = {};
          
          // Get all unique Pokemon IDs from both sources
          const allPokemonIds = new Set([
            ...Object.keys(localState.ratings),
            ...Object.keys(cloudState.ratings)
          ]);
          
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] STEP 3 - POKEMON MERGE ANALYSIS:`);
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] - Total unique Pokemon across both sources: ${allPokemonIds.size}`);
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] - Local-only Pokemon: ${Object.keys(localState.ratings).filter(id => !cloudState.ratings[id]).length}`);
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] - Cloud-only Pokemon: ${Object.keys(cloudState.ratings).filter(id => !localState.ratings[id]).length}`);
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] - Overlapping Pokemon: ${Object.keys(localState.ratings).filter(id => cloudState.ratings[id]).length}`);
          
          // Track merge decisions
          const localWins: string[] = [];
          const cloudWins: string[] = [];
          const localOnlyKept: string[] = [];
          const cloudOnlyKept: string[] = [];
          const pokemonLost: string[] = [];
          
          // Merge each Pokemon individually with detailed logging
          allPokemonIds.forEach(pokemonId => {
            const localRating = localState.ratings[pokemonId];
            const cloudRating = cloudState.ratings[pokemonId];
            
            if (localRating && cloudRating) {
              // Both have this Pokemon - use the one with higher battle count (more recent)
              const useLocal = localRating.battleCount >= cloudRating.battleCount;
              mergedRatings[pokemonId] = useLocal ? localRating : cloudRating;
              
              if (useLocal) {
                localWins.push(pokemonId);
                console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] Pokemon ${pokemonId}: LOCAL WINS (${localRating.battleCount} vs ${cloudRating.battleCount} battles)`);
              } else {
                cloudWins.push(pokemonId);
                console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] Pokemon ${pokemonId}: CLOUD WINS (${cloudRating.battleCount} vs ${localRating.battleCount} battles)`);
              }
            } else if (localRating) {
              // Only local has this Pokemon
              mergedRatings[pokemonId] = localRating;
              localOnlyKept.push(pokemonId);
              console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] Pokemon ${pokemonId}: LOCAL ONLY KEPT (${localRating.battleCount} battles)`);
            } else if (cloudRating) {
              // Only cloud has this Pokemon
              mergedRatings[pokemonId] = cloudRating;
              cloudOnlyKept.push(pokemonId);
              console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] Pokemon ${pokemonId}: CLOUD ONLY KEPT (${cloudRating.battleCount} battles)`);
            } else {
              // This should never happen, but track it if it does
              pokemonLost.push(pokemonId);
              console.error(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] Pokemon ${pokemonId}: ERROR - BOTH SOURCES MISSING DATA!`);
            }
          });

          // Merge other data arrays (keeping unique items)
          const mergedPending = [...new Set([...localState.pendingBattles, ...cloudState.pendingBattles])];
          const mergedRefinements = [...localState.refinementQueue, ...cloudState.refinementQueue];
          
          // Use the higher total battle count
          const mergedTotalBattles = Math.max(localState.totalBattles, cloudState.totalBattles);
          
          const finalRatingCount = Object.keys(mergedRatings).length;
          
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] STEP 4 - MERGE DECISIONS SUMMARY:`);
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] - Local wins: ${localWins.length}`);
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] - Cloud wins: ${cloudWins.length}`);
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] - Local-only kept: ${localOnlyKept.length}`);
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] - Cloud-only kept: ${cloudOnlyKept.length}`);
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] - Pokemon lost: ${pokemonLost.length}`);
          
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] STEP 5 - FINAL MERGE RESULTS:`);
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] - Started with ${allPokemonIds.size} unique Pokemon`);
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] - Final merged count: ${finalRatingCount}`);
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] - Pokemon difference: ${allPokemonIds.size - finalRatingCount}`);
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] - Local count change: ${localRatingCount} → ${finalRatingCount} (${finalRatingCount - localRatingCount})`);
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] - Cloud count change: ${cloudRatingCount} → ${finalRatingCount} (${finalRatingCount - cloudRatingCount})`);
          
          // Log sample of lost Pokemon if any
          if (pokemonLost.length > 0) {
            console.error(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] ⚠️ POKEMON LOST:`, pokemonLost.slice(0, 10).join(', '), pokemonLost.length > 10 ? `... and ${pokemonLost.length - 10} more` : '');
          }
          
          // Apply the merged state
          set({
            ratings: mergedRatings,
            totalBattles: mergedTotalBattles,
            pendingBattles: mergedPending,
            refinementQueue: mergedRefinements,
            isHydrated: true
          });
          
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] STEP 6 - STATE UPDATED AND HYDRATED`);
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] Hydration flag set after smart sync`);
          
          // Sync the final merged state back to the cloud
          await get().syncToCloud();
          
          console.log(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] ===== SMART SYNC MERGE AUDIT COMPLETE =====`);

        } catch (error) {
          console.error(`🚨🚨🚨 [SMART_SYNC_MERGE_${mergeId}] Smart sync failed:`, error);
          set({ isHydrated: true }); // Ensure app doesn't hang
        } finally {
          set({ syncInProgress: false });
        }
      },

      waitForHydration: () => {
        return new Promise((resolve) => {
          if (get().isHydrated) {
            resolve();
            return;
          }
          
          const checkHydration = () => {
            if (get().isHydrated) {
              resolve();
            } else {
              setTimeout(checkHydration, 10);
            }
          };
          checkHydration();
        });
      },

      restoreSessionFromCloud: async (userId: string) => {
        try {
          console.log(`[TRUESKILL_STORE] Restoring session for user: ${userId}`);
          await get().smartSync();
        } catch (error) {
          console.error('[TRUESKILL_STORE] Session restoration failed:', error);
        }
      }
    }),
    {
      name: 'trueskill-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
          console.log('[TRUESKILL_STORE] Hydration complete');
        }
      }
    }
  )
);
