
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
        
        // Sync clear to cloud and trigger events
        setTimeout(() => {
          get().syncToCloud();
          
          const clearEvent = new CustomEvent('trueskill-store-cleared');
          document.dispatchEvent(clearEvent);
          
          const syncEvent = new CustomEvent('trueskill-updated', {
            detail: { 
              source: 'store-cleared',
              timestamp: Date.now()
            }
          });
          document.dispatchEvent(syncEvent);
        }, 100);
      },
      
      // FIXED: Proper anonymous session handling for cloud sync
      syncToCloud: async () => {
        const state = get();
        
        // Skip sync if no ratings to sync
        if (Object.keys(state.ratings).length === 0) {
          console.log('[TRUESKILL_CLOUD_FIXED] No ratings to sync, skipping cloud sync');
          return;
        }
        
        try {
          console.log('[TRUESKILL_CLOUD_FIXED] Starting cloud sync...', {
            ratingsCount: Object.keys(state.ratings).length,
            sessionId: state.sessionId.substring(0, 8) + '...'
          });
          
          // Check current user status
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.log('[TRUESKILL_CLOUD_FIXED] Auth check error (continuing with anonymous):', userError.message);
          }
          
          if (user?.id) {
            // Authenticated user - use user_id
            console.log('[TRUESKILL_CLOUD_FIXED] Syncing for authenticated user:', user.id);
            
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
              console.log('[TRUESKILL_CLOUD_FIXED] Authenticated user upsert error (keeping local data):', upsertError);
              return;
            }
          } else {
            // FIXED: Anonymous user - use direct upsert without auth dependency
            console.log('[TRUESKILL_CLOUD_FIXED] Syncing for anonymous session:', state.sessionId.substring(0, 8) + '...');
            
            // For anonymous users, we need to handle the upsert differently
            // First try to find existing record
            const { data: existingData, error: selectError } = await supabase
              .from('trueskill_sessions')
              .select('id')
              .eq('session_id', state.sessionId)
              .is('user_id', null)
              .maybeSingle();
            
            if (selectError) {
              console.log('[TRUESKILL_CLOUD_FIXED] Error checking for existing anonymous session:', selectError);
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
                console.log('[TRUESKILL_CLOUD_FIXED] Anonymous session update error (keeping local data):', updateError);
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
                console.log('[TRUESKILL_CLOUD_FIXED] Anonymous session insert error (keeping local data):', insertError);
                return;
              }
            }
          }
          
          console.log('[TRUESKILL_CLOUD_FIXED] ✅ Successfully synced to cloud');
          set({ lastSyncedAt: new Date().toISOString() });
          
        } catch (error) {
          console.log('[TRUESKILL_CLOUD_FIXED] Unexpected sync error (keeping local data):', error);
        }
      },
      
      // FIXED: Proper anonymous session loading
      loadFromCloud: async () => {
        const state = get();
        const localRatingsCount = Object.keys(state.ratings).length;
        
        try {
          set({ isLoading: true });
          
          console.log('[TRUESKILL_CLOUD_FIXED] Loading from cloud...', {
            localRatingsCount,
            sessionId: state.sessionId.substring(0, 8) + '...'
          });
          
          // Check current user status
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.log('[TRUESKILL_CLOUD_FIXED] Auth check error during load (continuing with anonymous):', userError.message);
          }
          
          let data = null;
          let selectError = null;
          
          if (user?.id) {
            // Authenticated user - query by user_id
            console.log('[TRUESKILL_CLOUD_FIXED] Loading for authenticated user:', user.id);
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
            console.log('[TRUESKILL_CLOUD_FIXED] Loading for anonymous session:', state.sessionId.substring(0, 8) + '...');
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
            console.log('[TRUESKILL_CLOUD_FIXED] Select error (keeping local data):', selectError);
            set({ isLoading: false });
            return;
          }
          
          // FIXED: Robust type guard for ratings_data
          if (data?.ratings_data) {
            let cloudRatings: Record<number, TrueSkillRating> = {};
            
            // Type guard to ensure we have a valid object and not an array
            if (typeof data.ratings_data === 'object' && 
                !Array.isArray(data.ratings_data) && 
                data.ratings_data !== null) {
              try {
                cloudRatings = data.ratings_data as unknown as Record<number, TrueSkillRating>;
              } catch (castError) {
                console.log('[TRUESKILL_CLOUD_FIXED] Type casting error, using empty ratings:', castError);
                cloudRatings = {};
              }
            } else if (Array.isArray(data.ratings_data) && data.ratings_data.length === 0) {
              console.log('[TRUESKILL_CLOUD_FIXED] Empty array received, initializing as empty object');
              cloudRatings = {};
            } else if (data.ratings_data === null) {
              console.log('[TRUESKILL_CLOUD_FIXED] Null ratings_data received, initializing as empty object');
              cloudRatings = {};
            } else {
              console.log('[TRUESKILL_CLOUD_FIXED] Unexpected ratings_data type:', typeof data.ratings_data, 'using empty ratings');
              cloudRatings = {};
            }
            
            const cloudRatingsCount = Object.keys(cloudRatings).length;
            
            console.log('[TRUESKILL_CLOUD_FIXED] Cloud data found:', {
              cloudRatingsCount,
              localRatingsCount,
              lastUpdated: data.last_updated
            });
            
            // Only update if cloud has more data than local, or if local is empty
            if (cloudRatingsCount > localRatingsCount || localRatingsCount === 0) {
              console.log(`[TRUESKILL_CLOUD_FIXED] ✅ Loading ${cloudRatingsCount} ratings from cloud`);
              set({ 
                ratings: cloudRatings,
                lastSyncedAt: data.last_updated,
                isLoading: false
              });
              
              // Dispatch load event
              setTimeout(() => {
                const loadEvent = new CustomEvent('trueskill-store-loaded', {
                  detail: { ratingsCount: cloudRatingsCount }
                });
                document.dispatchEvent(loadEvent);
              }, 50);
            } else {
              console.log('[TRUESKILL_CLOUD_FIXED] Local data is more recent, keeping local ratings');
              set({ isLoading: false });
            }
          } else {
            console.log('[TRUESKILL_CLOUD_FIXED] No cloud data found, keeping local data');
            set({ isLoading: false });
          }
          
        } catch (error) {
          console.log('[TRUESKILL_CLOUD_FIXED] Unexpected load error, keeping local data:', error);
          set({ isLoading: false });
        }
      }
    }),
    {
      name: 'trueskill-ratings-store',
      version: 1
    }
  )
);
