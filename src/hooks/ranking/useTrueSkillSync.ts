
import { useEffect, useState, useMemo } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { RankedPokemon } from '@/services/pokemon';
import { Rating } from 'ts-trueskill';
import { formatPokemonName } from '@/utils/pokemon';

export const useTrueSkillSync = () => {
  const { getAllRatings, isHydrated, waitForHydration, isLoading } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Wait for both hydration AND cloud loading to complete
  useEffect(() => {
    const initializeAfterReady = async () => {
      console.log(`🔍🔍🔍 [TRUESKILL_SYNC_INIT] Waiting for hydration and cloud sync...`);
      console.log(`🔍🔍🔍 [TRUESKILL_SYNC_INIT] isHydrated: ${isHydrated}, isLoading: ${isLoading}`);
      
      if (!isHydrated) {
        await waitForHydration();
      }
      
      // CRITICAL FIX: Wait for cloud loading to complete
      // This ensures we have the latest data from the cloud before generating rankings
      if (isLoading) {
        console.log(`🔍🔍🔍 [TRUESKILL_SYNC_INIT] Waiting for cloud loading to complete...`);
        // Poll until loading is complete
        const pollInterval = setInterval(() => {
          const currentLoadingState = useTrueSkillStore.getState().isLoading;
          if (!currentLoadingState) {
            console.log(`🔍🔍🔍 [TRUESKILL_SYNC_INIT] Cloud loading completed`);
            clearInterval(pollInterval);
            setIsInitialized(true);
          }
        }, 100);
        
        return () => clearInterval(pollInterval);
      } else {
        setIsInitialized(true);
      }
    };
    
    initializeAfterReady();
  }, [isHydrated, isLoading, waitForHydration]);

  const allRatings = getAllRatings();
  const contextReady = pokemonLookupMap.size > 0;
  const ratingsCount = Object.keys(allRatings).length;

  useEffect(() => {
    console.log(`🔍🔍🔍 [TRUESKILL_SYNC_DEBUG] ===== TRUESKILL SYNC EFFECT =====`);
    console.log(`🔍🔍🔍 [TRUESKILL_SYNC_DEBUG] contextReady: ${contextReady}`);
    console.log(`🔍🔍🔍 [TRUESKILL_SYNC_DEBUG] isInitialized: ${isInitialized}`);
    console.log(`🔍🔍🔍 [TRUESKILL_SYNC_DEBUG] isLoading: ${isLoading}`);
    console.log(`🔍🔍🔍 [TRUESKILL_SYNC_DEBUG] ratingsCount: ${ratingsCount}`);
    console.log(`🔍🔍🔍 [TRUESKILL_SYNC_DEBUG] pokemonLookupMap.size: ${pokemonLookupMap.size}`);

    // CRITICAL FIX: Only generate rankings after initialization is complete
    if (!contextReady || !isInitialized || isLoading) {
      console.log(`🔍🔍🔍 [TRUESKILL_SYNC_DEBUG] Not ready - early return`);
      console.log(`🔍🔍🔍 [TRUESKILL_SYNC_DEBUG] Reasons: contextReady=${contextReady}, isInitialized=${isInitialized}, isLoading=${isLoading}`);
      return;
    }

    if (ratingsCount === 0) {
      console.log(`🔍🔍🔍 [TRUESKILL_SYNC_DEBUG] No ratings - setting empty array`);
      console.log(`🔍🔍🔍 [TRUESKILL_SYNC_DEBUG] ⚠️⚠️⚠️ SETTING LOCAL RANKINGS TO EMPTY ARRAY`);
      setLocalRankings([]);
      return;
    }
    
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    console.log(`🔍🔍🔍 [TRUESKILL_SYNC_DEBUG] ratedPokemonIds: [${ratedPokemonIds.slice(0, 10).join(', ')}${ratedPokemonIds.length > 10 ? '...' : ''}]`);
    
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
        console.log(`🔍🔍🔍 [TRUESKILL_SYNC_DEBUG] Missing data for Pokemon ${pokemonId}: basePokemon=${!!basePokemon}, ratingData=${!!ratingData}`);
      }
    });

    rankings.sort((a, b) => b.score - a.score);
    
    console.log(`🔍🔍🔍 [TRUESKILL_SYNC_DEBUG] Generated ${rankings.length} rankings`);
    console.log(`🔍🔍🔍 [TRUESKILL_SYNC_DEBUG] Top 5 rankings: ${rankings.slice(0, 5).map(p => `${p.name}(${p.id}):${p.score.toFixed(2)}`).join(', ')}`);
    console.log(`🔍🔍🔍 [TRUESKILL_SYNC_DEBUG] ⚠️⚠️⚠️ SETTING LOCAL RANKINGS TO ${rankings.length} POKEMON`);
    
    setLocalRankings(rankings);
  }, [contextReady, ratingsCount, allRatings, pokemonLookupMap, isInitialized, isLoading]);

  const updateLocalRankings = useMemo(() => {
    return (newRankings: RankedPokemon[]) => {
      const formattedRankings = newRankings.map(pokemon => ({
        ...pokemon,
        name: formatPokemonName(pokemon.name)
      }));
      
      console.log(`🔍🔍🔍 [TRUESKILL_SYNC_DEBUG] updateLocalRankings called with ${formattedRankings.length} rankings`);
      console.log(`🔍🔍🔍 [TRUESKILL_SYNC_DEBUG] ⚠️⚠️⚠️ UPDATE LOCAL RANKINGS TO ${formattedRankings.length} POKEMON`);
      setLocalRankings(formattedRankings);
    };
  }, []);

  console.log(`🔍🔍🔍 [TRUESKILL_SYNC_RETURN] ⚠️⚠️⚠️ RETURNING ${localRankings.length} LOCAL RANKINGS`);

  return {
    localRankings,
    updateLocalRankings
  };
};
