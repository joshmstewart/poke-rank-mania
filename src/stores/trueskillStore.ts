import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Rating } from 'ts-trueskill';
import { toast } from '@/hooks/use-toast';
import { loadTrueSkillSession, saveTrueSkillSession, clearTrueSkillSession } from '@/utils/trueskillCloud';
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
  totalBattlesLastUpdated: number; // New timestamp field
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
  processBattleOutcomes: (updates: { pokemonId: string; newRating: Rating }[]) => void;
  
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
  
  // Enhanced cloud sync actions with timestamp-based merging
  syncToCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
  smartSync: () => Promise<void>;
  mergeCloudData: (cloudData: any) => void;
  waitForHydration: () => Promise<void>;
  restoreSessionFromCloud: (userId: string) => Promise<void>;

  // --- DIAGNOSTIC SELF-TEST ---
  runCloudSyncDiagnostics: () => Promise<void>;
}

const generateSessionId = () => crypto.randomUUID();

// DEPRECATING DEBOUNCE - SYNC IS NOW IMMEDIATE
// const SYNC_DEBOUNCE_DELAY = 1500;
// let syncTimeout: ReturnType<typeof setTimeout> | null = null;

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
        
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Triggering syncToCloud from updateRating`);
        get().syncToCloud();
      },

      incrementBattleCount: (pokemonId: string) => {
        console.log(`[DEPRECATED] incrementBattleCount for ${pokemonId} is now part of atomic operations.`);
      },

      incrementTotalBattles: () => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] IncrementTotalBattles called`);
        const now = Date.now();
        set((state) => ({
          totalBattles: state.totalBattles + 1,
          totalBattlesLastUpdated: now
        }));
        
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Triggering syncToCloud from incrementTotalBattles`);
        get().syncToCloud();
      },

      setTotalBattles: (count: number) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] SetTotalBattles called with count: ${count}`);
        const now = Date.now();
        set({ 
          totalBattles: count,
          totalBattlesLastUpdated: now
        });
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
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Triggering syncToCloud from clearAllRatings`);
        get().syncToCloud();
      },

      forceScoreBetweenNeighbors: (pokemonId: string, higherNeighborId?: string, lowerNeighborId?: string) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ForceScoreBetweenNeighbors called for Pokemon ${pokemonId}`);
        const state = get();
        const higherNeighborScore = higherNeighborId ? state.ratings[higherNeighborId]?.mu : undefined;
        const lowerNeighborScore = lowerNeighborId ? state.ratings[lowerNeighborId]?.mu : undefined;
        
        let targetScore: number;
        
        if (higherNeighborScore !== undefined && lowerNeighborScore !== undefined) {
          // Score should be between the two neighbors
          targetScore = (higherNeighborScore + lowerNeighborScore) / 2;
        } else if (higherNeighborScore !== undefined) {
          // Dropped at the end of the list, score should be lower than the neighbor above it
          targetScore = higherNeighborScore - 1.0;
        } else if (lowerNeighborId !== undefined) {
          // Dropped at the beginning of the list, score should be higher than the neighbor below it
          targetScore = lowerNeighborScore + 1.0;
        } else {
          // Only item in the list or an error occurred, use default
          targetScore = 25.0;
        }
        
        const newRating = new Rating(targetScore, 8.333); // Use default sigma
        get().updateRating(pokemonId, newRating);
      },

      processBattleOutcomes: (updates: { pokemonId: string; newRating: Rating }[]) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ProcessBattleOutcomes called`);
        const now = Date.now();
        set(state => {
          const newRatings = { ...state.ratings };
          updates.forEach(({ pokemonId, newRating }) => {
            const currentRating = newRatings[pokemonId] || { battleCount: 0 };
            newRatings[pokemonId] = {
              mu: newRating.mu,
              sigma: newRating.sigma,
              battleCount: currentRating.battleCount + 1,
              lastUpdated: now,
            };
            console.log(`🚨🚨🚨 [ATOMIC_UPDATE] Processed rating for Pokemon ${pokemonId}: mu=${newRating.mu.toFixed(2)}, sigma=${newRating.sigma.toFixed(2)}`);
          });

          return { ratings: newRatings };
        });
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Triggering syncToCloud from processBattleOutcomes`);
        get().syncToCloud();
      },

      addPendingBattle: (pokemonId: number) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] AddPendingBattle called for Pokemon ${pokemonId}`);
        set((state) => {
          if (!state.pendingBattles.includes(pokemonId)) {
            console.log(`🚨🚨🚨 [SYNC_AUDIT] Adding Pokemon ${pokemonId} to pending battles`);
            const newPendingBattles = [...state.pendingBattles, pokemonId];
            return { pendingBattles: newPendingBattles };
          }
          return state;
        });
        
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Triggering syncToCloud from addPendingBattle`);
        get().syncToCloud();
      },

      removePendingBattle: (pokemonId: number) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] RemovePendingBattle called for Pokemon ${pokemonId}`);
        set((state) => ({
          pendingBattles: state.pendingBattles.filter(id => id !== pokemonId)
        }));
        
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Triggering syncToCloud from removePendingBattle`);
        get().syncToCloud();
      },

      clearAllPendingBattles: () => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ClearAllPendingBattles called`);
        set({ pendingBattles: [] });
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Triggering syncToCloud from clearAllPendingBattles`);
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
        
        const finalLength = get().refinementQueue.length;
        
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Triggering syncToCloud from queueBattlesForReorder`);
        get().syncToCloud();
        
        return finalLength;
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
        
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Triggering syncToCloud from popRefinementBattle`);
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
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Triggering syncToCloud from clearRefinementQueue`);
        get().syncToCloud();
      },

      setInitiatePendingBattle: (value: boolean) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] SetInitiatePendingBattle called with value: ${value}`);
        set({ initiatePendingBattle: value });
      },

      syncToCloud: async () => {
        // New code: syncs only to authenticated user's cloud record
        const state = get();
        const session = (await supabase.auth.getSession()).data?.session;
        const userId = session?.user?.id;
        if (!userId) {
          console.log('[SYNC_AUDIT] User not logged in, skipping cloud sync.');
          return;
        }
        const ok = await saveTrueSkillSession(state);
        if (ok) {
          set({ lastSyncTime: Date.now() });
          console.log('[SYNC_AUDIT] User cloud sync complete');
        } else {
          toast({
            title: 'Cloud Sync Failed',
            description: 'Could not save progress to the cloud. Your changes are saved locally.',
            variant: 'destructive'
          });
        }
      },

      loadFromCloud: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) {
          console.log('[SYNC_AUDIT] User not logged in, skipping cloud load.');
          set({ isHydrated: true });
          return;
        }
        const data = await loadTrueSkillSession();
        if (data && data.ratings_data) {
          // ========== TYPE SAFETY & CONVERSION ==========

          // Ratings: must be Record<string, TrueSkillRating>
          let safeRatings: Record<string, TrueSkillRating> = {};
          if (
            typeof data.ratings_data === 'object' &&
            data.ratings_data !== null &&
            !Array.isArray(data.ratings_data)
          ) {
            Object.entries(data.ratings_data).forEach(([k, v]) => {
              if (
                typeof v === 'object' &&
                v !== null &&
                typeof (v as any).mu === 'number' &&
                typeof (v as any).sigma === 'number'
              ) {
                safeRatings[k] = {
                  mu: (v as any).mu,
                  sigma: (v as any).sigma,
                  battleCount: (v as any).battleCount ?? 0,
                  lastUpdated: (v as any).lastUpdated ?? Date.now(),
                };
              }
            });
          }

          // PendingBattles: number[]
          let safePendingBattles: number[] = [];
          if (Array.isArray(data.pending_battles)) {
            safePendingBattles = (data.pending_battles as unknown[])
              .filter((v): v is number => typeof v === 'number');
          }

          // RefinementQueue: RefinementBattle[]
          let safeRefinementQueue: RefinementBattle[] = [];
          if (Array.isArray(data.refinement_queue)) {
            safeRefinementQueue = (data.refinement_queue as unknown[])
              .filter((v): v is RefinementBattle =>
                  typeof v === 'object' &&
                  v !== null &&
                  typeof (v as any).primaryPokemonId === 'number' &&
                  typeof (v as any).opponentPokemonId === 'number' &&
                  typeof (v as any).priority === 'number'
              )
              .map((v) => ({
                  primaryPokemonId: (v as any).primaryPokemonId,
                  opponentPokemonId: (v as any).opponentPokemonId,
                  priority: (v as any).priority,
              }));
          }

          set({
            ratings: safeRatings,
            totalBattles: typeof data.total_battles === 'number' ? data.total_battles : 0,
            totalBattlesLastUpdated: typeof data.total_battles_last_updated === 'number'
              ? data.total_battles_last_updated
              : Date.now(),
            pendingBattles: safePendingBattles,
            refinementQueue: safeRefinementQueue,
            isHydrated: true
          });
        } else {
          set({ isHydrated: true });
        }
      },

      smartSync: async () => {
        // Loads from cloud, overwrites local, syncs back changes if any (can be fine tuned)
        await get().loadFromCloud();
        await get().syncToCloud();
      },

      restoreSessionFromCloud: async () => {
        // Hydrate from user record, then sync
        await get().smartSync();
      },

      mergeCloudData: (cloudData: any) => {
        // No-op for now. Implement merging logic here if needed in the future.
        console.log('[SYNC_AUDIT] mergeCloudData called but not implemented');
      },
      waitForHydration: async () => {
        // Returns when isHydrated is true
        const ensureHydrated = () =>
          new Promise<void>((resolve) => {
            if (get().isHydrated) {
              resolve();
              return;
            }
            // Subscribe to the entire state and check manually,
            // because Zustand's .subscribe((selector), (listener)) overload
            // may not be available without subscribeWithSelector middleware.
            const unsub = useTrueSkillStore.subscribe((state) => {
              if (state.isHydrated) {
                unsub();
                resolve();
              }
            });
          });
        return await ensureHydrated();
      },
      
      // --- DIAGNOSTIC SELF-TEST ---
      runCloudSyncDiagnostics: async () => {
        const TEST_POKEMON_ID = "123456";
        const TEST_MU = 77.77;
        const TEST_SIGMA = 6.66;

        console.log("%c[DIAG] Starting TrueSkill Cloud Sync Diagnostics...", "color: teal; font-weight: bold;");
        // 1. Backup entire local state
        const backup = {
          ratings: { ...get().ratings },
          pendingBattles: [...get().pendingBattles],
          refinementQueue: [...get().refinementQueue],
          totalBattles: get().totalBattles,
          totalBattlesLastUpdated: get().totalBattlesLastUpdated,
        };
        console.log("[DIAG] Backed up current state:", backup);

        // 2. Add dummy rating and sync to cloud (use proper Rating instance)
        get().updateRating(TEST_POKEMON_ID, new Rating(TEST_MU, TEST_SIGMA));
        console.log("[DIAG] Wrote dummy rating for Pokemon:", TEST_POKEMON_ID);
        await get().syncToCloud();
        console.log("[DIAG] Synced to cloud.");

        // 3. Clear local ratings (simulate logout/device switch)
        set({
          ratings: {},
          pendingBattles: [],
          refinementQueue: [],
          totalBattles: 0,
          totalBattlesLastUpdated: Date.now(),
        });
        console.log("[DIAG] Local store cleared. Should be empty now.");

        // 4. Reload from cloud
        await get().loadFromCloud();
        console.log("[DIAG] Loaded from cloud.");

        // 5. Validate dummy rating is present
        const ratings = get().ratings;
        const found = !!ratings[TEST_POKEMON_ID] && ratings[TEST_POKEMON_ID].mu === TEST_MU && ratings[TEST_POKEMON_ID].sigma === TEST_SIGMA;
        if (found) {
          console.log("%c[DIAG] ✅ Cloud sync diagnostic succeeded! Rating is present after reload.", "color: green; font-weight: bold;");
        } else {
          console.error("[DIAG] ❌ Cloud sync diagnostic failed! Rating was NOT found after reload.");
        }
        // 6. Clean up: remove test rating and restore original data
        set({
          ratings: backup.ratings,
          pendingBattles: backup.pendingBattles,
          refinementQueue: backup.refinementQueue,
          totalBattles: backup.totalBattles,
          totalBattlesLastUpdated: backup.totalBattlesLastUpdated,
        });
        console.log("[DIAG] Store restored to previous state. Diagnostics complete.");

        // Show a toast for user feedback (if available)
        try {
          // Lazy import so we don't break SSR/tests
          const { toast } = await import("@/hooks/use-toast");
          toast({
            title: found
              ? "Cloud Sync Test Succeeded"
              : "Cloud Sync Test Failed",
            description: found
              ? "Cloud saving and loading are working as expected! See console for details."
              : "Cloud test failed (see console for details, please report this bug).",
            variant: found ? "default" : "destructive",
            duration: 7000,
          });
        } catch (e) {
          // Ignore toast errors in case it's not available in some contexts
        }
      },
    }),
    {
      name: 'trueskill-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Migrate old data without timestamps
          const now = Date.now();
          Object.keys(state.ratings).forEach(pokemonId => {
            if (!state.ratings[pokemonId].lastUpdated) {
              state.ratings[pokemonId].lastUpdated = now;
            }
          });
          
          if (!state.totalBattlesLastUpdated) {
            state.totalBattlesLastUpdated = now;
          }
          
          state.isHydrated = true;
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Zustand hydration complete with timestamp migration`);
        }
      }
    }
  )
);

// Automatically rehydrate from cloud on user login and clear on logout:
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      await useTrueSkillStore.getState().loadFromCloud();
    }
    if (event === 'SIGNED_OUT') {
      useTrueSkillStore.setState({
        ratings: {},
        pendingBattles: [],
        refinementQueue: [],
        totalBattles: 0,
        totalBattlesLastUpdated: Date.now(),
        isHydrated: true
      });
      await clearTrueSkillSession();
    }
  });
}
