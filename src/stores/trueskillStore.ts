
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Rating } from 'ts-trueskill';

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
  syncToCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
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

      syncToCloud: async () => {
        const state = get();
        if (state.syncInProgress) return;
        
        set({ syncInProgress: true });
        
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
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Sync failed: ${response.status} - ${errorText}`);
          }
          
          const result = await response.json();
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
          await get().loadFromCloud();
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
