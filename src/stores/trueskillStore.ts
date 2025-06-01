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
        console.log(`🔍 [TRUESKILL_STORE_DEBUG_ENHANCED] ===== ENHANCED STORE DEBUG =====`);
        console.log(`🔍 [TRUESKILL_STORE_DEBUG_ENHANCED] Store ratings count: ${Object.keys(state.ratings).length}`);
        console.log(`🔍 [TRUESKILL_STORE_DEBUG_ENHANCED] Session ID: ${state.sessionId.substring(0, 8)}...`);
        console.log(`🔍 [TRUESKILL_STORE_DEBUG_ENHANCED] Last synced: ${state.lastSyncedAt}`);
        
        // CRITICAL: More detailed localStorage inspection
        const localStorageData = localStorage.getItem('trueskill-ratings-store');
        if (localStorageData) {
          try {
            const parsed = JSON.parse(localStorageData);
            const persistedRatings = parsed.state?.ratings || {};
            const persistedIds = Object.keys(persistedRatings);
            
            console.log(`🔍 [TRUESKILL_STORE_DEBUG_ENHANCED] localStorage ratings count: ${persistedIds.length}`);
            console.log(`🔍 [TRUESKILL_STORE_DEBUG_ENHANCED] localStorage rating IDs: ${persistedIds.slice(0, 20).join(', ')}${persistedIds.length > 20 ? '...' : ''}`);
            console.log(`🔍 [TRUESKILL_STORE_DEBUG_ENHANCED] localStorage data structure:`, {
              hasState: !!parsed.state,
              hasRatings: !!parsed.state?.ratings,
              ratingsType: typeof parsed.state?.ratings,
              stateKeys: Object.keys(parsed.state || {}),
              version: parsed.version
            });
            
            // CRITICAL: Sample some ratings to verify structure
            if (persistedIds.length > 0) {
              const sampleId = persistedIds[0];
              const sampleRating = persistedRatings[sampleId];
              console.log(`🔍 [TRUESKILL_STORE_DEBUG_ENHANCED] Sample rating (ID ${sampleId}):`, sampleRating);
            }
            
            if (persistedIds.length !== Object.keys(state.ratings).length) {
              console.error(`🔍 [TRUESKILL_STORE_DEBUG_ENHANCED] ❌ MISMATCH: Store has ${Object.keys(state.ratings).length}, localStorage has ${persistedIds.length}`);
              
              // CRITICAL: If localStorage has more data, force reload
              if (persistedIds.length > Object.keys(state.ratings).length) {
                console.log(`🔍 [TRUESKILL_STORE_DEBUG_ENHANCED] 🔄 localStorage has more data - forcing store reload`);
                set({ ratings: persistedRatings });
                return;
              }
            }
          } catch (e) {
            console.error(`🔍 [TRUESKILL_STORE_DEBUG_ENHANCED] ❌ Failed to parse localStorage data:`, e);
          }
        } else {
          console.log(`🔍 [TRUESKILL_STORE_DEBUG_ENHANCED] ⚠️ No localStorage data found`);
        }
        
        // CRITICAL: Check if there are any other TrueSkill-related localStorage keys
        console.log(`🔍 [TRUESKILL_STORE_DEBUG_ENHANCED] All localStorage keys:`, Object.keys(localStorage).filter(key => key.includes('trueskill') || key.includes('rating') || key.includes('battle')));
        
        console.log(`🔍 [TRUESKILL_STORE_DEBUG_ENHANCED] ===== END ENHANCED DEBUG =====`);
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
        console.log(`[TRUESKILL_STORE_DEBUG_ENHANCED] getAllRatings called - returning ${Object.keys(ratings).length} ratings`);
        
        // CRITICAL FIX: Enhanced localStorage consistency check with recovery
        const localStorageData = localStorage.getItem('trueskill-ratings-store');
        if (localStorageData) {
          try {
            const parsed = JSON.parse(localStorageData);
            const persistedRatings = parsed.state?.ratings || {};
            const persistedCount = Object.keys(persistedRatings).length;
            
            console.log(`[TRUESKILL_STORE_DEBUG_ENHANCED] Store: ${Object.keys(ratings).length}, localStorage: ${persistedCount}`);
            
            // CRITICAL: If there's a significant discrepancy, investigate and potentially recover
            if (persistedCount !== Object.keys(ratings).length) {
              console.error(`[TRUESKILL_STORE_DEBUG_ENHANCED] ❌ CRITICAL: Store/localStorage mismatch! Store: ${Object.keys(ratings).length}, localStorage: ${persistedCount}`);
              
              // If localStorage has significantly more data, it might be the correct source
              if (persistedCount > Object.keys(ratings).length && persistedCount > 10) {
                console.log(`[TRUESKILL_STORE_DEBUG_ENHANCED] 🔄 localStorage has much more data (${persistedCount} vs ${Object.keys(ratings).length}) - attempting recovery`);
                
                // Validate the localStorage data structure before using it
                let isValidData = true;
                const sampleIds = Object.keys(persistedRatings).slice(0, 5);
                for (const id of sampleIds) {
                  const rating = persistedRatings[id];
                  if (!rating || typeof rating.mu !== 'number' || typeof rating.sigma !== 'number') {
                    isValidData = false;
                    console.error(`[TRUESKILL_STORE_DEBUG_ENHANCED] ❌ Invalid rating structure for ID ${id}:`, rating);
                    break;
                  }
                }
                
                if (isValidData) {
                  console.log(`[TRUESKILL_STORE_DEBUG_ENHANCED] ✅ localStorage data appears valid - recovering store`);
                  set({ ratings: persistedRatings });
                  return persistedRatings;
                } else {
                  console.error(`[TRUESKILL_STORE_DEBUG_ENHANCED] ❌ localStorage data is corrupted - keeping current store`);
                }
              }
            }
          } catch (e) {
            console.error(`[TRUESKILL_STORE_DEBUG_ENHANCED] ❌ Failed to parse localStorage for consistency check:`, e);
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
