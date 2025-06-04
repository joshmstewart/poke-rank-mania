
import { useEffect, useState, useMemo } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { RankedPokemon } from '@/services/pokemon';
import { Rating } from 'ts-trueskill';
import { formatPokemonName } from '@/utils/pokemon';

export const useTrueSkillSync = () => {
  const { getAllRatings, isHydrated, waitForHydration, syncInProgress, sessionId, loadFromCloud } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasTriedCloudSync, setHasTriedCloudSync] = useState(false);

  useEffect(() => {
    const initializeWithCloudSync = async () => {
      console.log('🔍 [DEBUG] useTrueSkillSync initialization start');
      
      if (!isHydrated) {
        console.log('🔍 [DEBUG] Waiting for hydration...');
        await waitForHydration();
      }
      
      const initialRatings = useTrueSkillStore.getState().getAllRatings();
      const initialCount = Object.keys(initialRatings || {}).length;
      console.log('🔍 [DEBUG] Initial ratings count:', initialCount);
      
      if (!hasTriedCloudSync && sessionId) {
        setHasTriedCloudSync(true);
        
        try {
          console.log('🔍 [DEBUG] Attempting cloud sync...');
          await loadFromCloud();
          const postSyncRatings = useTrueSkillStore.getState().getAllRatings();
          const postSyncCount = Object.keys(postSyncRatings || {}).length;
          console.log('🔍 [DEBUG] Post-sync ratings count:', postSyncCount);
          
          if (postSyncCount > initialCount) {
            console.log(`Loaded ${postSyncCount - initialCount} additional ratings from cloud`);
          }
        } catch (error) {
          console.error('🔍 [DEBUG] Cloud sync failed:', error);
        }
      }
      
      if (syncInProgress) {
        console.log('🔍 [DEBUG] Sync in progress, waiting...');
        let attempts = 0;
        const maxAttempts = 50;
        
        while (useTrueSkillStore.getState().syncInProgress && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        console.log('🔍 [DEBUG] Sync wait completed, attempts:', attempts);
      }
      
      console.log('🔍 [DEBUG] Setting initialized to true');
      setIsInitialized(true);
    };
    
    initializeWithCloudSync();
  }, [isHydrated, sessionId, hasTriedCloudSync, waitForHydration, loadFromCloud]);

  const allRatings = getAllRatings() || {};
  const contextReady = pokemonLookupMap && pokemonLookupMap.size > 0;
  const ratingsCount = Object.keys(allRatings).length;

  useEffect(() => {
    console.log('🔍 [DEBUG] useTrueSkillSync main effect triggered');
    console.log('🔍 [DEBUG] contextReady:', contextReady);
    console.log('🔍 [DEBUG] isInitialized:', isInitialized);
    console.log('🔍 [DEBUG] syncInProgress:', syncInProgress);
    console.log('🔍 [DEBUG] ratingsCount:', ratingsCount);
    console.log('🔍 [DEBUG] pokemonLookupMap type:', typeof pokemonLookupMap);
    console.log('🔍 [DEBUG] pokemonLookupMap size:', pokemonLookupMap?.size);
    
    if (!contextReady || !isInitialized || syncInProgress) {
      console.log('🔍 [DEBUG] Early return from main effect');
      return;
    }

    if (ratingsCount === 0) {
      console.log('🔍 [DEBUG] No ratings, setting empty array');
      setLocalRankings([]);
      return;
    }
    
    console.log('🔍 [DEBUG] Processing ratings...');
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    const rankings: RankedPokemon[] = [];

    ratedPokemonIds.forEach(pokemonId => {
      if (!pokemonLookupMap) {
        console.log('🔍 [DEBUG] pokemonLookupMap is null/undefined');
        return;
      }
      
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
    console.log('🔍 [DEBUG] Final rankings count:', rankings.length);
    setLocalRankings(rankings);
  }, [contextReady, ratingsCount, allRatings, pokemonLookupMap, isInitialized, syncInProgress, sessionId]);

  const updateLocalRankings = useMemo(() => {
    return (newRankings: RankedPokemon[]) => {
      console.log('🔍 [DEBUG] updateLocalRankings called with:', typeof newRankings, Array.isArray(newRankings) ? newRankings.length : 'not array');
      
      if (!Array.isArray(newRankings)) {
        console.warn('updateLocalRankings called with invalid data:', newRankings);
        return;
      }
      
      const formattedRankings = newRankings.map(pokemon => ({
        ...pokemon,
        name: formatPokemonName(pokemon.name),
        generation: pokemon.generation || 1,
        image: pokemon.image || ''
      }));
      
      console.log('🔍 [DEBUG] Setting formatted rankings, count:', formattedRankings.length);
      setLocalRankings(formattedRankings);
    };
  }, []);

  console.log('🔍 [DEBUG] useTrueSkillSync returning localRankings.length:', localRankings?.length || 'undefined');

  return {
    localRankings,
    updateLocalRankings
  };
};
