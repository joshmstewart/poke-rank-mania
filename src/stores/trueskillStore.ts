
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Rating } from 'ts-trueskill';
import { toast } from '@/hooks/use-toast';

interface TrueSkillRating {
  mu: number;
  sigma: number;
  battleCount: number;
}

interface TrueSkillStore {
  ratings: Record<string, TrueSkillRating>;
  pendingBattles: number[];
  sessionId: string;
  isHydrated: boolean;
  lastSyncTime: number;
  syncInProgress: boolean;
  totalBattles: number;
  initiatePendingBattle: boolean; // New flag for mode switch coordination
  
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

      // Pending battles management
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
            console.log(`[TRUESKILL_STORE] Syncing to cloud - ${Object.keys(state.ratings).length} ratings, ${state.totalBattles} total battles, ${state.pendingBattles.length} pending battles`);
            
            const response = await fetch('/api/trueskill/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: state.sessionId,
                ratings: state.ratings as any,
                totalBattles: state.totalBattles,
                pendingBattles: state.pendingBattles,
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
                (result.pendingBattles || []).length} pending battles from cloud`
            );
            set({
              ratings: result.ratings,
              totalBattles: result.totalBattles || 0,
              pendingBattles: result.pendingBattles || [],
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
        
        try {
          console.log(`[TRUESKILL_SMART_SYNC] Starting smart sync...`);
          const localRatingsCount = Object.keys(state.ratings).length;
          const localPendingCount = state.pendingBattles.length;
          console.log(`[TRUESKILL_SMART_SYNC] Local state: ${state.totalBattles} battles, ${localRatingsCount} ratings, ${localPendingCount} pending`);

          const response = await fetch('/api/trueskill/get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: state.sessionId })
          });
          
          let cloudData = {
            totalBattles: 0,
            ratings: {},
            pendingBattles: []
          };

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              cloudData = {
                totalBattles: result.totalBattles || 0,
                ratings: result.ratings || {},
                pendingBattles: result.pendingBattles || []
              };
            }
          }
          
          const cloudRatingsCount = Object.keys(cloudData.ratings).length;
          const cloudPendingCount = cloudData.pendingBattles.length;
          console.log(`[TRUESKILL_SMART_SYNC] Cloud state: ${cloudData.totalBattles} battles, ${cloudRatingsCount} ratings, ${cloudPendingCount} pending`);

          // --- NEW MERGE LOGIC ---
          const mergedRatings = { ...state.ratings, ...cloudData.ratings };
          const mergedPendingBattles = [...new Set([...state.pendingBattles, ...cloudData.pendingBattles])];
          const finalTotalBattles = Math.max(state.totalBattles, cloudData.totalBattles);
          
          console.log(`[TRUESKILL_SMART_SYNC] Merging data. Final state will have ${finalTotalBattles} battles, ${Object.keys(mergedRatings).length} ratings, and ${mergedPendingBattles.length} pending battles.`);

          set({
            ratings: mergedRatings,
            totalBattles: finalTotalBattles,
            pendingBattles: mergedPendingBattles,
            isHydrated: true
          });

          // Sync the newly merged state back to the cloud
          await get().syncToCloud();
          
          console.log(`[TRUESKILL_SMART_SYNC] Smart sync completed successfully`);
          
        } catch (error) {
          console.error('[TRUESKILL_SMART_SYNC] Smart sync failed:', error);
          // If sync fails, ensure hydration is still set to true to not block the app
          set({ isHydrated: true });
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
