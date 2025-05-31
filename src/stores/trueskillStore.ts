
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
  syncToCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
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
        const ratings = get().ratings;
        console.log(`[TRUESKILL_STORE_DEBUG] getAllRatings called - returning ${Object.keys(ratings).length} ratings`);
        return ratings;
      },
      
      clearAllRatings: () => {
        console.log(`[TRUESKILL_CLEAR] ===== CLEARING ALL RATINGS =====`);
        console.log(`[TRUESKILL_CLEAR] Call stack:`, new Error().stack);
        console.log(`[TRUESKILL_CLEAR] Current ratings count before clear:`, Object.keys(get().ratings).length);
        
        set({ ratings: {}, lastSyncedAt: null });
        
        // CRITICAL FIX: Clear cloud data immediately and don't restore from cloud
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
          
          console.log(`[TRUESKILL_CLEAR] ===== CLEAR COMPLETE - NO CLOUD RELOAD =====`);
        }, 100);
      },
      
      // NEW: Function to clear cloud data
      clearCloudData: async () => {
        const state = get();
        
        console.log(`🌐 [CLOUD_CLEAR] ===== CLEARING CLOUD DATA =====`);
        console.log(`🌐 [CLOUD_CLEAR] Session ID: ${state.sessionId.substring(0, 8)}...`);
        
        try {
          // Check current user status
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.log(`🌐 [CLOUD_CLEAR] Auth check error:`, userError.message);
          }
          
          if (user?.id) {
            // Authenticated user - clear user_id data
            console.log(`🌐 [CLOUD_CLEAR] Clearing for authenticated user:`, user.id);
            
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
            // Anonymous user - clear session_id data
            console.log(`🌐 [CLOUD_CLEAR] Clearing for anonymous session:`, state.sessionId.substring(0, 8) + '...');
            
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
      
      // ENHANCED: Detailed cloud sync logging
      syncToCloud: async () => {
        const state = get();
        
        console.log(`🌐 [CLOUD_SYNC_DETAILED] ===== STARTING CLOUD SYNC =====`);
        console.log(`🌐 [CLOUD_SYNC_DETAILED] Local ratings count before sync: ${Object.keys(state.ratings).length}`);
        console.log(`🌐 [CLOUD_SYNC_DETAILED] Session ID: ${state.sessionId.substring(0, 8)}...`);
        
        // Skip sync if no ratings to sync
        if (Object.keys(state.ratings).length === 0) {
          console.log('🌐 [CLOUD_SYNC_DETAILED] No ratings to sync, skipping cloud sync');
          return;
        }
        
        try {
          console.log('🌐 [CLOUD_SYNC_DETAILED] Starting cloud sync...', {
            ratingsCount: Object.keys(state.ratings).length,
            sessionId: state.sessionId.substring(0, 8) + '...'
          });
          
          // Check current user status
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.log('🌐 [CLOUD_SYNC_DETAILED] Auth check error (continuing with anonymous):', userError.message);
          }
          
          if (user?.id) {
            // Authenticated user - use user_id
            console.log('🌐 [CLOUD_SYNC_DETAILED] Syncing for authenticated user:', user.id);
            
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
            // Anonymous user - use direct upsert without auth dependency
            console.log('🌐 [CLOUD_SYNC_DETAILED] Syncing for anonymous session:', state.sessionId.substring(0, 8) + '...');
            
            // For anonymous users, we need to handle the upsert differently
            // First try to find existing record
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
              // Update existing record
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
              // Insert new record
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
      
      // ENHANCED: Modified to not auto-load after a clear operation
      loadFromCloud: async () => {
        const state = get();
        const localRatingsCount = Object.keys(state.ratings).length;
        
        console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ===== CLOUD LOAD FUNCTION ENTRY =====`);
        console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Function called from:`, new Error().stack?.split('\n')[2]?.trim());
        console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] LOCAL STORE STATE AT ENTRY:`);
        console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Local ratings count: ${localRatingsCount}`);
        console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Local rating IDs: ${Object.keys(state.ratings).slice(0, 15).join(', ')}${Object.keys(state.ratings).length > 15 ? '...' : ''}`);
        console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Session ID: ${state.sessionId.substring(0, 8)}...`);
        
        // CRITICAL FIX: Don't load from cloud immediately after a clear
        if (localRatingsCount === 0 && !state.lastSyncedAt) {
          console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ===== RECENTLY CLEARED - SKIPPING CLOUD LOAD =====`);
          console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Local is empty and no lastSyncedAt - assuming recent clear`);
          set({ isLoading: false });
          return;
        }
        
        try {
          set({ isLoading: true });
          
          console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Starting cloud query...`);
          
          // Check current user status
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Auth check error (continuing):`, userError.message);
          }
          
          let data = null;
          let selectError = null;
          
          if (user?.id) {
            // Authenticated user - query by user_id
            console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Querying for authenticated user:`, user.id);
            const result = await supabase
              .from('trueskill_sessions')
              .select('*')
              .eq('user_id', user.id)
              .is('session_id', null)
              .maybeSingle();
            
            data = result.data;
            selectError = result.error;
          } else {
            // Anonymous user - query by session_id
            console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Querying for anonymous session:`, state.sessionId.substring(0, 8) + '...');
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
          
          // CRITICAL: Check local state again before any merge decisions
          const currentState = get();
          const currentLocalCount = Object.keys(currentState.ratings).length;
          console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ===== PRE-MERGE STATE CHECK =====`);
          console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Local count at merge decision point: ${currentLocalCount}`);
          console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Original local count at function entry: ${localRatingsCount}`);
          
          if (currentLocalCount !== localRatingsCount) {
            console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ❌ LOCAL COUNT CHANGED DURING CLOUD QUERY!`);
            console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Entry: ${localRatingsCount}, Current: ${currentLocalCount}`);
          }
          
          if (data?.ratings_data) {
            let cloudRatings: Record<number, TrueSkillRating> = {};
            
            console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ===== CLOUD DATA FOUND =====`);
            console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Raw cloud data type: ${typeof data.ratings_data}`);
            console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Is array: ${Array.isArray(data.ratings_data)}`);
            console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Last updated: ${data.last_updated}`);
            
            // Type guard to ensure we have a valid object and not an array
            if (typeof data.ratings_data === 'object' && 
                !Array.isArray(data.ratings_data) && 
                data.ratings_data !== null) {
              try {
                cloudRatings = data.ratings_data as unknown as Record<number, TrueSkillRating>;
                
                const cloudRatingsCount = Object.keys(cloudRatings).length;
                const cloudIds = Object.keys(cloudRatings).slice(0, 15);
                
                console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ===== CLOUD DATA PROCESSED =====`);
                console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Cloud ratings count: ${cloudRatingsCount}`);
                console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Cloud rating IDs: ${cloudIds.join(', ')}${cloudRatingsCount > 15 ? '...' : ''}`);
                console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Comparison: Local ${currentLocalCount} vs Cloud ${cloudRatingsCount}`);
                
              } catch (castError) {
                console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Type casting error:`, castError);
                cloudRatings = {};
              }
            } else {
              console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Invalid cloud data type, using empty`);
              cloudRatings = {};
            }
            
            const cloudRatingsCount = Object.keys(cloudRatings).length;
            
            console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ===== MERGE DECISION LOGIC =====`);
            console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Cloud count: ${cloudRatingsCount}`);
            console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Current local count: ${currentLocalCount}`);
            console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Cloud has more data: ${cloudRatingsCount > currentLocalCount}`);
            console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Local is empty: ${currentLocalCount === 0}`);
            
            // Only update if cloud has more data than local, or if local is empty
            if (cloudRatingsCount > currentLocalCount || currentLocalCount === 0) {
              console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ✅ DECISION: Loading ${cloudRatingsCount} ratings from cloud`);
              console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Will replace ${currentLocalCount} local ratings`);
              
              // Critical state verification before update
              const preUpdateState = get();
              const preUpdateCount = Object.keys(preUpdateState.ratings).length;
              console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Pre-update verification: ${preUpdateCount} ratings`);
              
              set({ 
                ratings: cloudRatings,
                lastSyncedAt: data.last_updated,
                isLoading: false
              });
              
              // Verify the update happened correctly
              const postUpdateState = get();
              const postUpdateCount = Object.keys(postUpdateState.ratings).length;
              
              console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ===== MERGE COMPLETED =====`);
              console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Expected count: ${cloudRatingsCount}`);
              console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Actual count after merge: ${postUpdateCount}`);
              
              if (postUpdateCount !== cloudRatingsCount) {
                console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ❌ MERGE FAILED! Expected ${cloudRatingsCount}, got ${postUpdateCount}`);
              }
              
              // Dispatch load event
              setTimeout(() => {
                const loadEvent = new CustomEvent('trueskill-store-loaded', {
                  detail: { ratingsCount: cloudRatingsCount }
                });
                document.dispatchEvent(loadEvent);
              }, 50);
            } else {
              console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ✅ DECISION: Local data is more recent or equal`);
              console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Keeping ${currentLocalCount} local ratings (cloud had ${cloudRatingsCount})`);
              set({ isLoading: false });
            }
          } else {
            console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] No cloud data found, keeping local data`);
            set({ isLoading: false });
          }
          
        } catch (error) {
          console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Unexpected error:`, error);
          set({ isLoading: false });
        }
        
        // Final verification
        const finalState = get();
        const finalCount = Object.keys(finalState.ratings).length;
        console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ===== FUNCTION EXIT =====`);
        console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Final rating count: ${finalCount}`);
        console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Original entry count: ${localRatingsCount}`);
        
        if (finalCount !== localRatingsCount) {
          console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ❌ COUNT CHANGED FROM ENTRY TO EXIT!`);
          console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Entry: ${localRatingsCount} → Exit: ${finalCount}`);
        }
      }
    }),
    {
      name: 'trueskill-ratings-store',
      version: 1
    }
  )
);
