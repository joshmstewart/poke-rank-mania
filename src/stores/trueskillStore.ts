
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
  updateRating: (pokemonId: number, rating: Rating) => void;
  getRating: (pokemonId: number) => Rating;
  hasRating: (pokemonId: number) => boolean;
  getAllRatings: () => Record<number, TrueSkillRating>;
  clearAllRatings: () => void;
  syncToCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
}

export const useTrueSkillStore = create<TrueSkillStore>()(
  persist(
    (set, get) => ({
      ratings: {},
      isLoading: false,
      lastSyncedAt: null,
      
      updateRating: (pokemonId: number, rating: Rating) => {
        console.log(`[TRUESKILL_CLOUD] Updating rating for Pokemon ${pokemonId}: μ=${rating.mu.toFixed(2)}, σ=${rating.sigma.toFixed(2)}`);
        
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
          
          // ENHANCED: Dispatch event to notify Manual mode of updates
          setTimeout(() => {
            const updateEvent = new CustomEvent('trueskill-store-updated', {
              detail: { pokemonId, rating: newRatings[pokemonId] }
            });
            document.dispatchEvent(updateEvent);
          }, 10);
          
          // Auto-sync to cloud after rating update
          setTimeout(() => {
            get().syncToCloud();
          }, 1000);
          
          return { ratings: newRatings };
        });
        
        const updatedRating = get().ratings[pokemonId];
        console.log(`[TRUESKILL_CLOUD] Verified update - Pokemon ${pokemonId} now has μ=${updatedRating.mu.toFixed(2)}, σ=${updatedRating.sigma.toFixed(2)}, battles=${updatedRating.battleCount}`);
      },
      
      getRating: (pokemonId: number) => {
        const storedRating = get().ratings[pokemonId];
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
        console.log(`🔍 [STORE_GET_ALL] getAllRatings called - returning ${Object.keys(ratings).length} ratings`);
        return ratings;
      },
      
      clearAllRatings: () => {
        const currentRatings = get().ratings;
        const ratingsCount = Object.keys(currentRatings).length;
        
        // CRITICAL DEBUG: Log the stack trace to see WHO is calling clearAllRatings
        console.error(`🚨 [STORE_CLEAR_DEBUG] clearAllRatings() called! Current ratings: ${ratingsCount}`);
        console.error(`🚨 [STORE_CLEAR_DEBUG] Stack trace:`, new Error().stack);
        
        // Log current state before clearing
        if (ratingsCount > 0) {
          console.error(`🚨 [STORE_CLEAR_DEBUG] About to clear ${ratingsCount} ratings!`);
          console.error(`🚨 [STORE_CLEAR_DEBUG] Sample ratings being lost:`, Object.entries(currentRatings).slice(0, 3));
        }
        
        console.log('[TRUESKILL_CLOUD] Clearing all ratings and syncing to cloud');
        set({ ratings: {}, lastSyncedAt: null });
        
        // ENHANCED: Dispatch clear event
        setTimeout(() => {
          const clearEvent = new CustomEvent('trueskill-store-cleared');
          document.dispatchEvent(clearEvent);
          console.error(`🚨 [STORE_CLEAR_DEBUG] Dispatched trueskill-store-cleared event`);
        }, 10);
        
        // Sync empty state to cloud
        setTimeout(() => {
          get().syncToCloud();
        }, 100);
      },
      
      syncToCloud: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.log('[TRUESKILL_CLOUD] No authenticated user, skipping cloud sync');
            return;
          }
          
          const state = get();
          console.log('[TRUESKILL_CLOUD] Syncing ratings to cloud...', Object.keys(state.ratings).length, 'Pokemon');
          
          // Convert ratings to JSON-compatible format
          const ratingsAsJson = JSON.parse(JSON.stringify(state.ratings));
          
          const { error } = await supabase
            .from('user_rankings')
            .upsert({
              user_id: user.id,
              generation: 0, // Use generation 0 for TrueSkill store
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
          console.log('[TRUESKILL_CLOUD] ✅ Successfully synced to cloud');
        } catch (error) {
          console.error('[TRUESKILL_CLOUD] Error syncing to cloud:', error);
        }
      },
      
      loadFromCloud: async () => {
        try {
          set({ isLoading: true });
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.log('[TRUESKILL_CLOUD] No authenticated user, skipping cloud load');
            set({ isLoading: false });
            return;
          }
          
          console.log('[TRUESKILL_CLOUD] Loading ratings from cloud...');
          
          const { data, error } = await supabase
            .from('user_rankings')
            .select('*')
            .eq('user_id', user.id)
            .eq('generation', 0)
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
            
            console.log('[TRUESKILL_CLOUD] ✅ Loaded ratings from cloud:', Object.keys(convertedRatings).length, 'Pokemon');
            console.log(`🔍 [CLOUD_LOAD_DEBUG] Setting ${Object.keys(convertedRatings).length} ratings in store`);
            
            set({ 
              ratings: convertedRatings,
              lastSyncedAt: data.updated_at,
              isLoading: false 
            });
            
            // ENHANCED: Dispatch load complete event
            setTimeout(() => {
              const loadEvent = new CustomEvent('trueskill-store-loaded', {
                detail: { ratingsCount: Object.keys(convertedRatings).length }
              });
              document.dispatchEvent(loadEvent);
              console.log(`🔍 [CLOUD_LOAD_DEBUG] Dispatched trueskill-store-loaded event with ${Object.keys(convertedRatings).length} ratings`);
            }, 10);
          } else {
            console.log('[TRUESKILL_CLOUD] No cloud data found, starting fresh');
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('[TRUESKILL_CLOUD] Error loading from cloud:', error);
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
