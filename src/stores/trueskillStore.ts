import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Rating } from 'ts-trueskill';
import { toast } from '@/hooks/use-toast';

interface TrueSkillRating {
  mu: number;
  sigma: number;
  battleCount: number;
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
  
  // Cloud sync actions
  syncToCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
  smartSync: () => Promise<void>;
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
      initiatePendingBattle: false,

      updateRating: (pokemonId: string, rating: Rating) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] UpdateRating called for Pokemon ${pokemonId}`);
        set((state) => ({
          ratings: {
            ...state.ratings,
            [pokemonId]: {
              mu: rating.mu,
              sigma: rating.sigma,
              battleCount: (state.ratings[pokemonId]?.battleCount || 0)
            }
          }
        }));
        
        // Queue a sync after updates
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Triggering syncToCloud from updateRating`);
        get().syncToCloud();
      },

      incrementBattleCount: (pokemonId: string) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] IncrementBattleCount called for Pokemon ${pokemonId}`);
        set((state) => ({
          ratings: {
            ...state.ratings,
            [pokemonId]: {
              ...state.ratings[pokemonId],
              battleCount: (state.ratings[pokemonId]?.battleCount || 0) + 1
            }
          }
        }));
      },

      incrementTotalBattles: () => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] IncrementTotalBattles called`);
        set((state) => ({
          totalBattles: state.totalBattles + 1
        }));
        
        // Queue a sync after battle count increment
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Triggering syncToCloud from incrementTotalBattles`);
        get().syncToCloud();
      },

      setTotalBattles: (count: number) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] SetTotalBattles called with count: ${count}`);
        set({ totalBattles: count });
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
        set({ 
          ratings: {},
          totalBattles: 0
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
            console.log(`🚨🚨🚨 [SYNC_AUDIT] New pending battles array:`, newPendingBattles);
            return { pendingBattles: newPendingBattles };
          }
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Pokemon ${pokemonId} already in pending battles`);
          return state;
        });
      },

      removePendingBattle: (pokemonId: number) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] RemovePendingBattle called for Pokemon ${pokemonId}`);
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Current pending before remove:`, get().pendingBattles);
        
        set((state) => {
          const newPendingBattles = state.pendingBattles.filter(id => id !== pokemonId);
          console.log(`🚨🚨🚨 [SYNC_AUDIT] New pending battles after remove:`, newPendingBattles);
          return { pendingBattles: newPendingBattles };
        });
        
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Final pending after remove:`, get().pendingBattles);
      },

      clearAllPendingBattles: () => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ClearAllPendingBattles called`);
        set({ pendingBattles: [] });
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Triggering syncToCloud from clearAllPendingBattles`);
        get().syncToCloud();
      },

      isPokemonPending: (pokemonId: number) => {
        const pending = get().pendingBattles.includes(pokemonId);
        console.log(`🚨🚨🚨 [SYNC_AUDIT] isPokemonPending(${pokemonId}): ${pending}`);
        return pending;
      },

      getAllPendingBattles: () => {
        const pending = get().pendingBattles;
        console.log(`🚨🚨🚨 [SYNC_AUDIT] getAllPendingBattles returning:`, pending);
        return pending;
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
        
        // Sync to cloud
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
        
        // Sync to cloud
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
            const pendingBeforeSync = state.pendingBattles.length;
            console.log(`🚨🚨🚨 [SYNC_AUDIT] Starting sync - ${ratingsBeforeSync} ratings, ${state.totalBattles} battles, ${pendingBeforeSync} pending`);
            
            const response = await fetch('https://irgivbujlgezbxosxqgb.supabase.co/functions/v1/sync-trueskill', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2l2YnVqbGdlemJ4b3N4cWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1Njg0ODgsImV4cCI6MjA2NDE0NDQ4OH0.KFBQazOEgvy4Q14OHpHLve12brZG7Rgaf_CypY74zrs`
              },
              body: JSON.stringify({
                sessionId: state.sessionId,
                ratings: state.ratings as any,
                totalBattles: state.totalBattles,
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
                title: 'Sync Error',
                description: 'Failed to parse cloud response',
                variant: 'destructive'
              });
              return;
            }

            console.log(`🚨🚨🚨 [SYNC_AUDIT] ✅ Sync successful:`, result);
            set({ lastSyncTime: Date.now() });

          } catch (error) {
            console.error(`🚨🚨🚨 [SYNC_AUDIT] ❌ Sync failed:`, error);
            toast({
              title: 'Cloud Sync Failed',
              description: 'Failed to sync data to cloud. Changes may not persist.',
              variant: 'destructive'
            });
          } finally {
            set({ syncInProgress: false });
          }
        }, SYNC_DEBOUNCE_DELAY);
      },

      loadFromCloud: async () => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== LOAD FROM CLOUD CALLED =====`);
        const state = get();
        
        try {
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Loading for session: ${state.sessionId}`);
          
          const response = await fetch('https://irgivbujlgezbxosxqgb.supabase.co/functions/v1/get-trueskill', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2l2YnVqbGdlemJ4b3N4cWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1Njg0ODgsImV4cCI6MjA2NDE0NDQ4OH0.KFBQazOEgvy4Q14OHpHLve12brZG7Rgaf_CypY74zrs`
            },
            body: JSON.stringify({
              sessionId: state.sessionId
            })
          });

          const result = await response.json();
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Load response:`, result);

          if (response.ok && result.data) {
            const cloudData = result.data;
            console.log(`🚨🚨🚨 [SYNC_AUDIT] ✅ Loading cloud data:`, {
              ratings: Object.keys(cloudData.ratings || {}).length,
              totalBattles: cloudData.totalBattles || 0,
              pendingBattles: cloudData.pendingBattles?.length || 0
            });
            
            set({
              ratings: cloudData.ratings || {},
              totalBattles: cloudData.totalBattles || 0,
              pendingBattles: cloudData.pendingBattles || [],
              refinementQueue: cloudData.refinementQueue || [],
              isHydrated: true,
              lastSyncTime: Date.now()
            });
          } else {
            console.log(`🚨🚨🚨 [SYNC_AUDIT] No cloud data found, using defaults`);
            set({ isHydrated: true });
          }

        } catch (error) {
          console.error(`🚨🚨🚨 [SYNC_AUDIT] ❌ Load failed:`, error);
          set({ isHydrated: true });
        }
      },

      smartSync: async () => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== SMART SYNC CALLED =====`);
        const state = get();
        
        if (!state.isHydrated) {
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Not hydrated yet, loading from cloud first`);
          await get().loadFromCloud();
        } else {
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Already hydrated, syncing to cloud`);
          await get().syncToCloud();
        }
      },

      waitForHydration: async () => {
        return new Promise<void>((resolve) => {
          const checkHydration = () => {
            if (get().isHydrated) {
              resolve();
            } else {
              setTimeout(checkHydration, 100);
            }
          };
          checkHydration();
        });
      },

      restoreSessionFromCloud: async (userId: string) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== RESTORE SESSION FROM CLOUD =====`);
        console.log(`🚨🚨🚨 [SYNC_AUDIT] User ID: ${userId}`);
        
        try {
          const response = await fetch('https://irgivbujlgezbxosxqgb.supabase.co/functions/v1/get-trueskill', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2l2YnVqbGdlemJ4b3N4cWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1Njg0ODgsImV4cCI6MjA2NDE0NDQ4OH0.KFBQazOEgvy4Q14OHpHLve12brZG7Rgaf_CypY74zrs`
            },
            body: JSON.stringify({
              userId: userId
            })
          });

          const result = await response.json();
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Restore response:`, result);

          if (response.ok && result.data) {
            const cloudData = result.data;
            console.log(`🚨🚨🚨 [SYNC_AUDIT] ✅ Restoring user session:`, {
              sessionId: cloudData.sessionId,
              ratings: Object.keys(cloudData.ratings || {}).length,
              totalBattles: cloudData.totalBattles || 0,
              pendingBattles: cloudData.pendingBattles?.length || 0
            });
            
            set({
              sessionId: cloudData.sessionId || generateSessionId(),
              ratings: cloudData.ratings || {},
              totalBattles: cloudData.totalBattles || 0,
              pendingBattles: cloudData.pendingBattles || [],
              refinementQueue: cloudData.refinementQueue || [],
              isHydrated: true,
              lastSyncTime: Date.now()
            });
          } else {
            console.log(`🚨🚨🚨 [SYNC_AUDIT] No user session found, creating new one`);
            set({ 
              sessionId: generateSessionId(),
              isHydrated: true 
            });
          }

        } catch (error) {
          console.error(`🚨🚨🚨 [SYNC_AUDIT] ❌ Restore failed:`, error);
          set({ 
            sessionId: generateSessionId(),
            isHydrated: true 
          });
        }
      },
    }),
    {
      name: 'trueskill-store',
      onRehydrateStorage: () => (state) => {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== ZUSTAND REHYDRATION =====`);
        if (state) {
          console.log(`🚨🚨🚨 [SYNC_AUDIT] Rehydrated with:`, {
            ratings: Object.keys(state.ratings || {}).length,
            totalBattles: state.totalBattles || 0,
            pendingBattles: state.pendingBattles?.length || 0,
            sessionId: state.sessionId
          });
          
          state.isHydrated = true;
          
          // Load from cloud to get latest data
          setTimeout(() => {
            console.log(`🚨🚨🚨 [SYNC_AUDIT] Triggering loadFromCloud after rehydration`);
            state.loadFromCloud();
          }, 100);
        }
      },
    }
  )
);
