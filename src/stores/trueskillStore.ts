
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
  restoreSessionFromCloud: (userId: string) => Promise<void>;
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

      restoreSessionFromCloud: async (userId: string) => {
        console.log(`🔄 [TRUESKILL_RESTORE] Restoring TrueSkill session for user: ${userId}`);
        
        try {
          // Get user profile which should include their TrueSkill sessionId
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('trueskill_session_id')
            .eq('id', userId)
            .maybeSingle();

          if (error) {
            console.error('🔄 [TRUESKILL_RESTORE] Error fetching profile:', error);
            return;
          }

          if (profile?.trueskill_session_id) {
            console.log(`🔄 [TRUESKILL_RESTORE] Found stored sessionId: ${profile.trueskill_session_id}`);
            
            // Set the sessionId in the store and localStorage
            set({ sessionId: profile.trueskill_session_id });
            
            // Force update localStorage with the restored sessionId
            const currentStorage = JSON.parse(localStorage.getItem('trueskill-storage') || '{}');
            currentStorage.state = {
              ...currentStorage.state,
              sessionId: profile.trueskill_session_id
            };
            localStorage.setItem('trueskill-storage', JSON.stringify(currentStorage));
            
            // Now load the data from cloud using the restored sessionId
            await get().loadFromCloud();
            
            console.log(`🔄 [TRUESKILL_RESTORE] Successfully restored session and loaded data`);
          } else {
            console.log(`🔄 [TRUESKILL_RESTORE] No stored sessionId found for user, will use current session`);
            
            // If no stored sessionId but user is logged in, save current sessionId to their profile
            const currentSessionId = get().sessionId;
            if (currentSessionId) {
              await supabase
                .from('profiles')
                .update({ trueskill_session_id: currentSessionId })
                .eq('id', userId);
              
              console.log(`🔄 [TRUESKILL_RESTORE] Saved current sessionId to user profile`);
            }
          }
        } catch (error) {
          console.error('🔄 [TRUESKILL_RESTORE] Error during session restoration:', error);
        }
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

        if (!sessionId) {
          return;
        }

        set({ isLoading: true });

        try {
          const { data, error } = await supabase.functions.invoke('get-trueskill', {
            body: { sessionId }
          });

          if (error) {
            console.error('Function invocation error:', error);
            return;
          }

          if (data?.success) {
            set({
              ratings: data.ratings || {},
              lastUpdated: data.lastUpdated || state.lastUpdated
            });
          }
          
        } catch (error) {
          console.error('Load from cloud error:', error);
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
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Hydration failed:', error);
            setTimeout(() => {
              try {
                useTrueSkillStore.setState({ isHydrated: true });
              } catch (e) {
                console.error('Error setting hydration state:', e);
              }
            }, 0);
          } else {
            const ratingsCount = Object.keys(state?.ratings || {}).length;
            
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
