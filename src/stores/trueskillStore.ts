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
        console.log(`[TRUESKILL_SMART_SYNC] Starting smart sync...`);

        try {
          const localState = {
            ratings: state.ratings,
            totalBattles: state.totalBattles,
            pendingBattles: state.pendingBattles,
            refinementQueue: state.refinementQueue,
          };
          console.log(`[TRUESKILL_SMART_SYNC] Local state: ${localState.totalBattles} battles, ${Object.keys(localState.ratings).length} ratings, ${localState.pendingBattles.length} pending, ${localState.refinementQueue.length} refinement battles.`);

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
            console.log('[TRUESKILL_SMART_SYNC] Could not fetch cloud state. Proceeding with local state only.');
          }
          console.log(`[TRUESKILL_SMART_SYNC] Cloud state: ${cloudState.totalBattles} battles, ${Object.keys(cloudState.ratings).length} ratings, ${cloudState.pendingBattles.length} pending, ${cloudState.refinementQueue.length} refinement battles.`);

          // If local has more battles, it's the newer state. Prioritize it.
          if (localState.totalBattles >= cloudState.totalBattles) {
            console.log('[TRUESKILL_SMART_SYNC] Local state is newer or equal. Merging cloud into local.');
            const mergedPending = [...new Set([...localState.pendingBattles, ...cloudState.pendingBattles])];
            const mergedRefinements = [...localState.refinementQueue, ...cloudState.refinementQueue];
            set({
              ratings: { ...cloudState.ratings, ...localState.ratings },
              totalBattles: localState.totalBattles,
              pendingBattles: mergedPending,
              refinementQueue: mergedRefinements,
            });
          } else {
            // If cloud has more battles, it's the newer state. Prioritize it.
            console.log('[TRUESKILL_SMART_SYNC] Cloud state is newer. Merging local into cloud.');
             const mergedPending = [...new Set([...cloudState.pendingBattles, ...localState.pendingBattles])];
             const mergedRefinements = [...cloudState.refinementQueue, ...localState.refinementQueue];
             set({
              ratings: { ...localState.ratings, ...cloudState.ratings },
              totalBattles: cloudState.totalBattles,
              pendingBattles: mergedPending,
              refinementQueue: mergedRefinements,
            });
          }
          
          set({ isHydrated: true });
          console.log(`[TRUESKILL_STORE] Hydration flag set after smart sync`);
          
          // Sync the final merged state back to the cloud
          await get().syncToCloud();

        } catch (error) {
          console.error('[TRUESKILL_SMART_SYNC] Smart sync failed:', error);
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
