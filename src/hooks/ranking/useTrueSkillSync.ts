
import { useEffect, useState, useMemo } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { RankedPokemon } from '@/services/pokemon';
import { Rating } from 'ts-trueskill';
import { formatPokemonName } from '@/utils/pokemon';

export const useTrueSkillSync = () => {
  const { getAllRatings, isHydrated, waitForHydration, isLoading, sessionId } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // CRITICAL DEBUG: Track session ID and initialization state
  console.log(`🔍🔍🔍 [TRUESKILL_SYNC_SESSION_DEBUG] ===== SESSION & HYDRATION STATE =====`);
  console.log(`🔍🔍🔍 [TRUESKILL_SYNC_SESSION_DEBUG] sessionId: ${sessionId}`);
  console.log(`🔍🔍🔍 [TRUESKILL_SYNC_SESSION_DEBUG] isHydrated: ${isHydrated}`);
  console.log(`🔍🔍🔍 [TRUESKILL_SYNC_SESSION_DEBUG] isLoading: ${isLoading}`);
  console.log(`🔍🔍🔍 [TRUESKILL_SYNC_SESSION_DEBUG] isInitialized: ${isInitialized}`);

  // Wait for both hydration AND cloud loading to complete
  useEffect(() => {
    const initializeAfterReady = async () => {
      console.log(`🔍🔍🔍 [TRUESKILL_SYNC_INIT] ===== INITIALIZATION START =====`);
      console.log(`🔍🔍🔍 [TRUESKILL_SYNC_INIT] sessionId at start: ${sessionId}`);
      console.log(`🔍🔍🔍 [TRUESKILL_SYNC_INIT] isHydrated: ${isHydrated}, isLoading: ${isLoading}`);
      
      if (!isHydrated) {
        console.log(`🔍🔍🔍 [TRUESKILL_SYNC_INIT] Waiting for hydration...`);
        await waitForHydration();
        console.log(`🔍🔍🔍 [TRUESKILL_SYNC_INIT] Hydration complete, sessionId: ${useTrueSkillStore.getState().sessionId}`);
      }
      
      // CRITICAL FIX: Wait for cloud loading to complete
      if (isLoading) {
        console.log(`🔍🔍🔍 [TRUESKILL_SYNC_INIT] Waiting for cloud loading to complete...`);
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        
        while (useTrueSkillStore.getState().isLoading && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
          console.log(`🔍🔍🔍 [TRUESKILL_SYNC_INIT] Cloud loading attempt ${attempts}...`);
        }
        
        console.log(`🔍🔍🔍 [TRUESKILL_SYNC_INIT] Cloud loading completed after ${attempts} attempts`);
      }
      
      // Get final state after everything is loaded
      const finalState = useTrueSkillStore.getState();
      const finalRatings = finalState.getAllRatings();
      console.log(`🔍🔍🔍 [TRUESKILL_SYNC_INIT] Final sessionId: ${finalState.sessionId}`);
      console.log(`🔍🔍🔍 [TRUESKILL_SYNC_INIT] Final ratings count: ${Object.keys(finalRatings).length}`);
      
      setIsInitialized(true);
      console.log(`🔍🔍🔍 [TRUESKILL_SYNC_INIT] ===== INITIALIZATION COMPLETE =====`);
    };
    
    initializeAfterReady();
  }, [isHydrated, isLoading, waitForHydration, sessionId]);

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
