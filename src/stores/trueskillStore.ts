
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
      
      // DEFENSIVE Cloud sync - never clear local data on cloud failures
      syncToCloud: async () => {
        const state = get();
        
        // Skip sync if no ratings to sync
        if (Object.keys(state.ratings).length === 0) {
          console.log('[TRUESKILL_CLOUD] No ratings to sync, skipping cloud sync');
          return;
        }
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          console.log('[TRUESKILL_CLOUD] Starting cloud sync...', {
            ratingsCount: Object.keys(state.ratings).length,
            isAuthenticated: !!user
          });
          
          // Check if table exists by doing a simple count query first
          const { error: tableError } = await supabase
            .from('trueskill_sessions')
            .select('id', { count: 'exact', head: true });
          
          if (tableError) {
            console.log('[TRUESKILL_CLOUD] Table access error (keeping local data):', tableError.message);
            if (tableError.message.includes('relation "public.trueskill_sessions" does not exist')) {
              console.log('[TRUESKILL_CLOUD] trueskill_sessions table does not exist in database');
            }
            return; // Don't clear local data on table errors
          }
          
          // Prepare sync data with proper type casting
          const syncData = {
            session_id: state.sessionId,
            user_id: user?.id || null,
            ratings_data: state.ratings as any, // Cast to any for JSONB compatibility
            last_updated: new Date().toISOString()
          };
          
          // Use upsert with array input and handle both insert and update cases
          const { error } = await supabase
            .from('trueskill_sessions')
            .upsert([syncData], {
              onConflict: user?.id ? 'user_id' : 'session_id'
            });
          
          if (error) {
            console.log('[TRUESKILL_CLOUD] Sync error (keeping local data):', error.message);
            return; // Don't clear local data on sync errors
          }
          
          console.log('[TRUESKILL_CLOUD] Successfully synced to cloud');
          set({ lastSyncedAt: new Date().toISOString() });
          
        } catch (error) {
          console.log('[TRUESKILL_CLOUD] Sync failed (keeping local data):', error);
          // Never clear local data on cloud failures
        }
      },
      
      // DEFENSIVE Cloud loading - preserve local data if cloud load fails
      loadFromCloud: async () => {
        const state = get();
        const localRatingsCount = Object.keys(state.ratings).length;
        
        try {
          set({ isLoading: true });
          const { data: { user } } = await supabase.auth.getUser();
          
          console.log('[TRUESKILL_CLOUD] Loading from cloud...', {
            localRatingsCount,
            isAuthenticated: !!user
          });
          
          // Check if table exists first
          const { error: tableError } = await supabase
            .from('trueskill_sessions')
            .select('id', { count: 'exact', head: true });
          
          if (tableError) {
            console.log('[TRUESKILL_CLOUD] Table access error during load (keeping local data):', tableError.message);
            set({ isLoading: false });
            return;
          }
          
          let query = supabase.from('trueskill_sessions').select('*');
          
          // If user is authenticated, prioritize user_id, otherwise use session_id
          if (user?.id) {
            query = query.eq('user_id', user.id);
          } else {
            query = query.eq('session_id', state.sessionId);
          }
          
          const { data, error } = await query.maybeSingle();
          
          if (error) {
            console.log('[TRUESKILL_CLOUD] Load error (keeping local data):', error.message);
            set({ isLoading: false });
            return;
          }
          
          if (data?.ratings_data) {
            // Safe type casting from Json to our Record type
            const loadedRatings = data.ratings_data as unknown as Record<number, TrueSkillRating>;
            const cloudRatingsCount = Object.keys(loadedRatings).length;
            
            console.log('[TRUESKILL_CLOUD] Cloud data found:', {
              cloudRatingsCount,
              localRatingsCount,
              willMerge: cloudRatingsCount > localRatingsCount
            });
            
            // Only update if cloud has more data than local, or if local is empty
            if (cloudRatingsCount > localRatingsCount || localRatingsCount === 0) {
              console.log(`[TRUESKILL_CLOUD] Loading ${cloudRatingsCount} ratings from cloud`);
              set({ 
                ratings: loadedRatings,
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
          console.log('[TRUESKILL_CLOUD] Load failed, keeping local data:', error);
          set({ isLoading: false });
          // Never clear local data on cloud failures
        }
      }
    }),
    {
      name: 'trueskill-ratings-store',
      version: 1
    }
  )
);
