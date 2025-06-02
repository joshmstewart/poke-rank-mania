import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Rating } from 'ts-trueskill';
import { supabase } from '@/integrations/supabase/client';

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
          const { data, error } = await supabase.functions.invoke('sync-trueskill', {
            body: { sessionId, ratings, lastUpdated }
          });

          if (error) {
            console.error('Sync error:', error);
          } else if (data?.success) {
            set({ isDirty: false });
          } else {
            console.error('Sync failed:', data?.error);
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

        console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] ===== LOAD FROM CLOUD START =====`);
        console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] Current sessionId: ${sessionId}`);
        console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] Current ratings count: ${Object.keys(state.ratings).length}`);
        console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] Current lastUpdated: ${state.lastUpdated}`);

        if (!sessionId) {
          console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] No sessionId - aborting cloud load`);
          return;
        }

        set({ isLoading: true });

        try {
          console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] Making request to get-trueskill function`);
          
          const { data, error } = await supabase.functions.invoke('get-trueskill', {
            body: { sessionId }
          });
          
          console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] Function response received:`);
          console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] - Error: ${error ? JSON.stringify(error) : 'none'}`);
          console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] - Data:`, data);

          if (error) {
            console.error(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] Function invocation error:`, error);
            return;
          }

          if (data?.success) {
            console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] Setting store state with cloud data`);
            
            set({
              ratings: data.ratings || {},
              lastUpdated: data.lastUpdated || state.lastUpdated
            });
            
            console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] Store updated - new ratings count: ${Object.keys(data.ratings || {}).length}`);
          } else {
            console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] Response success was false`);
            if (data?.error) {
              console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] Response error: ${data.error}`);
            }
          }
          
        } catch (error) {
          console.error(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] ===== LOAD FROM CLOUD ERROR =====`);
          console.error(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] Error:`, error);
        } finally {
          set({ isLoading: false });
          console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] ===== LOAD FROM CLOUD END =====`);
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
