
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Rating } from 'ts-trueskill';

interface TrueSkillState {
  ratings: Record<string, { mu: number; sigma: number; battleCount?: number; lastUpdated?: string }>;
  sessionId: string | null;
  lastUpdated: string | null;
  isDirty: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  
  // Actions
  updateRating: (pokemonId: string, rating: Rating, battleCount?: number) => void;
  getRating: (pokemonId: string) => Rating;
  hasRating: (pokemonId: string) => boolean;
  getAllRatings: () => Record<string, { mu: number; sigma: number; battleCount?: number; lastUpdated?: string }>;
  clearAllRatings: () => void;
  syncToCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
  setSessionId: (sessionId: string) => void;
  markDirty: () => void;
  setLoading: (loading: boolean) => void;
  forceRehydrate: () => void;
  waitForHydration: () => Promise<void>;
}

export const useTrueSkillStore = create<TrueSkillState>()(
  persist(
    (set, get) => ({
      ratings: {},
      sessionId: null,
      lastUpdated: null,
      isDirty: false,
      isLoading: false,
      isHydrated: false,

      updateRating: (pokemonId: string, rating: Rating, battleCount?: number) => {
        set((state) => {
          const newRatings = {
            ...state.ratings,
            [pokemonId]: { 
              mu: rating.mu, 
              sigma: rating.sigma, 
              battleCount: battleCount || state.ratings[pokemonId]?.battleCount || 0,
              lastUpdated: new Date().toISOString()
            }
          };
          
          return {
            ratings: newRatings,
            isDirty: true,
            lastUpdated: new Date().toISOString()
          };
        });
      },

      getRating: (pokemonId: string) => {
        const ratings = get().ratings;
        const stored = ratings[pokemonId];
        if (stored) {
          return new Rating(stored.mu, stored.sigma);
        }
        return new Rating(); // Default rating
      },

      hasRating: (pokemonId: string) => {
        const ratings = get().ratings;
        return pokemonId in ratings;
      },

      getAllRatings: () => {
        const state = get();
        return state.ratings || {};
      },

      waitForHydration: async () => {
        return new Promise((resolve) => {
          const checkHydration = () => {
            const state = get();
            if (state.isHydrated) {
              resolve();
            } else {
              setTimeout(checkHydration, 50);
            }
          };
          checkHydration();
        });
      },

      forceRehydrate: () => {
        try {
          const storedData = localStorage.getItem('trueskill-storage');
          if (storedData) {
            const parsed = JSON.parse(storedData);
            const ratings = parsed.state?.ratings || {};
            
            set({
              ratings: ratings,
              sessionId: parsed.state?.sessionId || null,
              lastUpdated: parsed.state?.lastUpdated || null,
              isHydrated: true
            });
          } else {
            set({ isHydrated: true });
          }
        } catch (e) {
          console.error('Error during rehydration:', e);
          set({ isHydrated: true });
        }
      },

      clearAllRatings: () => {
        set({
          ratings: {},
          isDirty: true,
          lastUpdated: new Date().toISOString()
        });
      },

      syncToCloud: async () => {
        const state = get();
        const { sessionId, ratings, lastUpdated, isDirty } = state;
        
        if (!isDirty || !sessionId) {
          return;
        }

        set({ isLoading: true });

        try {
          const response = await fetch('/api/syncTrueSkill', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId, ratings, lastUpdated }),
          });

          const data = await response.json();

          if (data.success) {
            set({ isDirty: false });
          } else {
            console.error('Sync failed:', data.error);
          }
        } catch (error) {
          console.error('Sync error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      loadFromCloud: async () => {
        const state = get();
        const { sessionId } = state;

        if (!sessionId) {
          return;
        }

        set({ isLoading: true });

        try {
          const response = await fetch(`/api/getTrueSkill?sessionId=${sessionId}`);
          const data = await response.json();

          if (data.success) {
            set({
              ratings: data.ratings,
              lastUpdated: data.lastUpdated
            });
          }
        } catch (error) {
          console.error('Load error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      setSessionId: (sessionId: string) => {
        set({ sessionId });
      },

      markDirty: () => {
        set({ isDirty: true });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      }
    }),
    {
      name: 'trueskill-storage',
      partialize: (state) => ({
        ratings: state.ratings,
        sessionId: state.sessionId,
        lastUpdated: state.lastUpdated
      }),
      // CRITICAL FIX: Simplified hydration callback that doesn't access store methods
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Hydration failed:', error);
            // Use a setTimeout to ensure the store is fully initialized before setting state
            setTimeout(() => {
              try {
                useTrueSkillStore.setState({ isHydrated: true });
              } catch (e) {
                console.error('Error setting hydration state:', e);
              }
            }, 0);
          } else {
            const ratingsCount = Object.keys(state?.ratings || {}).length;
            
            // Use setTimeout to avoid accessing store during initialization
            setTimeout(() => {
              try {
                useTrueSkillStore.setState({ 
                  isHydrated: true,
                  ratings: state?.ratings || {}
                });
              } catch (e) {
                console.error('Error setting hydrated state:', e);
                useTrueSkillStore.setState({ isHydrated: true });
              }
            }, 0);
          }
        };
      }
    }
  )
);
