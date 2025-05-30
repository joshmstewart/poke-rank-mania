
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
  ratings: Record<number, TrueSkillRating>; // pokemonId -> rating
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
        return get().ratings;
      },
      
      clearAllRatings: () => {
        console.log(`[TRUESKILL_CLEAR] Clearing all ratings`);
        
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
      
      // FIXED: Robust cloud sync with proper error handling and defensive programming
      syncToCloud: async () => {
        const state = get();
        
        // Skip sync if no ratings to sync
        if (Object.keys(state.ratings).length === 0) {
          console.log('[TRUESKILL_CLOUD] No ratings to sync, skipping cloud sync');
          return;
        }
        
        try {
          console.log('[TRUESKILL_CLOUD] Starting cloud sync...', {
            ratingsCount: Object.keys(state.ratings).length,
            sessionId: state.sessionId.substring(0, 8) + '...'
          });
          
          // Get current user status
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.log('[TRUESKILL_CLOUD] Auth error during sync (keeping local data):', userError.message);
            return;
          }
          
          // Prepare sync data with explicit type casting
          const syncData = {
            session_id: user?.id ? null : state.sessionId, // Only set session_id for anonymous users
            user_id: user?.id || null, // Only set user_id for authenticated users
            ratings_data: state.ratings,
            last_updated: new Date().toISOString()
          };
          
          console.log('[TRUESKILL_CLOUD] Sync data prepared:', {
            hasUserId: !!syncData.user_id,
            hasSessionId: !!syncData.session_id,
            ratingsCount: Object.keys(state.ratings).length
          });
          
          // Use upsert to handle both insert and update cases
          const { error: upsertError } = await supabase
            .from('trueskill_sessions')
            .upsert([syncData], {
              onConflict: user?.id ? 'user_id' : 'session_id',
              ignoreDuplicates: false
            });
          
          if (upsertError) {
            console.log('[TRUESKILL_CLOUD] Upsert error (keeping local data):', {
              code: upsertError.code,
              message: upsertError.message,
              details: upsertError.details,
              hint: upsertError.hint
            });
            return;
          }
          
          console.log('[TRUESKILL_CLOUD] ✅ Successfully synced to cloud');
          set({ lastSyncedAt: new Date().toISOString() });
          
        } catch (error) {
          console.log('[TRUESKILL_CLOUD] Unexpected sync error (keeping local data):', error);
          // Never clear local data on any error
        }
      },
      
      // FIXED: Robust cloud loading with proper error handling
      loadFromCloud: async () => {
        const state = get();
        const localRatingsCount = Object.keys(state.ratings).length;
        
        try {
          set({ isLoading: true });
          
          console.log('[TRUESKILL_CLOUD] Loading from cloud...', {
            localRatingsCount,
            sessionId: state.sessionId.substring(0, 8) + '...'
          });
          
          // Get current user status
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.log('[TRUESKILL_CLOUD] Auth error during load (keeping local data):', userError.message);
            set({ isLoading: false });
            return;
          }
          
          // Build query based on authentication status
          let query = supabase.from('trueskill_sessions').select('*');
          
          if (user?.id) {
            // Authenticated user - look for their user_id
            query = query.eq('user_id', user.id);
            console.log('[TRUESKILL_CLOUD] Querying for authenticated user:', user.id);
          } else {
            // Anonymous user - look for their session_id
            query = query.eq('session_id', state.sessionId).is('user_id', null);
            console.log('[TRUESKILL_CLOUD] Querying for anonymous session:', state.sessionId.substring(0, 8) + '...');
          }
          
          const { data, error: selectError } = await query.maybeSingle();
          
          if (selectError) {
            console.log('[TRUESKILL_CLOUD] Select error (keeping local data):', {
              code: selectError.code,
              message: selectError.message,
              details: selectError.details,
              hint: selectError.hint
            });
            set({ isLoading: false });
            return;
          }
          
          if (data?.ratings_data && typeof data.ratings_data === 'object') {
            // Safely cast the cloud data
            const cloudRatings = data.ratings_data as Record<number, TrueSkillRating>;
            const cloudRatingsCount = Object.keys(cloudRatings).length;
            
            console.log('[TRUESKILL_CLOUD] Cloud data found:', {
              cloudRatingsCount,
              localRatingsCount,
              lastUpdated: data.last_updated
            });
            
            // Only update if cloud has more data than local, or if local is empty
            if (cloudRatingsCount > localRatingsCount || localRatingsCount === 0) {
              console.log(`[TRUESKILL_CLOUD] ✅ Loading ${cloudRatingsCount} ratings from cloud`);
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
              console.log('[TRUESKILL_CLOUD] Local data is more recent, keeping local ratings');
              set({ isLoading: false });
            }
          } else {
            console.log('[TRUESKILL_CLOUD] No cloud data found, keeping local data');
            set({ isLoading: false });
          }
          
        } catch (error) {
          console.log('[TRUESKILL_CLOUD] Unexpected load error, keeping local data:', error);
          set({ isLoading: false });
          // Never clear local data on any error
        }
      }
    }),
    {
      name: 'trueskill-ratings-store',
      version: 1
    }
  )
);
