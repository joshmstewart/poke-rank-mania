import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Rating } from 'ts-trueskill';
import { toast } from '@/hooks/use-toast';

interface TrueSkillRating {
  mu: number;
  sigma: number;
  battleCount: number;
  lastUpdated: number; // Timestamp in milliseconds
}

interface RefinementBattle {
  primaryPokemonId: number;
  opponentPokemonId: number;
  priority: number;
}

interface TrueSkillStore {
  ratings: Record<string, TrueSkillRating>;
  pendingBattles: number[];
  refinementQueue: RefinementBattle[];
  sessionId: string;
  isHydrated: boolean;
  lastSyncTime: number;
  syncInProgress: boolean;
  totalBattles: number;
  totalBattlesLastUpdated: number; // New timestamp field
  initiatePendingBattle: boolean;
  
  // Actions
  updateRating: (pokemonId: string, rating: Rating) => void;
  incrementBattleCount: (pokemonId: string) => void;
  incrementTotalBattles: () => void;
  setTotalBattles: (count: number) => void;
  getAllRatings: () => Record<string, TrueSkillRating>;
  getRating: (pokemonId: string) => Rating;
  hasRating: (pokemonId: string) => boolean;
  clearAllRatings: () => void;
  forceScoreBetweenNeighbors: (pokemonId: string, higherNeighborId?: string, lowerNeighborId?: string) => void;
  
  // Pending battles actions
  addPendingBattle: (pokemonId: number) => void;
  removePendingBattle: (pokemonId: number) => void;
  clearAllPendingBattles: () => void;
  isPokemonPending: (pokemonId: number) => boolean;
  getAllPendingBattles: () => number[];
  
  // Refinement queue actions
  queueBattlesForReorder: (primaryPokemonId: number, opponentIds: number[], priority: number) => number;
  getNextRefinementBattle: () => RefinementBattle | null;
  popRefinementBattle: () => void;
  hasRefinementBattles: () => boolean;
  getRefinementBattleCount: () => number;
  clearRefinementQueue: () => void;
  
  // Mode switch coordination
  setInitiatePendingBattle: (value: boolean) => void;
  
  // Enhanced cloud sync actions with timestamp-based merging
  syncToCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
  smartSync: () => Promise<void>;
  mergeCloudData: (cloudData: any) => void;
  waitForHydration: () => Promise<void>;
  restoreSessionFromCloud: (userId: string) => Promise<void>;
}

const generateSessionId = () => crypto.randomUUID();

// Debounce delay for syncing to the server (in milliseconds)
const SYNC_DEBOUNCE_DELAY = 1500;
let syncTimeout: ReturnType<typeof setTimeout> | null = null;

