
import { useEffect, useState, useMemo } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { RankedPokemon } from '@/services/pokemon';
import { Rating } from 'ts-trueskill';
import { formatPokemonName } from '@/utils/pokemon';

export const useTrueSkillSync = () => {
  const { getAllRatings, isHydrated, waitForHydration, isLoading, sessionId, loadFromCloud } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasTriedCloudSync, setHasTriedCloudSync] = useState(false);

  // CRITICAL DEBUG: Track session ID and initialization state
  console.log(`🔍🔍🔍 [TRUESKILL_SYNC_SESSION_DEBUG] ===== SESSION & HYDRATION STATE =====`);
  console.log(`🔍🔍🔍 [TRUESKILL_SYNC_SESSION_DEBUG] sessionId: ${sessionId}`);
  console.log(`🔍🔍🔍 [TRUESKILL_SYNC_SESSION_DEBUG] isHydrated: ${isHydrated}`);
  console.log(`🔍🔍🔍 [TRUESKILL_SYNC_SESSION_DEBUG] isLoading: ${isLoading}`);
  console.log(`🔍🔍🔍 [TRUESKILL_SYNC_SESSION_DEBUG] isInitialized: ${isInitialized}`);
  console.log(`🔍🔍🔍 [TRUESKILL_SYNC_SESSION_DEBUG] hasTriedCloudSync: ${hasTriedCloudSync}`);

  // CRITICAL FIX: Force cloud sync on initialization
  useEffect(() => {
    const initializeWithCloudSync = async () => {
      console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_SYNC_FIX] ===== FORCED CLOUD SYNC INITIALIZATION =====`);
      console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_SYNC_FIX] sessionId at start: ${sessionId}`);
      console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_SYNC_FIX] isHydrated: ${isHydrated}, isLoading: ${isLoading}, hasTriedCloudSync: ${hasTriedCloudSync}`);
      
      if (!isHydrated) {
        console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_SYNC_FIX] Waiting for hydration...`);
        await waitForHydration();
        console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_SYNC_FIX] Hydration complete, sessionId: ${useTrueSkillStore.getState().sessionId}`);
      }
      
      // Get current ratings count after hydration
      const initialRatings = useTrueSkillStore.getState().getAllRatings();
      const initialCount = Object.keys(initialRatings).length;
      console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_SYNC_FIX] Initial ratings from localStorage: ${initialCount}`);
      
      // CRITICAL FIX: Always attempt cloud sync after hydration, regardless of initial count
      if (!hasTriedCloudSync && sessionId) {
        console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_SYNC_FIX] Forcing cloud sync for sessionId: ${sessionId}`);
        setHasTriedCloudSync(true);
        
        try {
          await loadFromCloud();
          
          // Check ratings count after cloud sync
          const postSyncRatings = useTrueSkillStore.getState().getAllRatings();
          const postSyncCount = Object.keys(postSyncRatings).length;
          console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_SYNC_FIX] ✅ Cloud sync completed: ${initialCount} → ${postSyncCount} ratings`);
          
          if (postSyncCount > initialCount) {
            console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_SYNC_FIX] 🎉 Successfully loaded ${postSyncCount - initialCount} additional ratings from cloud!`);
          } else if (postSyncCount === initialCount && initialCount > 0) {
            console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_SYNC_FIX] Cloud sync completed - data was already up to date`);
          } else if (postSyncCount === 0) {
            console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_SYNC_FIX] No cloud data found for sessionId: ${sessionId}`);
          }
          
        } catch (error) {
          console.error(`🔍🔍🔍 [TRUESKILL_CLOUD_SYNC_FIX] ❌ Cloud sync failed:`, error);
        }
      }
      
      // Wait for any remaining loading to complete
      if (isLoading) {
        console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_SYNC_FIX] Waiting for loading to complete...`);
        let attempts = 0;
        const maxAttempts = 50;
        
        while (useTrueSkillStore.getState().isLoading && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_SYNC_FIX] Loading completed after ${attempts} attempts`);
      }
      
      setIsInitialized(true);
      console.log(`🔍🔍🔍 [TRUESKILL_CLOUD_SYNC_FIX] ===== INITIALIZATION COMPLETE =====`);
    };
    
    initializeWithCloudSync();
  }, [isHydrated, sessionId, hasTriedCloudSync, waitForHydration, loadFromCloud]);

  const allRatings = getAllRatings();
  const contextReady = pokemonLookupMap.size > 0;
  const ratingsCount = Object.keys(allRatings).length;

  // CRITICAL DEBUG: Log detailed ratings information
  console.log(`🔍🔍🔍 [TRUESKILL_SYNC_RATINGS_DEBUG] ===== RATINGS STATE =====`);
  console.log(`🔍🔍🔍 [TRUESKILL_SYNC_RATINGS_DEBUG] ratingsCount: ${ratingsCount}`);
  console.log(`🔍🔍🔍 [TRUESKILL_SYNC_RATINGS_DEBUG] contextReady: ${contextReady}`);
  console.log(`🔍🔍🔍 [TRUESKILL_SYNC_RATINGS_DEBUG] pokemonLookupMap.size: ${pokemonLookupMap.size}`);
  
  if (ratingsCount > 0) {
    const ratingKeys = Object.keys(allRatings);
    console.log(`🔍🔍🔍 [TRUESKILL_SYNC_RATINGS_DEBUG] First 10 rating keys: ${ratingKeys.slice(0, 10).join(', ')}`);
    console.log(`🔍🔍🔍 [TRUESKILL_SYNC_RATINGS_DEBUG] Sample rating data:`, allRatings[ratingKeys[0]]);
  }

  useEffect(() => {
    console.log(`🔍🔍🔍 [TRUESKILL_SYNC_EFFECT] ===== RANKINGS GENERATION EFFECT =====`);
    console.log(`🔍🔍🔍 [TRUESKILL_SYNC_EFFECT] contextReady: ${contextReady}`);
    console.log(`🔍🔍🔍 [TRUESKILL_SYNC_EFFECT] isInitialized: ${isInitialized}`);
    console.log(`🔍🔍🔍 [TRUESKILL_SYNC_EFFECT] isLoading: ${isLoading}`);
    console.log(`🔍🔍🔍 [TRUESKILL_SYNC_EFFECT] ratingsCount: ${ratingsCount}`);
    console.log(`🔍🔍🔍 [TRUESKILL_SYNC_EFFECT] sessionId: ${sessionId}`);

    // CRITICAL FIX: Only generate rankings after EVERYTHING is ready
    if (!contextReady || !isInitialized || isLoading) {
      console.log(`🔍🔍🔍 [TRUESKILL_SYNC_EFFECT] Not ready - early return`);
      console.log(`🔍🔍🔍 [TRUESKILL_SYNC_EFFECT] Reasons: contextReady=${contextReady}, isInitialized=${isInitialized}, isLoading=${isLoading}`);
      return;
    }

    if (ratingsCount === 0) {
      console.log(`🔍🔍🔍 [TRUESKILL_SYNC_EFFECT] No ratings - setting empty array`);
      setLocalRankings([]);
      return;
    }
    
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    console.log(`🔍🔍🔍 [TRUESKILL_SYNC_EFFECT] Processing ${ratedPokemonIds.length} rated Pokemon`);
    console.log(`🔍🔍🔍 [TRUESKILL_SYNC_EFFECT] ratedPokemonIds sample: [${ratedPokemonIds.slice(0, 10).join(', ')}${ratedPokemonIds.length > 10 ? '...' : ''}]`);
    
    const rankings: RankedPokemon[] = [];

    ratedPokemonIds.forEach(pokemonId => {
      const basePokemon = pokemonLookupMap.get(pokemonId);
      const ratingData = allRatings[pokemonId.toString()];

      if (basePokemon && ratingData) {
        const rating = new Rating(ratingData.mu, ratingData.sigma);
        const conservativeEstimate = rating.mu - rating.sigma;
        const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));

        const formattedName = formatPokemonName(basePokemon.name);

        const rankedPokemon: RankedPokemon = {
          ...basePokemon,
          name: formattedName,
          score: conservativeEstimate,
          confidence: confidence,
          rating: rating,
          count: ratingData.battleCount || 0,
          wins: 0,
          losses: 0,
          winRate: 0
        };

        rankings.push(rankedPokemon);
      } else {
        if (!basePokemon) {
          console.log(`🔍🔍🔍 [TRUESKILL_SYNC_EFFECT] Missing basePokemon for ID ${pokemonId}`);
        }
        if (!ratingData) {
          console.log(`🔍🔍🔍 [TRUESKILL_SYNC_EFFECT] Missing ratingData for ID ${pokemonId}`);
        }
      }
    });

    rankings.sort((a, b) => b.score - a.score);
    
    console.log(`🔍🔍🔍 [TRUESKILL_SYNC_EFFECT] ===== FINAL RANKINGS GENERATED =====`);
    console.log(`🔍🔍🔍 [TRUESKILL_SYNC_EFFECT] Generated ${rankings.length} rankings from ${ratingsCount} ratings`);
    console.log(`🔍🔍🔍 [TRUESKILL_SYNC_EFFECT] Top 5 rankings: ${rankings.slice(0, 5).map(p => `${p.name}(${p.id}):${p.score.toFixed(2)}`).join(', ')}`);
    console.log(`🔍🔍🔍 [TRUESKILL_SYNC_EFFECT] ⚠️⚠️⚠️ SETTING LOCAL RANKINGS TO ${rankings.length} POKEMON`);
    
    setLocalRankings(rankings);
  }, [contextReady, ratingsCount, allRatings, pokemonLookupMap, isInitialized, isLoading, sessionId]);

  const updateLocalRankings = useMemo(() => {
    return (newRankings: RankedPokemon[]) => {
      const formattedRankings = newRankings.map(pokemon => ({
        ...pokemon,
        name: formatPokemonName(pokemon.name)
      }));
      
      console.log(`🔍🔍🔍 [TRUESKILL_SYNC_UPDATE] updateLocalRankings called with ${formattedRankings.length} rankings`);
      setLocalRankings(formattedRankings);
    };
  }, []);

  console.log(`🔍🔍🔍 [TRUESKILL_SYNC_RETURN] ===== FINAL RETURN VALUES =====`);
  console.log(`🔍🔍🔍 [TRUESKILL_SYNC_RETURN] sessionId: ${sessionId}`);
  console.log(`🔍🔍🔍 [TRUESKILL_SYNC_RETURN] ratingsCount: ${ratingsCount}`);
  console.log(`🔍🔍🔍 [TRUESKILL_SYNC_RETURN] localRankings.length: ${localRankings.length}`);
  console.log(`🔍🔍🔍 [TRUESKILL_SYNC_RETURN] isInitialized: ${isInitialized}`);

  return {
    localRankings,
    updateLocalRankings
  };
};
