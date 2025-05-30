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
          
          // CRITICAL FIX: Dispatch multiple events for better synchronization
          setTimeout(() => {
            // Event for Manual mode synchronization
            const updateEvent = new CustomEvent('trueskill-store-updated', {
              detail: { pokemonId, rating: newRatings[pokemonId] }
            });
            document.dispatchEvent(updateEvent);
            
            // Event for general TrueSkill updates (backwards compatibility)
            const syncEvent = new CustomEvent('trueskill-updated', {
              detail: { 
                source: 'store-update',
                pokemonId,
                timestamp: Date.now()
              }
            });
            document.dispatchEvent(syncEvent);
            
            console.log(`[TRUESKILL_SYNC_EVENTS] Dispatched update events for Pokemon ${pokemonId}`);
          }, 10);
          
          // Sync to cloud using session ID (non-blocking)
          setTimeout(async () => {
            try {
              await get().syncToCloud();
            } catch (error) {
              console.log('[TRUESKILL_CLOUD] Cloud sync failed, continuing with local storage');
            }
          }, 1000);
          
          return { ratings: newRatings };
        });
        
        const updatedRating = get().ratings[pokemonId];
        console.log(`[TRUESKILL_LOCAL] Updated Pokemon ${pokemonId} - μ=${updatedRating.mu.toFixed(2)}, σ=${updatedRating.sigma.toFixed(2)}, battles=${updatedRating.battleCount}`);
      },
      
      getRating: (pokemonId: number) => {
        const state = get();
        console.log(`🔍 [TRUESKILL_GET_RATING] Getting rating for Pokemon ${pokemonId} - store has ${Object.keys(state.ratings).length} total ratings`);
        const storedRating = state.ratings[pokemonId];
        if (storedRating) {
          console.log(`✅ [TRUESKILL_GET_RATING] Found rating for Pokemon ${pokemonId}: μ=${storedRating.mu.toFixed(2)}, σ=${storedRating.sigma.toFixed(2)}`);
          return new Rating(storedRating.mu, storedRating.sigma);
        }
        console.log(`❌ [TRUESKILL_GET_RATING] No rating found for Pokemon ${pokemonId}`);
        return new Rating();
      },
      
      hasRating: (pokemonId: number) => {
        const hasIt = pokemonId in get().ratings;
        console.log(`🔍 [TRUESKILL_HAS_RATING] Pokemon ${pokemonId} has rating: ${hasIt}`);
        return hasIt;
      },
      
      getAllRatings: () => {
        const ratings = get().ratings;
        console.log(`🔍 [TRUESKILL_GET_ALL] Returning ${Object.keys(ratings).length} ratings`);
        return ratings;
      },
      
      clearAllRatings: () => {
        // ENHANCED CRITICAL DEBUG: Detailed investigation of who is calling clearAllRatings
        console.error(`🚨🚨🚨🚨🚨 [TRUESKILL_CLEAR_CRITICAL] ===== clearAllRatings() CALLED! =====`);
        console.error(`🚨 [TRUESKILL_CLEAR_CRITICAL] Timestamp: ${new Date().toISOString()}`);
        
        // Get the full call stack
        const stack = new Error().stack;
        console.error(`🚨 [TRUESKILL_CLEAR_CRITICAL] FULL CALL STACK:`);
        console.error(stack);
        
        // Parse stack to identify the immediate caller
        const stackLines = stack?.split('\n') || [];
        if (stackLines.length > 1) {
          console.error(`🚨 [TRUESKILL_CLEAR_CRITICAL] IMMEDIATE CALLER: ${stackLines[1]}`);
          if (stackLines.length > 2) {
            console.error(`🚨 [TRUESKILL_CLEAR_CRITICAL] CALLER'S CALLER: ${stackLines[2]}`);
          }
          if (stackLines.length > 3) {
            console.error(`🚨 [TRUESKILL_CLEAR_CRITICAL] THIRD LEVEL CALLER: ${stackLines[3]}`);
          }
        }
        
        const currentRatings = get().ratings;
        const ratingsCount = Object.keys(currentRatings).length;
        console.error(`🚨 [TRUESKILL_CLEAR_CRITICAL] About to clear ${ratingsCount} ratings`);
        
        // Log some sample ratings that are about to be lost
        if (ratingsCount > 0) {
          const sampleIds = Object.keys(currentRatings).slice(0, 5);
          console.error(`🚨 [TRUESKILL_CLEAR_CRITICAL] Sample ratings being lost:`, sampleIds.map(id => ({
            id,
            rating: currentRatings[parseInt(id)]
          })));
        }
        
        set({ ratings: {}, lastSyncedAt: null });
        
        console.error(`🚨 [TRUESKILL_CLEAR_CRITICAL] ✅ Ratings cleared. Store now has ${Object.keys(get().ratings).length} ratings`);
        
        // CRITICAL FIX: Dispatch clear events for synchronization
        setTimeout(() => {
          const clearEvent = new CustomEvent('trueskill-store-cleared');
          document.dispatchEvent(clearEvent);
          
          const syncEvent = new CustomEvent('trueskill-updated', {
            detail: { 
              source: 'store-cleared',
              timestamp: Date.now()
            }
          });
          document.dispatchEvent(syncEvent);
          
          console.log(`[TRUESKILL_SYNC_EVENTS] Dispatched clear events`);
        }, 10);
        
        // Sync cleared state to cloud using session ID (non-blocking)
        setTimeout(async () => {
          try {
            await get().syncToCloud();
          } catch (error) {
            console.log('[TRUESKILL_CLOUD] Cloud sync failed, continuing with local storage');
          }
        }, 100);
      },
      
      syncToCloud: async () => {
        try {
          const state = get();
          console.log('[TRUESKILL_CLOUD] Syncing ratings to cloud using session ID...', Object.keys(state.ratings).length, 'Pokemon');
          
          // Convert ratings to JSON-compatible format
          const ratingsAsJson = JSON.parse(JSON.stringify(state.ratings));
          
          // Use session ID as user_id and a special generation (-1) to indicate session-based storage
          const { error } = await supabase
            .from('user_rankings')
            .upsert({
              user_id: state.sessionId, // Use session ID instead of authenticated user ID
              generation: -1, // Special generation to indicate session-based storage
              pokemon_rankings: [],
              battle_results: ratingsAsJson,
              completion_percentage: 0,
              battles_completed: Object.values(state.ratings).reduce((sum, rating) => sum + rating.battleCount, 0),
              updated_at: new Date().toISOString()
            });
          
          if (error) {
            console.error('[TRUESKILL_CLOUD] Error syncing to cloud:', error);
            return;
          }
          
          set({ lastSyncedAt: new Date().toISOString() });
          console.log('[TRUESKILL_CLOUD] ✅ Successfully synced to cloud using session ID');
        } catch (error) {
          console.log('[TRUESKILL_CLOUD] Cloud sync failed:', error);
        }
      },
      
      loadFromCloud: async () => {
        try {
          set({ isLoading: true });
          const state = get();
          console.log('[TRUESKILL_CLOUD] Loading ratings from cloud using session ID...');
          
          const { data, error } = await supabase
            .from('user_rankings')
            .select('*')
            .eq('user_id', state.sessionId) // Use session ID instead of authenticated user ID
            .eq('generation', -1) // Special generation for session-based storage
            .maybeSingle();
          
          if (error) {
            console.error('[TRUESKILL_CLOUD] Error loading from cloud:', error);
            set({ isLoading: false });
            return;
          }
          
          if (data && data.battle_results) {
            // Safely convert JSON back to Record<number, TrueSkillRating>
            const ratingsData = typeof data.battle_results === 'object' && data.battle_results !== null 
              ? data.battle_results as Record<string, any>
              : {};
            
            // Convert string keys to number keys and validate structure
            const convertedRatings: Record<number, TrueSkillRating> = {};
            Object.entries(ratingsData).forEach(([key, value]) => {
              const pokemonId = parseInt(key, 10);
              if (!isNaN(pokemonId) && value && typeof value === 'object') {
                const rating = value as any;
                if (typeof rating.mu === 'number' && typeof rating.sigma === 'number') {
                  convertedRatings[pokemonId] = {
                    mu: rating.mu,
                    sigma: rating.sigma,
                    lastUpdated: rating.lastUpdated || new Date().toISOString(),
                    battleCount: rating.battleCount || 0
                  };
                }
              }
            });
            
            console.log('[TRUESKILL_CLOUD] ✅ Loaded ratings from cloud using session ID:', Object.keys(convertedRatings).length, 'Pokemon');
            
            set({ 
              ratings: convertedRatings,
              lastSyncedAt: data.updated_at,
              isLoading: false 
            });
            
            // CRITICAL FIX: Dispatch load complete event for synchronization
            setTimeout(() => {
              const loadEvent = new CustomEvent('trueskill-store-loaded', {
                detail: { ratingsCount: Object.keys(convertedRatings).length }
              });
              document.dispatchEvent(loadEvent);
              
              const syncEvent = new CustomEvent('trueskill-updated', {
                detail: { 
                  source: 'store-loaded',
                  ratingsCount: Object.keys(convertedRatings).length,
                  timestamp: Date.now()
                }
              });
              document.dispatchEvent(syncEvent);
              
              console.log(`[TRUESKILL_SYNC_EVENTS] Dispatched load events for ${Object.keys(convertedRatings).length} Pokemon`);
            }, 10);
          } else {
            console.log('[TRUESKILL_CLOUD] No cloud data found for session ID, using local storage');
            set({ isLoading: false });
          }
        } catch (error) {
          console.log('[TRUESKILL_CLOUD] Cloud load failed, continuing with local storage:', error);
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
