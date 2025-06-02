
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
  forceCorrectSession: (userId: string) => Promise<void>;
  markDirty: () => void;
  setLoading: (loading: boolean) => void;
  forceRehydrate: () => void;
  waitForHydration: () => Promise<void>;
}

// CRITICAL FIX: Global function to get correct sessionId immediately
const getCorrectSessionIdSync = async (currentSessionId: string | null): Promise<string | null> => {
  try {
    console.log(`🚨🚨🚨 [HYDRATION_SESSION_FIX] ===== GETTING CORRECT SESSION ID =====`);
    console.log(`🚨🚨🚨 [HYDRATION_SESSION_FIX] Current localStorage sessionId: ${currentSessionId}`);
    
    // Get current user synchronously if possible
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      console.log(`🚨🚨🚨 [HYDRATION_SESSION_FIX] No user found, keeping current sessionId`);
      return currentSessionId;
    }
    
    console.log(`🚨🚨🚨 [HYDRATION_SESSION_FIX] User found: ${user.id.substring(0, 8)}`);
    
    // Get correct sessionId from profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('trueskill_session_id')
      .eq('id', user.id)
      .maybeSingle();
      
    if (error || !profile) {
      console.log(`🚨🚨🚨 [HYDRATION_SESSION_FIX] No profile found, keeping current sessionId`);
      return currentSessionId;
    }
    
    const correctSessionId = profile.trueskill_session_id;
    console.log(`🚨🚨🚨 [HYDRATION_SESSION_FIX] Correct sessionId from profile: ${correctSessionId}`);
    
    if (correctSessionId && correctSessionId !== currentSessionId) {
      console.log(`🚨🚨🚨 [HYDRATION_SESSION_FIX] ⚠️ SESSION MISMATCH DETECTED!`);
      console.log(`🚨🚨🚨 [HYDRATION_SESSION_FIX] Current: ${currentSessionId}`);
      console.log(`🚨🚨🚨 [HYDRATION_SESSION_FIX] Correct: ${correctSessionId}`);
      return correctSessionId;
    }
    
    console.log(`🚨🚨🚨 [HYDRATION_SESSION_FIX] SessionId is already correct`);
    return currentSessionId;
    
  } catch (error) {
    console.error('🚨🚨🚨 [HYDRATION_SESSION_FIX] Error getting correct sessionId:', error);
    return currentSessionId;
  }
};

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

      forceCorrectSession: async (userId: string) => {
        console.log(`🚨 [FORCE_CORRECT_SESSION] ===== FORCING CORRECT SESSION FOR USER =====`);
        console.log(`🚨 [FORCE_CORRECT_SESSION] User ID: ${userId}`);
        
        try {
          // Get the correct sessionId from user profile
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (error) {
            console.error('🚨 [FORCE_CORRECT_SESSION] Error fetching profile:', error);
            return;
          }

          const correctSessionId = profile ? (profile as any).trueskill_session_id : null;
          const currentSessionId = get().sessionId;
          
          console.log(`🚨 [FORCE_CORRECT_SESSION] Current sessionId: ${currentSessionId}`);
          console.log(`🚨 [FORCE_CORRECT_SESSION] Correct sessionId from profile: ${correctSessionId}`);
          
          if (correctSessionId && currentSessionId !== correctSessionId) {
            console.log(`🚨 [FORCE_CORRECT_SESSION] ⚠️ SESSION MISMATCH - FORCING CORRECTION!`);
            
            // Update sessionId in state first
            set({ sessionId: correctSessionId });
            
            // Update localStorage immediately
            try {
              const currentStorage = JSON.parse(localStorage.getItem('trueskill-storage') || '{}');
              currentStorage.state = {
                ...currentStorage.state,
                sessionId: correctSessionId
              };
              localStorage.setItem('trueskill-storage', JSON.stringify(currentStorage));
              console.log(`🚨 [FORCE_CORRECT_SESSION] ✅ Updated localStorage with correct sessionId`);
            } catch (storageError) {
              console.error('🚨 [FORCE_CORRECT_SESSION] Error updating localStorage:', storageError);
            }
            
            // Force load data from cloud for correct session
            console.log(`🚨 [FORCE_CORRECT_SESSION] Loading data from cloud for correct sessionId: ${correctSessionId}`);
            await get().loadFromCloud();
            
            console.log(`🚨 [FORCE_CORRECT_SESSION] ✅ Session correction completed successfully`);
          } else if (correctSessionId) {
            console.log(`🚨 [FORCE_CORRECT_SESSION] SessionId is already correct - no change needed`);
          } else {
            console.log(`🚨 [FORCE_CORRECT_SESSION] No sessionId found in profile`);
          }
        } catch (error) {
          console.error('🚨 [FORCE_CORRECT_SESSION] Error during session correction:', error);
        }
      },

      restoreSessionFromCloud: async (userId: string) => {
        console.log(`🔄 [TRUESKILL_SESSION_RESTORE_FIX] ===== ENHANCED SESSION RESTORATION =====`);
        console.log(`🔄 [TRUESKILL_SESSION_RESTORE_FIX] Restoring TrueSkill session for user: ${userId}`);
        
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (error) {
            console.error('🔄 [TRUESKILL_SESSION_RESTORE_FIX] Error fetching profile:', error);
            return;
          }

          const storedSessionId = profile ? (profile as any).trueskill_session_id : null;

          if (storedSessionId) {
            console.log(`🔄 [TRUESKILL_SESSION_RESTORE_FIX] Found stored sessionId in profile: ${storedSessionId}`);
            
            // CRITICAL FIX: Check if this is different from current sessionId
            const currentSessionId = get().sessionId;
            console.log(`🔄 [TRUESKILL_SESSION_RESTORE_FIX] Current sessionId: ${currentSessionId}`);
            console.log(`🔄 [TRUESKILL_SESSION_RESTORE_FIX] Profile sessionId: ${storedSessionId}`);
            
            if (currentSessionId !== storedSessionId) {
              console.log(`🔄 [TRUESKILL_SESSION_RESTORE_FIX] ⚠️ SESSION MISMATCH DETECTED - CORRECTING!`);
              console.log(`🔄 [TRUESKILL_SESSION_RESTORE_FIX] Switching from ${currentSessionId} to ${storedSessionId}`);
              
              // Update the sessionId in state first
              set({ sessionId: storedSessionId });
              
              // Update localStorage to reflect the correct sessionId
              try {
                const currentStorage = JSON.parse(localStorage.getItem('trueskill-storage') || '{}');
                currentStorage.state = {
                  ...currentStorage.state,
                  sessionId: storedSessionId
                };
                localStorage.setItem('trueskill-storage', JSON.stringify(currentStorage));
                console.log(`🔄 [TRUESKILL_SESSION_RESTORE_FIX] ✅ Updated localStorage with correct sessionId`);
              } catch (storageError) {
                console.error('🔄 [TRUESKILL_SESSION_RESTORE_FIX] Error updating localStorage:', storageError);
              }
            } else {
              console.log(`🔄 [TRUESKILL_SESSION_RESTORE_FIX] SessionId already correct - no change needed`);
            }
            
            // CRITICAL FIX: Always attempt cloud load with the correct sessionId
            console.log(`🔄 [TRUESKILL_SESSION_RESTORE_FIX] Loading data from cloud for sessionId: ${storedSessionId}`);
            await get().loadFromCloud();
            
            console.log(`🔄 [TRUESKILL_SESSION_RESTORE_FIX] ✅ Session restoration completed successfully`);
          } else {
            console.log(`🔄 [TRUESKILL_SESSION_RESTORE_FIX] No stored sessionId found for user, using current session`);
            
            const currentSessionId = get().sessionId;
            if (currentSessionId) {
              console.log(`🔄 [TRUESKILL_SESSION_RESTORE_FIX] Saving current sessionId to profile: ${currentSessionId}`);
              await supabase
                .from('profiles')
                .update({ trueskill_session_id: currentSessionId } as any)
                .eq('id', userId);
              
              console.log(`🔄 [TRUESKILL_SESSION_RESTORE_FIX] ✅ Saved current sessionId to user profile`);
            }
          }
        } catch (error) {
          console.error('🔄 [TRUESKILL_SESSION_RESTORE_FIX] Error during session restoration:', error);
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
        return async (state, error) => {
          console.log(`🚨🚨🚨 [HYDRATION_CALLBACK_CRITICAL] ===== HYDRATION CALLBACK STARTED =====`);
          
          if (error) {
            console.error('🚨🚨🚨 [HYDRATION_CALLBACK_CRITICAL] Hydration failed:', error);
            setTimeout(() => {
              try {
                useTrueSkillStore.setState({ isHydrated: true });
              } catch (e) {
                console.error('🚨🚨🚨 [HYDRATION_CALLBACK_CRITICAL] Error setting hydration state:', e);
              }
            }, 0);
            return;
          }
          
          const ratingsCount = Object.keys(state?.ratings || {}).length;
          const currentSessionId = state?.sessionId;
          
          console.log(`🚨🚨🚨 [HYDRATION_CALLBACK_CRITICAL] Initial hydration - sessionId:`, currentSessionId);
          console.log(`🚨🚨🚨 [HYDRATION_CALLBACK_CRITICAL] Initial hydration - ratings count:`, ratingsCount);
          
          // CRITICAL FIX: Immediately check if we need to correct the sessionId
          try {
            const correctSessionId = await getCorrectSessionIdSync(currentSessionId);
            
            if (correctSessionId && correctSessionId !== currentSessionId) {
              console.log(`🚨🚨🚨 [HYDRATION_CALLBACK_CRITICAL] ⚠️ CORRECTING SESSION DURING HYDRATION!`);
              console.log(`🚨🚨🚨 [HYDRATION_CALLBACK_CRITICAL] From: ${currentSessionId} To: ${correctSessionId}`);
              
              // IMMEDIATELY update localStorage with correct sessionId
              try {
                const currentStorage = JSON.parse(localStorage.getItem('trueskill-storage') || '{}');
                currentStorage.state = {
                  ...currentStorage.state,
                  sessionId: correctSessionId
                };
                localStorage.setItem('trueskill-storage', JSON.stringify(currentStorage));
                console.log(`🚨🚨🚨 [HYDRATION_CALLBACK_CRITICAL] ✅ Updated localStorage with correct sessionId during hydration`);
              } catch (storageError) {
                console.error('🚨🚨🚨 [HYDRATION_CALLBACK_CRITICAL] Error updating localStorage during hydration:', storageError);
              }
              
              // Set the correct sessionId in state
              setTimeout(() => {
                try {
                  useTrueSkillStore.setState({ 
                    isHydrated: true,
                    ratings: state?.ratings || {},
                    sessionId: correctSessionId, // Use the CORRECT sessionId
                    lastUpdated: state?.lastUpdated || null
                  });
                  
                  console.log(`🚨🚨🚨 [HYDRATION_CALLBACK_CRITICAL] ✅ Hydration complete with CORRECTED sessionId: ${correctSessionId}`);
                  
                  // Force load from cloud with correct session after a brief delay
                  setTimeout(() => {
                    useTrueSkillStore.getState().loadFromCloud();
                  }, 100);
                  
                } catch (e) {
                  console.error('🚨🚨🚨 [HYDRATION_CALLBACK_CRITICAL] Error setting corrected state:', e);
                  useTrueSkillStore.setState({ isHydrated: true });
                }
              }, 0);
              
            } else {
              // SessionId is correct, proceed normally
              setTimeout(() => {
                try {
                  useTrueSkillStore.setState({ 
                    isHydrated: true,
                    ratings: state?.ratings || {},
                    sessionId: state?.sessionId || null,
                    lastUpdated: state?.lastUpdated || null
                  });
                  
                  console.log(`🚨🚨🚨 [HYDRATION_CALLBACK_CRITICAL] ✅ Hydration complete with correct sessionId: ${state?.sessionId}`);
                } catch (e) {
                  console.error('🚨🚨🚨 [HYDRATION_CALLBACK_CRITICAL] Error setting hydrated state:', e);
                  useTrueSkillStore.setState({ isHydrated: true });
                }
              }, 0);
            }
            
          } catch (sessionCheckError) {
            console.error('🚨🚨🚨 [HYDRATION_CALLBACK_CRITICAL] Error checking correct sessionId:', sessionCheckError);
            // Fallback to normal hydration
            setTimeout(() => {
              try {
                useTrueSkillStore.setState({ 
                  isHydrated: true,
                  ratings: state?.ratings || {},
                  sessionId: state?.sessionId || null,
                  lastUpdated: state?.lastUpdated || null
                });
                
                console.log(`🚨🚨🚨 [HYDRATION_CALLBACK_CRITICAL] ✅ Fallback hydration complete with sessionId: ${state?.sessionId}`);
              } catch (e) {
                console.error('🚨🚨🚨 [HYDRATION_CALLBACK_CRITICAL] Error in fallback hydration:', e);
                useTrueSkillStore.setState({ isHydrated: true });
              }
            }, 0);
          }
        };
      }
    }
  )
);