export const useTrueSkillStore = create<TrueSkillStore>()(
  persist(
    (set, get) => ({
      ratings: {},
      pendingBattles: [],
      refinementQueue: [],
      sessionId: generateSessionId(),
      isHydrated: false,
      lastSyncTime: 0,
      syncInProgress: false,
      totalBattles: 0,
      totalBattlesLastUpdated: Date.now(),
      initiatePendingBattle: false,

      updateRating: (pokemonId: string, rating: Rating) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] UpdateRating called for Pokemon ${pokemonId}`);
        const now = Date.now();
        set((state) => ({
          ratings: {
            ...state.ratings,
            [pokemonId]: {
              mu: rating.mu,
              sigma: rating.sigma,
              battleCount: (state.ratings[pokemonId]?.battleCount || 0),
              lastUpdated: now
            }
          }
        }));
        
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Triggering syncToCloud from updateRating`);
        get().syncToCloud();
      },

      incrementBattleCount: (pokemonId: string) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] IncrementBattleCount called for Pokemon ${pokemonId}`);
        const now = Date.now();
        set((state) => ({
          ratings: {
            ...state.ratings,
            [pokemonId]: {
              ...state.ratings[pokemonId],
              battleCount: (state.ratings[pokemonId]?.battleCount || 0) + 1,
              lastUpdated: now
            }
          }
        }));
      },

      incrementTotalBattles: () => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] IncrementTotalBattles called`);
        const now = Date.now();
        set((state) => ({
          totalBattles: state.totalBattles + 1,
          totalBattlesLastUpdated: now
        }));
        
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Triggering syncToCloud from incrementTotalBattles`);
        get().syncToCloud();
      },

      setTotalBattles: (count: number) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] SetTotalBattles called with count: ${count}`);
        const now = Date.now();
        set({ 
          totalBattles: count,
          totalBattlesLastUpdated: now
        });
      },

      getAllRatings: () => get().ratings,

      getRating: (pokemonId: string) => {
        const rating = get().ratings[pokemonId];
        if (rating) {
          return new Rating(rating.mu, rating.sigma);
        }
        return new Rating(); // Default rating
      },

      hasRating: (pokemonId: string) => {
        return pokemonId in get().ratings;
      },

      clearAllRatings: () => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ClearAllRatings called`);
        const now = Date.now();
        set({ 
          ratings: {},
          totalBattles: 0,
          totalBattlesLastUpdated: now
        });
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Triggering syncToCloud from clearAllRatings`);
        get().syncToCloud();
      },

      forceScoreBetweenNeighbors: (pokemonId: string, higherNeighborId?: string, lowerNeighborId?: string) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ForceScoreBetweenNeighbors called for Pokemon ${pokemonId}`);
        const state = get();
        const higherNeighborScore = higherNeighborId ? state.ratings[higherNeighborId]?.mu : undefined;
        const lowerNeighborScore = lowerNeighborId ? state.ratings[lowerNeighborId]?.mu : undefined;
        
        let targetScore: number;
        
        if (higherNeighborScore !== undefined && lowerNeighborScore !== undefined) {
          targetScore = (higherNeighborScore + lowerNeighborScore) / 2;
        } else if (higherNeighborScore !== undefined) {
          targetScore = higherNeighborScore + 1.0;
        } else if (lowerNeighborScore !== undefined) {
          targetScore = lowerNeighborScore - 1.0;
        } else {
          targetScore = 25.0; // Default TrueSkill rating
        }
        
        const newRating = new Rating(targetScore, 8.333); // Use default sigma
        get().updateRating(pokemonId, newRating);
      },

      addPendingBattle: (pokemonId: number) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] AddPendingBattle called for Pokemon ${pokemonId}`);
        set((state) => {
          if (!state.pendingBattles.includes(pokemonId)) {
            console.log(`🚨🚨🚨 [SYNC_AUDIT] Adding Pokemon ${pokemonId} to pending battles`);
            const newPendingBattles = [...state.pendingBattles, pokemonId];
            return { pendingBattles: newPendingBattles };
          }
          return state;
        });
        
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Triggering syncToCloud from addPendingBattle`);
        get().syncToCloud();
      },

      removePendingBattle: (pokemonId: number) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] RemovePendingBattle called for Pokemon ${pokemonId}`);
        set((state) => ({
          pendingBattles: state.pendingBattles.filter(id => id !== pokemonId)
        }));
        
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Triggering syncToCloud from removePendingBattle`);
        get().syncToCloud();
      },

      clearAllPendingBattles: () => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ClearAllPendingBattles called`);
        set({ pendingBattles: [] });
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Triggering syncToCloud from clearAllPendingBattles`);
        get().syncToCloud();
      },

      isPokemonPending: (pokemonId: number) => {
        return get().pendingBattles.includes(pokemonId);
      },

      getAllPendingBattles: () => {
        return get().pendingBattles;
      },

      queueBattlesForReorder: (primaryPokemonId: number, opponentIds: number[], priority: number) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] QueueBattlesForReorder called for Pokemon ${primaryPokemonId}`);
        
        const newBattles: RefinementBattle[] = opponentIds.map(opponentPokemonId => ({
          primaryPokemonId,
          opponentPokemonId,
          priority
        }));
        
        set((state) => {
          const updatedQueue = [...state.refinementQueue, ...newBattles]
            .sort((a, b) => a.priority - b.priority);
          
          return { refinementQueue: updatedQueue };
        });
        
        const finalLength = get().refinementQueue.length;
        
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Triggering syncToCloud from queueBattlesForReorder`);
        get().syncToCloud();
        
        return finalLength;
      },

      getNextRefinementBattle: () => {
        const queue = get().refinementQueue;
        return queue.length > 0 ? queue[0] : null;
      },

      popRefinementBattle: () => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] PopRefinementBattle called`);
        set((state) => {
          const newQueue = state.refinementQueue.slice(1);
          return { refinementQueue: newQueue };
        });
        
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Triggering syncToCloud from popRefinementBattle`);
        get().syncToCloud();
      },

      hasRefinementBattles: () => {
        return get().refinementQueue.length > 0;
      },

      getRefinementBattleCount: () => {
        return get().refinementQueue.length;
      },

      clearRefinementQueue: () => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ClearRefinementQueue called`);
        set({ refinementQueue: [] });
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Triggering syncToCloud from clearRefinementQueue`);
        get().syncToCloud();
      },

      setInitiatePendingBattle: (value: boolean) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] SetInitiatePendingBattle called with value: ${value}`);
        set({ initiatePendingBattle: value });
      },

      mergeCloudData: (cloudData: any) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== TIMESTAMP-BASED MERGE =====`);
        const currentState = get();
        
        // Merge ratings with timestamp priority
        const mergedRatings: Record<string, TrueSkillRating> = { ...currentState.ratings };
        
        if (cloudData.ratings) {
          Object.entries(cloudData.ratings).forEach(([pokemonId, cloudRating]: [string, any]) => {
            const localRating = currentState.ratings[pokemonId];
            
            // Add default timestamp if missing
            const cloudTimestamp = cloudRating.lastUpdated || 0;
            const localTimestamp = localRating?.lastUpdated || 0;
            
            if (!localRating || cloudTimestamp > localTimestamp) {
              console.log(`🚨🚨🚨 [SYNC_AUDIT] Using cloud data for Pokemon ${pokemonId} (cloud: ${cloudTimestamp} > local: ${localTimestamp})`);
              mergedRatings[pokemonId] = {
                ...cloudRating,
                lastUpdated: cloudTimestamp || Date.now()
              };
            } else {
              console.log(`🚨🚨🚨 [SYNC_AUDIT] Keeping local data for Pokemon ${pokemonId} (local: ${localTimestamp} > cloud: ${cloudTimestamp})`);
            }
          });
        }
        
        // Merge total battles with timestamp priority
        let mergedTotalBattles = currentState.totalBattles;
        let mergedTotalBattlesTimestamp = currentState.totalBattlesLastUpdated;
        
        if (cloudData.totalBattlesLastUpdated && cloudData.totalBattlesLastUpdated > currentState.totalBattlesLastUpdated) {
          mergedTotalBattles = cloudData.totalBattles || 0;
          mergedTotalBattlesTimestamp = cloudData.totalBattlesLastUpdated;
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Using cloud total battles: ${mergedTotalBattles}`);
        } else {
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Keeping local total battles: ${mergedTotalBattles}`);
        }
        
        // Merge pending battles and refinement queue (combine and dedupe)
        const mergedPending = [...new Set([...currentState.pendingBattles, ...(cloudData.pendingBattles || [])])];
        const mergedRefinements = [...currentState.refinementQueue, ...(cloudData.refinementQueue || [])];
        
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Merge complete - ${Object.keys(mergedRatings).length} ratings, ${mergedTotalBattles} battles`);
        
        set({
          ratings: mergedRatings,
          totalBattles: mergedTotalBattles,
          totalBattlesLastUpdated: mergedTotalBattlesTimestamp,
          pendingBattles: mergedPending,
          refinementQueue: mergedRefinements,
          isHydrated: true
        });
      },

      syncToCloud: async () => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== SYNC TO CLOUD CALLED =====`);
        if (syncTimeout) {
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Clearing existing sync timeout`);
          clearTimeout(syncTimeout);
        }
        syncTimeout = setTimeout(async () => {
          syncTimeout = null;
          const state = get();
          
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Checking sync in progress: ${state.syncInProgress}`);
          if (state.syncInProgress) {
            console.log(`🚨🚨🚨 [SYNC_AUDIT] Sync already in progress, aborting`);
            return;
          }

          set({ syncInProgress: true });
          
          try {
            const ratingsBeforeSync = Object.keys(state.ratings).length;
            console.log(`🚨🚨🚨 [SYNC_AUDIT] Starting sync - ${ratingsBeforeSync} ratings, ${state.totalBattles} battles`);
            
            const response = await fetch('https://irgivbujlgezbxosxqgb.supabase.co/functions/v1/sync-trueskill', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2l2YnVqbGdlemJ4b3N4cWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1Njg0ODgsImV4cCI6MjA2NDE0NDQ4OH0.KFBQazOEgvy4Q14OHpHLve12brZG7Rgaf_CypY74zrs`
              },
              body: JSON.stringify({
                sessionId: state.sessionId,
                ratings: state.ratings,
                totalBattles: state.totalBattles,
                totalBattlesLastUpdated: state.totalBattlesLastUpdated,
                pendingBattles: state.pendingBattles,
                refinementQueue: state.refinementQueue,
                lastUpdated: new Date().toISOString()
              })
            });

            const raw = await response.text();
            console.log(`🚨🚨🚨 [SYNC_AUDIT] Sync response status: ${response.status}`);

            if (!response.ok) {
              throw new Error(`Sync failed: ${response.status} - ${raw}`);
            }

            let result: any;
            try {
              result = JSON.parse(raw);
            } catch (jsonError) {
              console.error(`🚨🚨🚨 [SYNC_AUDIT] Failed to parse JSON: ${raw}`);
              toast({
                title: 'Cloud Sync Failed',
                description: 'Could not save progress to the cloud. Your changes are saved locally.',
                variant: 'destructive',
              });
              return;
            }

            if (result.success) {
              set({ lastSyncTime: Date.now() });
              console.log(`🚨🚨🚨 [SYNC_AUDIT] Sync successful!`);
            } else {
              throw new Error(result.error || 'Unknown sync error');
            }
          } catch (error) {
            console.error(`🚨🚨🚨 [SYNC_AUDIT] Sync failed:`, error);
            toast({
              title: 'Cloud Sync Failed',
              description: 'Could not save progress to the cloud. Your changes are saved locally.',
              variant: 'destructive',
            });
          } finally {
            set({ syncInProgress: false });
            console.log(`🚨🚨🚨 [SYNC_AUDIT] Sync operation complete`);
          }
        }, SYNC_DEBOUNCE_DELAY);
      },

      loadFromCloud: async () => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== LOAD FROM CLOUD CALLED =====`);
        try {
          const ratingsBeforeLoad = Object.keys(get().ratings).length;
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Loading from cloud - current ratings: ${ratingsBeforeLoad}`);
          
          const response = await fetch('https://irgivbujlgezbxosxqgb.supabase.co/functions/v1/get-trueskill', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2l2YnVqbGdlemJ4b3N4cWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1Njg0ODgsImV4cCI6MjA2NDE0NDQ4OH0.KFBQazOEgvy4Q14OHpHLve12brZG7Rgaf_CypY74zrs`
            },
            body: JSON.stringify({ sessionId: get().sessionId })
          });
          
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Load response status: ${response.status}`);
          
          if (!response.ok) {
            throw new Error(`Load failed: ${response.status}`);
          }
          
          const result = await response.json();
          if (result.success && result.ratings) {
            const cloudRatingsCount = Object.keys(result.ratings).length;
            console.log(`🚨🚨🚨 [SYNC_AUDIT] Loaded ${cloudRatingsCount} ratings from cloud`);
            
            // Use the new merge function instead of direct replacement
            get().mergeCloudData(result);
            
            console.log(`🚨🚨🚨 [SYNC_AUDIT] Load complete - hydration flag set`);
          }
        } catch (error) {
          console.error(`🚨🚨🚨 [SYNC_AUDIT] Load from cloud failed:`, error);
          toast({
            title: 'Cloud Load Failed',
            description: 'Could not load data from the cloud. Using local data for now.',
            variant: 'destructive',
          });
          // Ensure hydration even if cloud load fails
          set({ isHydrated: true });
        }
      },

      smartSync: async () => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== SMART SYNC CALLED =====`);
        const state = get();
        
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Smart sync checking - sync in progress: ${state.syncInProgress}`);
        
        if (state.syncInProgress) {
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Smart sync aborting - sync already in progress`);
          return;
        }

        set({ syncInProgress: true });
        
        const ratingsBeforeSmartSync = Object.keys(state.ratings).length;
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Smart sync starting - current ratings: ${ratingsBeforeSmartSync}`);

        try {
          const response = await fetch('https://irgivbujlgezbxosxqgb.supabase.co/functions/v1/get-trueskill', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2l2YnVqbGdlemJ4b3N4cWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1Njg0ODgsImV4cCI6MjA2NDE0NDQ4OH0.KFBQazOEgvy4Q14OHpHLve12brZG7Rgaf_CypY74zrs`
            },
            body: JSON.stringify({ sessionId: state.sessionId }),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              const cloudRatingCount = Object.keys(result.ratings || {}).length;
              console.log(`🚨🚨🚨 [SYNC_AUDIT] Cloud state - ${cloudRatingCount} ratings`);
              
              // Use the new merge function
              get().mergeCloudData(result);
              
              // Sync the merged data back to cloud
              await get().syncToCloud();
            }
          } else {
            console.log(`🚨🚨🚨 [SYNC_AUDIT] Could not fetch cloud state. Using local state only.`);
            set({ isHydrated: true });
          }
          
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Smart sync complete - hydration flag set`);
          
        } catch (error) {
          console.error(`🚨🚨🚨 [SYNC_AUDIT] Smart sync failed:`, error);
          toast({
            title: 'Smart Sync Failed',
            description: 'Could not sync with the cloud. Check console for details.',
            variant: 'destructive',
          });
          set({ isHydrated: true }); // Ensure app doesn't hang
        } finally {
          set({ syncInProgress: false });
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Smart sync operation complete`);
        }
      },

      waitForHydration: () => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] WaitForHydration called`);
        return new Promise((resolve) => {
          if (get().isHydrated) {
            console.log(`🚨🚨🚨 [SYNC_AUDIT] Already hydrated`);
            resolve();
            return;
          }
          
          const checkHydration = () => {
            if (get().isHydrated) {
              console.log(`🚨🚨🚨 [SYNC_AUDIT] Hydration complete`);
              resolve();
            } else {
              setTimeout(checkHydration, 10);
            }
          };
          checkHydration();
        });
      },

      restoreSessionFromCloud: async (userId: string) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== RESTORE SESSION CALLED =====`);
        try {
          const ratingsBeforeRestore = Object.keys(get().ratings).length;
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Restoring session for user: ${userId} - current ratings: ${ratingsBeforeRestore}`);
          
          await get().smartSync();
          
          const ratingsAfterRestore = Object.keys(get().ratings).length;
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Session restore complete - final ratings: ${ratingsAfterRestore}`);
        } catch (error) {
          console.error(`🚨🚨🚨 [SYNC_AUDIT] Session restoration failed:`, error);
        }
      }
    }),
    {
      name: 'trueskill-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Migrate old data without timestamps
          const now = Date.now();
          Object.keys(state.ratings).forEach(pokemonId => {
            if (!state.ratings[pokemonId].lastUpdated) {
              state.ratings[pokemonId].lastUpdated = now;
            }
          });
          
          if (!state.totalBattlesLastUpdated) {
            state.totalBattlesLastUpdated = now;
          }
          
          state.isHydrated = true;
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Zustand hydration complete with timestamp migration`);
        }
      }
    }
  )
);
