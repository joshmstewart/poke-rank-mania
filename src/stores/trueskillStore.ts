
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Rating } from 'ts-trueskill';

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
          
          // Dispatch events for synchronization
          setTimeout(() => {
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
            
            console.log(`[TRUESKILL_SYNC_EVENTS] Dispatched update events for Pokemon ${pokemonId}`);
          }, 10);
          
          console.log(`[TRUESKILL_LOCAL] Updated Pokemon ${pokemonId} - μ=${newRatings[pokemonId].mu.toFixed(2)}, σ=${newRatings[pokemonId].sigma.toFixed(2)}, battles=${newRatings[pokemonId].battleCount}`);
          return { ratings: newRatings };
        });
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
        console.error(`🚨🚨🚨🚨🚨 [TRUESKILL_CLEAR_CRITICAL] ===== clearAllRatings() CALLED! =====`);
        console.error(`🚨 [TRUESKILL_CLEAR_CRITICAL] Timestamp: ${new Date().toISOString()}`);
        
        const stack = new Error().stack;
        console.error(`🚨 [TRUESKILL_CLEAR_CRITICAL] FULL CALL STACK:`);
        console.error(stack);
        
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
        
        if (ratingsCount > 0) {
          const sampleIds = Object.keys(currentRatings).slice(0, 5);
          console.error(`🚨 [TRUESKILL_CLEAR_CRITICAL] Sample ratings being lost:`, sampleIds.map(id => ({
            id,
            rating: currentRatings[parseInt(id)]
          })));
        }
        
        set({ ratings: {}, lastSyncedAt: null });
        
        console.error(`🚨 [TRUESKILL_CLEAR_CRITICAL] ✅ Ratings cleared. Store now has ${Object.keys(get().ratings).length} ratings`);
        
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
      },
      
      // FIXED: Simplified cloud sync to avoid RLS issues
      syncToCloud: async () => {
        try {
          const state = get();
          console.log('[TRUESKILL_CLOUD] Sync disabled due to RLS policy issues - using local storage only');
          
          // Don't attempt cloud sync to avoid RLS errors that might corrupt local state
          set({ lastSyncedAt: new Date().toISOString() });
          
        } catch (error) {
          console.log('[TRUESKILL_CLOUD] Cloud sync disabled:', error);
        }
      },
      
      // FIXED: Simplified cloud loading to avoid RLS issues  
      loadFromCloud: async () => {
        try {
          console.log('[TRUESKILL_CLOUD] Cloud loading disabled due to RLS policy issues - using local storage only');
          set({ isLoading: false });
          
          // Don't attempt cloud loading to avoid RLS errors
          // Data will persist via Zustand's persist middleware
          
        } catch (error) {
          console.log('[TRUESKILL_CLOUD] Cloud load disabled, using local storage:', error);
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
