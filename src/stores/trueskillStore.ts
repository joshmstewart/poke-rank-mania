
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
          console.log(`🔧 [TRUESKILL_HYDRATION_FIX] ===== FORCE REHYDRATE CALLED =====`);
          const storedData = localStorage.getItem('trueskill-storage');
          console.log(`🔧 [TRUESKILL_HYDRATION_FIX] Raw localStorage data exists:`, !!storedData);
          
          if (storedData) {
            const parsed = JSON.parse(storedData);
            console.log(`🔧 [TRUESKILL_HYDRATION_FIX] Parsed data:`, parsed);
            
            const ratings = parsed.state?.ratings || {};
            const sessionId = parsed.state?.sessionId || null;
            const lastUpdated = parsed.state?.lastUpdated || null;
            
            console.log(`🔧 [TRUESKILL_HYDRATION_FIX] Restoring sessionId:`, sessionId);
            console.log(`🔧 [TRUESKILL_HYDRATION_FIX] Restoring ${Object.keys(ratings).length} ratings`);
            
            set({
              ratings: ratings,
              sessionId: sessionId,
              lastUpdated: lastUpdated,
              isHydrated: true
            });
            
            console.log(`🔧 [TRUESKILL_HYDRATION_FIX] ✅ Successfully restored sessionId: ${sessionId}`);
          } else {
            console.log(`🔧 [TRUESKILL_HYDRATION_FIX] No localStorage data found`);
            set({ isHydrated: true });
          }
        } catch (e) {
          console.error('🔧 [TRUESKILL_HYDRATION_FIX] Error during rehydration:', e);
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
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (error) {
            console.error('🔄 [TRUESKILL_RESTORE] Error fetching profile:', error);
            return;
          }

          const storedSessionId = profile ? (profile as any).trueskill_session_id : null;

          if (storedSessionId) {
            console.log(`🔄 [TRUESKILL_RESTORE] Found stored sessionId: ${storedSessionId}`);
            
            set({ sessionId: storedSessionId });
            
            try {
              const currentStorage = JSON.parse(localStorage.getItem('trueskill-storage') || '{}');
              currentStorage.state = {
                ...currentStorage.state,
                sessionId: storedSessionId
              };
              localStorage.setItem('trueskill-storage', JSON.stringify(currentStorage));
              console.log(`🔄 [TRUESKILL_RESTORE] ✅ Updated localStorage with sessionId`);
            } catch (storageError) {
              console.error('🔄 [TRUESKILL_RESTORE] Error updating localStorage:', storageError);
            }
            
            await get().loadFromCloud();
            
            console.log(`🔄 [TRUESKILL_RESTORE] Successfully restored session and loaded data`);
          } else {
            console.log(`🔄 [TRUESKILL_RESTORE] No stored sessionId found for user, will use current session`);
            
            const currentSessionId = get().sessionId;
            if (currentSessionId) {
              await supabase
                .from('profiles')
                .update({ trueskill_session_id: currentSessionId } as any)
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

        console.log(`🔧 [TRUESKILL_LOAD_CLOUD_FIX] ===== LOAD FROM CLOUD CALLED =====`);
        console.log(`🔧 [TRUESKILL_LOAD_CLOUD_FIX] loadFromCloud called with sessionId:`, sessionId);

        if (!sessionId) {
          console.log(`🔧 [TRUESKILL_LOAD_CLOUD_FIX] No sessionId - cannot load from cloud`);
          return;
        }

        set({ isLoading: true });

        try {
          console.log(`🔧 [TRUESKILL_LOAD_CLOUD_FIX] Invoking get-trueskill function with sessionId: ${sessionId}`);
          
          const { data, error } = await supabase.functions.invoke('get-trueskill', {
            body: { sessionId }
          });

          if (error) {
            console.error('🔧 [TRUESKILL_LOAD_CLOUD_FIX] Function invocation error:', error);
            return;
          }

          console.log(`🔧 [TRUESKILL_LOAD_CLOUD_FIX] Function response:`, { success: data?.success, ratingsCount: Object.keys(data?.ratings || {}).length });

          if (data?.success) {
            const ratingsCount = Object.keys(data.ratings || {}).length;
            console.log(`🔧 [TRUESKILL_LOAD_CLOUD_FIX] ✅ Loaded ${ratingsCount} ratings from cloud`);
            
            // CRITICAL FIX: Update ratings in state AND localStorage
            const newState = {
              ratings: data.ratings || {},
              lastUpdated: data.lastUpdated || state.lastUpdated
            };
            
            set(newState);
            
            // CRITICAL FIX: Also update localStorage immediately
            try {
              const currentStorage = JSON.parse(localStorage.getItem('trueskill-storage') || '{}');
              currentStorage.state = {
                ...currentStorage.state,
                ...newState
              };
              localStorage.setItem('trueskill-storage', JSON.stringify(currentStorage));
              console.log(`🔧 [TRUESKILL_LOAD_CLOUD_FIX] ✅ Updated localStorage with ${ratingsCount} cloud ratings`);
            } catch (storageError) {
              console.error('🔧 [TRUESKILL_LOAD_CLOUD_FIX] Error updating localStorage:', storageError);
            }
            
          } else {
            console.log(`🔧 [TRUESKILL_LOAD_CLOUD_FIX] No data returned from cloud for sessionId: ${sessionId}`);
          }
          
        } catch (error) {
          console.error('🔧 [TRUESKILL_LOAD_CLOUD_FIX] Load from cloud error:', error);
        } finally {
          set({ isLoading: false });
          console.log(`🔧 [TRUESKILL_LOAD_CLOUD_FIX] ===== LOAD FROM CLOUD COMPLETE =====`);
        }
      },

      setSessionId: (sessionId: string) => {
        console.log(`🔧 [TRUESKILL_SESSION_FIX] setSessionId called with:`, sessionId);
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
          console.log(`🔧 [TRUESKILL_HYDRATION_FIX] ===== HYDRATION CALLBACK =====`);
          
          if (error) {
            console.error('🔧 [TRUESKILL_HYDRATION_FIX] Hydration failed:', error);
            setTimeout(() => {
              try {
                useTrueSkillStore.setState({ isHydrated: true });
              } catch (e) {
                console.error('🔧 [TRUESKILL_HYDRATION_FIX] Error setting hydration state:', e);
              }
            }, 0);
          } else {
            const ratingsCount = Object.keys(state?.ratings || {}).length;
            const sessionId = state?.sessionId;
            
            console.log(`🔧 [TRUESKILL_HYDRATION_FIX] Hydration success - sessionId:`, sessionId);
            console.log(`🔧 [TRUESKILL_HYDRATION_FIX] Hydration success - ratings count:`, ratingsCount);
            
            setTimeout(() => {
              try {
                useTrueSkillStore.setState({ 
                  isHydrated: true,
                  ratings: state?.ratings || {},
                  sessionId: state?.sessionId || null,
                  lastUpdated: state?.lastUpdated || null
                });
                
                console.log(`🔧 [TRUESKILL_HYDRATION_FIX] ✅ Hydration complete with sessionId: ${state?.sessionId}`);
              } catch (e) {
                console.error('🔧 [TRUESKILL_HYDRATION_FIX] Error setting hydrated state:', e);
                useTrueSkillStore.setState({ isHydrated: true });
              }
            }, 0);
          }
        };
      }
    }
  )
);
