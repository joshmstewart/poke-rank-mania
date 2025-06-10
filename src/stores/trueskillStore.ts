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
  sessionId: string;
  isHydrated: boolean;
  lastSyncTime: number;
  syncInProgress: boolean;
  totalBattles: number;
  
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
  syncToCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
  smartSync: () => Promise<void>;
  waitForHydration: () => Promise<void>;
  restoreSessionFromCloud: (userId: string) => Promise<void>;
}

const generateSessionId = () => crypto.randomUUID();

export const useTrueSkillStore = create<TrueSkillStore>()(
  persist(
    (set, get) => ({
      ratings: {},
      sessionId: generateSessionId(),
      isHydrated: false,
      lastSyncTime: 0,
      syncInProgress: false,
      totalBattles: 0,

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
        
        // Auto-sync after updates
        setTimeout(() => get().syncToCloud(), 100);
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
        
        // Auto-sync after battle count increment
        setTimeout(() => get().syncToCloud(), 100);
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
        setTimeout(() => get().syncToCloud(), 100);
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

      syncToCloud: async (options?: { force?: boolean }) => {
        const force = options?.force ?? false;
        const state = get();
        if (state.syncInProgress && !force) return;

        const manageFlag = !state.syncInProgress;
        if (manageFlag) {
          set({ syncInProgress: true });
        }
        
        try {
          console.log(`[TRUESKILL_STORE] Syncing to cloud - ${Object.keys(state.ratings).length} ratings, ${state.totalBattles} total battles`);
          
          const response = await fetch('/api/trueskill/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: state.sessionId,
              ratings: state.ratings as any,
              totalBattles: state.totalBattles,
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
          if (manageFlag) {
            set({ syncInProgress: false });
          }
        }
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
            console.log(`[TRUESKILL_STORE] Loaded ${Object.keys(result.ratings).length} ratings, ${result.totalBattles || 0} total battles from cloud`);
            set({ 
              ratings: result.ratings,
              totalBattles: result.totalBattles || 0
            });
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
          console.log(`[TRUESKILL_SMART_SYNC] Local state: ${state.totalBattles} battles, ${Object.keys(state.ratings).length} ratings`);
          
          // Get current cloud data
          const response = await fetch('/api/trueskill/get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: state.sessionId })
          });
          
          let cloudData = null;
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              cloudData = {
                totalBattles: result.totalBattles || 0,
                ratings: result.ratings || {}
              };
            }
          }
          
          console.log(`[TRUESKILL_SMART_SYNC] Cloud state: ${cloudData?.totalBattles || 0} battles, ${Object.keys(cloudData?.ratings || {}).length} ratings`);
          
          const localBattles = state.totalBattles;
          const cloudBattles = cloudData?.totalBattles || 0;
          
          // Smart sync logic
          if (cloudBattles > localBattles) {
            // Case 1 & 3: Cloud has more data, use cloud and update local
            console.log(`[TRUESKILL_SMART_SYNC] Cloud wins (${cloudBattles} > ${localBattles}), updating local with cloud data`);
            set({
              ratings: cloudData?.ratings || {},
              totalBattles: cloudBattles
            });
          } else if (localBattles > cloudBattles) {
            // Case 2: Local has more data, push local to cloud
            console.log(`[TRUESKILL_SMART_SYNC] Local wins (${localBattles} > ${cloudBattles}), pushing local data to cloud`);
            await get().syncToCloud({ force: true });
          } else if (localBattles === cloudBattles && cloudBattles > 0) {
            // Equal and both have data, use cloud as authoritative
            console.log(`[TRUESKILL_SMART_SYNC] Equal battle counts (${localBattles}), using cloud as authoritative source`);
            set({
              ratings: cloudData?.ratings || {},
              totalBattles: cloudBattles
            });
          } else {
            // Both are 0 or local > cloud but cloud is 0
            console.log(`[TRUESKILL_SMART_SYNC] Using local data (local: ${localBattles}, cloud: ${cloudBattles})`);
            if (localBattles > 0) {
              await get().syncToCloud({ force: true });
            }
          }
          
          console.log(`[TRUESKILL_SMART_SYNC] Smart sync completed successfully`);
          
        } catch (error) {
          console.error('[TRUESKILL_SMART_SYNC] Smart sync failed:', error);
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
