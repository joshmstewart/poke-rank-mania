
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
          
          // Trigger cloud sync after state update
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
        
        // Sync clear to cloud
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
      
      // Cloud sync that works for both authenticated and session-based users
      syncToCloud: async () => {
        try {
          const state = get();
          const { user } = await supabase.auth.getUser();
          
          console.log('[TRUESKILL_CLOUD] Starting cloud sync...');
          
          // Prepare sync data
          const syncData = {
            session_id: state.sessionId,
            user_id: user?.id || null,
            ratings_data: state.ratings,
            last_updated: new Date().toISOString()
          };
          
          // Use upsert to handle both insert and update cases
          const { error } = await supabase
            .from('trueskill_sessions')
            .upsert(syncData, {
              onConflict: user?.id ? 'user_id' : 'session_id'
            });
          
          if (error) {
            console.log('[TRUESKILL_CLOUD] Sync error (will retry later):', error.message);
            return;
          }
          
          console.log('[TRUESKILL_CLOUD] Successfully synced to cloud');
          set({ lastSyncedAt: new Date().toISOString() });
          
        } catch (error) {
          console.log('[TRUESKILL_CLOUD] Sync failed (will retry later):', error);
        }
      },
      
      // Cloud loading that works for both authenticated and session-based users
      loadFromCloud: async () => {
        try {
          set({ isLoading: true });
          const state = get();
          const { user } = await supabase.auth.getUser();
          
          console.log('[TRUESKILL_CLOUD] Loading from cloud...');
          
          let query = supabase.from('trueskill_sessions').select('*');
          
          // If user is authenticated, prioritize user_id, otherwise use session_id
          if (user?.id) {
            query = query.eq('user_id', user.id);
          } else {
            query = query.eq('session_id', state.sessionId);
          }
          
          const { data, error } = await query.single();
          
          if (error) {
            if (error.code !== 'PGRST116') { // Not found is OK
              console.log('[TRUESKILL_CLOUD] Load error:', error.message);
            }
            set({ isLoading: false });
            return;
          }
          
          if (data?.ratings_data) {
            console.log(`[TRUESKILL_CLOUD] Loaded ${Object.keys(data.ratings_data).length} ratings from cloud`);
            set({ 
              ratings: data.ratings_data,
              lastSyncedAt: data.last_updated,
              isLoading: false
            });
            
            // Dispatch load event
            setTimeout(() => {
              const loadEvent = new CustomEvent('trueskill-store-loaded', {
                detail: { ratingsCount: Object.keys(data.ratings_data).length }
              });
              document.dispatchEvent(loadEvent);
            }, 50);
          } else {
            set({ isLoading: false });
          }
          
        } catch (error) {
          console.log('[TRUESKILL_CLOUD] Load failed, using local storage:', error);
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
