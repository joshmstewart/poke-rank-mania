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
          console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] Making fetch request to: /api/getTrueSkill?sessionId=${sessionId}`);
          
          const response = await fetch(`/api/getTrueSkill?sessionId=${sessionId}`);
          
          console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] Response received:`);
          console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] - Status: ${response.status}`);
          console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] - Status Text: ${response.statusText}`);
          console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] - Content-Type: ${response.headers.get('content-type')}`);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          // CRITICAL FIX: Check content type before parsing JSON
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.error(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] ===== CONTENT TYPE ERROR =====`);
            console.error(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] Expected JSON but got: ${contentType}`);
            console.error(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] This indicates the API endpoint returned HTML instead of JSON`);
            throw new Error(`API returned non-JSON response. Content-Type: ${contentType}`);
          }
          
          const data = await response.json();
          
          console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] Parsed response data:`);
          console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] - Success: ${data.success}`);
          console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] - Data type: ${typeof data}`);
          console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] - Data keys: ${Object.keys(data).join(', ')}`);
          
          if (data.ratings) {
            console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] - Ratings type: ${typeof data.ratings}`);
            console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] - Ratings count: ${Object.keys(data.ratings).length}`);
            console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] - First 5 rating IDs: ${Object.keys(data.ratings).slice(0, 5).join(', ')}`);
          } else {
            console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] - No ratings in response`);
          }
          
          if (data.lastUpdated) {
            console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] - LastUpdated: ${data.lastUpdated}`);
          }

          if (data.success) {
            console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] Setting store state with cloud data`);
            
            set({
              ratings: data.ratings || {},
              lastUpdated: data.lastUpdated || state.lastUpdated
            });
            
            console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] Store updated - new ratings count: ${Object.keys(data.ratings || {}).length}`);
          } else {
            console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] Response success was false`);
            if (data.error) {
              console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] Response error: ${data.error}`);
            }
          }
          
        } catch (error) {
          console.error(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] ===== LOAD FROM CLOUD ERROR =====`);
          console.error(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] Error type: ${typeof error}`);
          console.error(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] Error constructor: ${error?.constructor?.name}`);
          console.error(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] Error message: "${error?.message || 'No message'}"`);
          console.error(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] Error stack:`, error?.stack);
          console.error(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] Full error object:`, error);
          console.error(`🔍🔍🔍 [TRUESKILL_CLOUD_DEBUG] JSON stringified error:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
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
