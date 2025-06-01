import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Rating } from 'ts-trueskill';
import { supabase } from '@/integrations/supabase/client';

export interface TrueSkillRating {
  mu: number;
  sigma: number;
  lastUpdated: string;
  battleCount: number;
}

interface TrueSkillStore {
  ratings: Record<number, TrueSkillRating>;
  isLoading: boolean;
  lastSyncedAt: string | null;
  sessionId: string;
  updateRating: (pokemonId: number, rating: Rating) => void;
  getRating: (pokemonId: number) => Rating;
  hasRating: (pokemonId: number) => boolean;
  getAllRatings: () => Record<number, TrueSkillRating>;
  clearAllRatings: () => void;
  clearCloudData: () => Promise<void>;
  syncToCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
  debugStore: () => void;
}

// Generate or load session ID
const getOrCreateSessionId = (): string => {
  const stored = localStorage.getItem('trueskill-session-id');
  if (stored) return stored;
  
  const newSessionId = crypto.randomUUID();
  localStorage.setItem('trueskill-session-id', newSessionId);
  return newSessionId;
};

export const useTrueSkillStore = create<TrueSkillStore>()(
  persist(
    (set, get) => ({
      ratings: {},
      isLoading: false,
      lastSyncedAt: null,
      sessionId: getOrCreateSessionId(),
      
      debugStore: () => {
        const state = get();
        console.log(`🔍 [TRUESKILL_STORE_DEBUG] ===== STORE DEBUG =====`);
        console.log(`🔍 [TRUESKILL_STORE_DEBUG] Store ratings count: ${Object.keys(state.ratings).length}`);
        console.log(`🔍 [TRUESKILL_STORE_DEBUG] Session ID: ${state.sessionId.substring(0, 8)}...`);
        console.log(`🔍 [TRUESKILL_STORE_DEBUG] Last synced: ${state.lastSyncedAt}`);
        
        // Check localStorage directly
        const localStorageData = localStorage.getItem('trueskill-ratings-store');
        if (localStorageData) {
          try {
            const parsed = JSON.parse(localStorageData);
            const persistedRatings = parsed.state?.ratings || {};
            console.log(`🔍 [TRUESKILL_STORE_DEBUG] localStorage ratings count: ${Object.keys(persistedRatings).length}`);
            
            if (Object.keys(persistedRatings).length !== Object.keys(state.ratings).length) {
              console.error(`🔍 [TRUESKILL_STORE_DEBUG] ❌ MISMATCH: Store has ${Object.keys(state.ratings).length}, localStorage has ${Object.keys(persistedRatings).length}`);
            }
          } catch (e) {
            console.error(`🔍 [TRUESKILL_STORE_DEBUG] ❌ Failed to parse localStorage data:`, e);
          }
        } else {
          console.log(`🔍 [TRUESKILL_STORE_DEBUG] No localStorage data found`);
        }
        
        console.log(`🔍 [TRUESKILL_STORE_DEBUG] ===== END DEBUG =====`);
      },
      
      updateRating: (pokemonId: number, rating: Rating) => {
        console.log(`[TRUESKILL_LOCAL] Updating rating for Pokemon ${pokemonId}: μ=${rating.mu.toFixed(2)}, σ=${rating.sigma.toFixed(2)}`);
        
        set((state) => {
          const newRatings = {
            ...state.ratings,
            [pokemonId]: {
              mu: rating.mu,
              sigma: rating.sigma,
              lastUpdated: new Date().toISOString(),
              battleCount: (state.ratings[pokemonId]?.battleCount || 0) + 1
            }
          };
          
          console.log(`[TRUESKILL_STORE_DEBUG] After update - Total ratings: ${Object.keys(newRatings).length}`);
          
          // Trigger events and cloud sync after state update
          setTimeout(() => {
            get().syncToCloud();
            
            const updateEvent = new CustomEvent('trueskill-store-updated', {
              detail: { pokemonId, rating: newRatings[pokemonId] }
            });
            document.dispatchEvent(updateEvent);
            
            const syncEvent = new CustomEvent('trueskill-updated', {
              detail: { 
                source: 'store-update',
                pokemonId,
                timestamp: Date.now()
              }
            });
            document.dispatchEvent(syncEvent);
          }, 100);
          
          return { ratings: newRatings };
        });
      },
      
      getRating: (pokemonId: number) => {
        const state = get();
        const storedRating = state.ratings[pokemonId];
        if (storedRating) {
          return new Rating(storedRating.mu, storedRating.sigma);
        }
        return new Rating();
      },
      
      hasRating: (pokemonId: number) => {
        return pokemonId in get().ratings;
      },
      
      getAllRatings: () => {
        const state = get();
        const ratings = state.ratings;
        console.log(`[TRUESKILL_STORE_DEBUG] getAllRatings called - returning ${Object.keys(ratings).length} ratings`);
        
        // CRITICAL FIX: Verify localStorage consistency
        const localStorageData = localStorage.getItem('trueskill-ratings-store');
        if (localStorageData) {
          try {
            const parsed = JSON.parse(localStorageData);
            const persistedRatings = parsed.state?.ratings || {};
            const persistedCount = Object.keys(persistedRatings).length;
            
            if (persistedCount !== Object.keys(ratings).length) {
              console.error(`[TRUESKILL_STORE_DEBUG] ❌ CRITICAL: Store/localStorage mismatch! Store: ${Object.keys(ratings).length}, localStorage: ${persistedCount}`);
              console.error(`[TRUESKILL_STORE_DEBUG] ❌ This indicates the store is not properly synced with localStorage`);
              
              // Force reload from localStorage if it has more data
              if (persistedCount > Object.keys(ratings).length) {
                console.log(`[TRUESKILL_STORE_DEBUG] 🔄 Forcing reload from localStorage with more data`);
                set({ ratings: persistedRatings });
                return persistedRatings;
              }
            }
          } catch (e) {
            console.error(`[TRUESKILL_STORE_DEBUG] ❌ Failed to parse localStorage for consistency check:`, e);
          }
        }
        
        return ratings;
      },
      
      clearAllRatings: () => {
        console.log(`[TRUESKILL_CLEAR] ===== CLEARING ALL RATINGS =====`);
        console.log(`[TRUESKILL_CLEAR] Current ratings count before clear:`, Object.keys(get().ratings).length);
        
        set({ ratings: {}, lastSyncedAt: null });
        
        setTimeout(async () => {
          console.log(`[TRUESKILL_CLEAR] ===== CLEARING CLOUD DATA =====`);
          await get().clearCloudData();
          
          const clearEvent = new CustomEvent('trueskill-store-cleared');
          document.dispatchEvent(clearEvent);
          
          const syncEvent = new CustomEvent('trueskill-updated', {
            detail: { 
              source: 'store-cleared',
              timestamp: Date.now()
            }
          });
          document.dispatchEvent(syncEvent);
          
          console.log(`[TRUESKILL_CLEAR] ===== CLEAR COMPLETE =====`);
        }, 100);
      },
      
      clearCloudData: async () => {
        const state = get();
        
        console.log(`🌐 [CLOUD_CLEAR] ===== CLEARING CLOUD DATA =====`);
        console.log(`🌐 [CLOUD_CLEAR] Session ID: ${state.sessionId.substring(0, 8)}...`);
        
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.log(`🌐 [CLOUD_CLEAR] Auth check error:`, userError.message);
          }
          
          if (user?.id) {
            const { error: deleteError } = await supabase
              .from('trueskill_sessions')
              .delete()
              .eq('user_id', user.id)
              .is('session_id', null);
            
            if (deleteError) {
              console.log(`🌐 [CLOUD_CLEAR] Error clearing authenticated user data:`, deleteError);
            } else {
              console.log(`🌐 [CLOUD_CLEAR] ✅ Cleared authenticated user data`);
            }
          } else {
            const { error: deleteError } = await supabase
              .from('trueskill_sessions')
              .delete()
              .eq('session_id', state.sessionId)
              .is('user_id', null);
            
            if (deleteError) {
              console.log(`🌐 [CLOUD_CLEAR] Error clearing anonymous session data:`, deleteError);
            } else {
              console.log(`🌐 [CLOUD_CLEAR] ✅ Cleared anonymous session data`);
            }
          }
          
        } catch (error) {
          console.log(`🌐 [CLOUD_CLEAR] Unexpected error clearing cloud data:`, error);
        }
      },
      
      syncToCloud: async () => {
        const state = get();
        
        console.log(`🌐 [CLOUD_SYNC_DETAILED] ===== STARTING CLOUD SYNC =====`);
        console.log(`🌐 [CLOUD_SYNC_DETAILED] Local ratings count before sync: ${Object.keys(state.ratings).length}`);
        
        if (Object.keys(state.ratings).length === 0) {
          console.log('🌐 [CLOUD_SYNC_DETAILED] No ratings to sync, skipping cloud sync');
          return;
        }
        
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.log('🌐 [CLOUD_SYNC_DETAILED] Auth check error (continuing with anonymous):', userError.message);
          }
          
          if (user?.id) {
            const { error: upsertError } = await supabase
              .from('trueskill_sessions')
              .upsert([{
                user_id: user.id,
                session_id: null,
                ratings_data: state.ratings as any,
                last_updated: new Date().toISOString()
              }], {
                onConflict: 'user_id',
                ignoreDuplicates: false
              });
            
            if (upsertError) {
              console.log('🌐 [CLOUD_SYNC_DETAILED] Authenticated user upsert error (keeping local data):', upsertError);
              return;
            }
          } else {
            const { data: existingData, error: selectError } = await supabase
              .from('trueskill_sessions')
              .select('id')
              .eq('session_id', state.sessionId)
              .is('user_id', null)
              .maybeSingle();
            
            if (selectError) {
              console.log('🌐 [CLOUD_SYNC_DETAILED] Error checking for existing anonymous session:', selectError);
            }
            
            if (existingData) {
              const { error: updateError } = await supabase
                .from('trueskill_sessions')
                .update({
                  ratings_data: state.ratings as any,
                  last_updated: new Date().toISOString()
                })
                .eq('id', existingData.id);
              
              if (updateError) {
                console.log('🌐 [CLOUD_SYNC_DETAILED] Anonymous session update error (keeping local data):', updateError);
                return;
              }
            } else {
              const { error: insertError } = await supabase
                .from('trueskill_sessions')
                .insert([{
                  session_id: state.sessionId,
                  user_id: null,
                  ratings_data: state.ratings as any,
                  last_updated: new Date().toISOString()
                }]);
              
              if (insertError) {
                console.log('🌐 [CLOUD_SYNC_DETAILED] Anonymous session insert error (keeping local data):', insertError);
                return;
              }
            }
          }
          
          console.log('🌐 [CLOUD_SYNC_DETAILED] ✅ Successfully synced to cloud');
          set({ lastSyncedAt: new Date().toISOString() });
          
        } catch (error) {
          console.log('🌐 [CLOUD_SYNC_DETAILED] Unexpected sync error (keeping local data):', error);
        }
      },
      
      loadFromCloud: async () => {
        const state = get();
        const localRatingsCount = Object.keys(state.ratings).length;
        
        console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ===== CLOUD LOAD FUNCTION ENTRY =====`);
        console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Local ratings count: ${localRatingsCount}`);
        
        // Don't load from cloud immediately after a clear
        if (localRatingsCount === 0 && !state.lastSyncedAt) {
          console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ===== RECENTLY CLEARED - SKIPPING CLOUD LOAD =====`);
          set({ isLoading: false });
          return;
        }
        
        try {
          set({ isLoading: true });
          
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Auth check error (continuing):`, userError.message);
          }
          
          let data = null;
          let selectError = null;
          
          if (user?.id) {
            const result = await supabase
              .from('trueskill_sessions')
              .select('*')
              .eq('user_id', user.id)
              .is('session_id', null)
              .maybeSingle();
            
            data = result.data;
            selectError = result.error;
          } else {
            const result = await supabase
              .from('trueskill_sessions')
              .select('*')
              .eq('session_id', state.sessionId)
              .is('user_id', null)
              .maybeSingle();
            
            data = result.data;
            selectError = result.error;
          }
          
          if (selectError) {
            console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Query error (keeping local):`, selectError);
            set({ isLoading: false });
            return;
          }
          
          const currentState = get();
          const currentLocalCount = Object.keys(currentState.ratings).length;
          
          if (data?.ratings_data) {
            let cloudRatings: Record<number, TrueSkillRating> = {};
            
            console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ===== CLOUD DATA FOUND =====`);
            
            if (typeof data.ratings_data === 'object' && 
                !Array.isArray(data.ratings_data) && 
                data.ratings_data !== null) {
              try {
                cloudRatings = data.ratings_data as unknown as Record<number, TrueSkillRating>;
                const cloudRatingsCount = Object.keys(cloudRatings).length;
                
                console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Cloud ratings count: ${cloudRatingsCount}`);
                console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Current local count: ${currentLocalCount}`);
                
                if (cloudRatingsCount > currentLocalCount || currentLocalCount === 0) {
                  console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ✅ Loading ${cloudRatingsCount} ratings from cloud`);
                  
                  set({ 
                    ratings: cloudRatings,
                    lastSyncedAt: data.last_updated,
                    isLoading: false
                  });
                  
                  const postUpdateCount = Object.keys(get().ratings).length;
                  console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Post-update count: ${postUpdateCount}`);
                  
                  setTimeout(() => {
                    const loadEvent = new CustomEvent('trueskill-store-loaded', {
                      detail: { ratingsCount: cloudRatingsCount }
                    });
                    document.dispatchEvent(loadEvent);
                  }, 50);
                } else {
                  console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ✅ Local data is more recent`);
                  set({ isLoading: false });
                }
              } catch (castError) {
                console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Type casting error:`, castError);
                set({ isLoading: false });
              }
            } else {
              console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Invalid cloud data type`);
              set({ isLoading: false });
            }
          } else {
            console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] No cloud data found`);
            set({ isLoading: false });
          }
          
        } catch (error) {
          console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Unexpected error:`, error);
          set({ isLoading: false });
        }
        
        const finalState = get();
        const finalCount = Object.keys(finalState.ratings).length;
        console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ===== FUNCTION EXIT =====`);
        console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Final rating count: ${finalCount}`);
      }
    }),
    {
      name: 'trueskill-ratings-store',
      version: 1
    }
  )
);
