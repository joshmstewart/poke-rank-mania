
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

  useEffect(() => {
    const initializeWithCloudSync = async () => {
      if (!isHydrated) {
        await waitForHydration();
      }
      
      const initialRatings = useTrueSkillStore.getState().getAllRatings();
      const initialCount = Object.keys(initialRatings).length;
      
      if (!hasTriedCloudSync && sessionId) {
        setHasTriedCloudSync(true);
        
        try {
          await loadFromCloud();
          const postSyncRatings = useTrueSkillStore.getState().getAllRatings();
          const postSyncCount = Object.keys(postSyncRatings).length;
          
          if (postSyncCount > initialCount) {
            console.log(`Loaded ${postSyncCount - initialCount} additional ratings from cloud`);
          }
        } catch (error) {
          console.error('Cloud sync failed:', error);
        }
      }
      
      if (isLoading) {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (useTrueSkillStore.getState().isLoading && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
      }
      
      setIsInitialized(true);
    };
    
    initializeWithCloudSync();
  }, [isHydrated, sessionId, hasTriedCloudSync, waitForHydration, loadFromCloud]);

  const allRatings = getAllRatings();
  const contextReady = pokemonLookupMap.size > 0;
  const ratingsCount = Object.keys(allRatings).length;

  useEffect(() => {
    if (!contextReady || !isInitialized || isLoading) {
      return;
    }

    if (ratingsCount === 0) {
      setLocalRankings([]);
      return;
    }
    
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
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
          winRate: 0,
          generation: basePokemon.generation || 1,
          image: basePokemon.image || ''
        };

        rankings.push(rankedPokemon);
      }
    });

    rankings.sort((a, b) => b.score - a.score);
    setLocalRankings(rankings);
  }, [contextReady, ratingsCount, allRatings, pokemonLookupMap, isInitialized, isLoading, sessionId]);

  const updateLocalRankings = useMemo(() => {
    return (newRankings: RankedPokemon[]) => {
      const formattedRankings = newRankings.map(pokemon => ({
        ...pokemon,
        name: formatPokemonName(pokemon.name),
        generation: pokemon.generation || 1,
        image: pokemon.image || ''
      }));
      
      setLocalRankings(formattedRankings);
    };
  }, []);

  return {
    localRankings,
    updateLocalRankings
  };
};
