
import { useEffect, useState, useMemo } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { RankedPokemon } from '@/services/pokemon';
import { Rating } from 'ts-trueskill';
import { formatPokemonName } from '@/utils/pokemon';

export const useTrueSkillSync = () => {
  const { getAllRatings, isHydrated, waitForHydration, syncInProgress, sessionId, loadFromCloud } = useTrueSkillStore();
  const { pokemonLookupMap, isContextReady } = usePokemonContext();
  
  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasTriedCloudSync, setHasTriedCloudSync] = useState(false);

  useEffect(() => {
    const initializeWithCloudSync = async () => {
      console.log('🔍 [TRUESKILL_SYNC] Initialization start');
      
      if (!isHydrated) {
        console.log('🔍 [TRUESKILL_SYNC] Waiting for hydration...');
        await waitForHydration();
      }
      
      const initialRatings = useTrueSkillStore.getState().getAllRatings();
      const initialCount = Object.keys(initialRatings || {}).length;
      console.log('🔍 [TRUESKILL_SYNC] Initial ratings count:', initialCount);
      
      if (!hasTriedCloudSync && sessionId) {
        setHasTriedCloudSync(true);
        
        try {
          console.log('🔍 [TRUESKILL_SYNC] Attempting cloud sync...');
          await loadFromCloud();
          const postSyncRatings = useTrueSkillStore.getState().getAllRatings();
          const postSyncCount = Object.keys(postSyncRatings || {}).length;
          console.log('🔍 [TRUESKILL_SYNC] Post-sync ratings count:', postSyncCount);
          
          if (postSyncCount > initialCount) {
            console.log(`Loaded ${postSyncCount - initialCount} additional ratings from cloud`);
          }
        } catch (error) {
          console.error('🔍 [TRUESKILL_SYNC] Cloud sync failed:', error);
        }
      }
      
      if (syncInProgress) {
        console.log('🔍 [TRUESKILL_SYNC] Sync in progress, waiting...');
        let attempts = 0;
        const maxAttempts = 50;
        
        while (useTrueSkillStore.getState().syncInProgress && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        console.log('🔍 [TRUESKILL_SYNC] Sync wait completed, attempts:', attempts);
      }
      
      console.log('🔍 [TRUESKILL_SYNC] Setting initialized to true');
      setIsInitialized(true);
    };
    
    initializeWithCloudSync().catch(error => {
      console.error('🔍 [TRUESKILL_SYNC] Initialization failed:', error);
      setIsInitialized(true);
    });
  }, [isHydrated, sessionId, hasTriedCloudSync, waitForHydration, loadFromCloud]);

  const allRatings = getAllRatings() || {};
  const ratingsCount = Object.keys(allRatings).length;

  // CRITICAL FIX: Wait for BOTH TrueSkill initialization AND Pokemon context readiness
  useEffect(() => {
    const effectId = Date.now();
    console.log(`🚀 [RANKINGS_SYNC_${effectId}] ===== MAIN RANKINGS SYNC =====`);
    console.log(`🚀 [RANKINGS_SYNC_${effectId}] isContextReady:`, isContextReady);
    console.log(`🚀 [RANKINGS_SYNC_${effectId}] isInitialized:`, isInitialized);
    console.log(`🚀 [RANKINGS_SYNC_${effectId}] syncInProgress:`, syncInProgress);
    console.log(`🚀 [RANKINGS_SYNC_${effectId}] ratingsCount:`, ratingsCount);
    console.log(`🚀 [RANKINGS_SYNC_${effectId}] pokemonLookupMap size:`, pokemonLookupMap?.size);
    
    // CRITICAL: Must have BOTH context ready AND TrueSkill initialized
    if (!isContextReady || !isInitialized || syncInProgress) {
      console.log(`🚀 [RANKINGS_SYNC_${effectId}] ❌ Not ready - setting empty array`);
      console.log(`🚀 [RANKINGS_SYNC_${effectId}] Reason: contextReady=${isContextReady}, initialized=${isInitialized}, syncInProgress=${syncInProgress}`);
      setLocalRankings([]);
      return;
    }

    if (ratingsCount === 0) {
      console.log(`🚀 [RANKINGS_SYNC_${effectId}] ❌ No ratings, setting empty array`);
      setLocalRankings([]);
      return;
    }
    
    console.log(`🚀 [RANKINGS_SYNC_${effectId}] ✅ Processing ${ratingsCount} ratings with ${pokemonLookupMap.size} Pokemon...`);
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    const rankings: RankedPokemon[] = [];

    try {
      let processedCount = 0;
      let failedCount = 0;
      
      ratedPokemonIds.forEach(pokemonId => {
        const basePokemon = pokemonLookupMap.get(pokemonId);
        const ratingData = allRatings[pokemonId.toString()];

        if (!basePokemon) {
          console.warn(`🚀 [RANKINGS_SYNC_${effectId}] ❌ No basePokemon found for ID ${pokemonId}`);
          failedCount++;
          return;
        }
        
        if (!ratingData) {
          console.warn(`🚀 [RANKINGS_SYNC_${effectId}] ❌ No ratingData found for ID ${pokemonId}`);
          failedCount++;
          return;
        }

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
        processedCount++;
      });

      console.log(`🚀 [RANKINGS_SYNC_${effectId}] ===== PROCESSING COMPLETE =====`);
      console.log(`🚀 [RANKINGS_SYNC_${effectId}] Total processed: ${processedCount}`);
      console.log(`🚀 [RANKINGS_SYNC_${effectId}] Total failed: ${failedCount}`);
      console.log(`🚀 [RANKINGS_SYNC_${effectId}] Final rankings array length: ${rankings.length}`);

      rankings.sort((a, b) => b.score - a.score);
      console.log(`🚀 [RANKINGS_SYNC_${effectId}] ✅ Sorted rankings, setting ${rankings.length} Pokemon`);
      
      setLocalRankings(rankings);
      console.log(`🚀 [RANKINGS_SYNC_${effectId}] ✅ Rankings set successfully`);
      
    } catch (error) {
      console.error(`🚀 [RANKINGS_SYNC_${effectId}] ❌❌❌ ERROR processing rankings:`, error);
      setLocalRankings([]);
    }
  }, [isContextReady, ratingsCount, allRatings, pokemonLookupMap, isInitialized, syncInProgress, sessionId]);

  const updateLocalRankings = useMemo(() => {
    return (newRankings: RankedPokemon[]) => {
      const updateId = Date.now();
      console.log(`🔍 [UPDATE_RANKINGS_${updateId}] updateLocalRankings called with ${newRankings?.length || 0} rankings`);
      
      if (!Array.isArray(newRankings)) {
        console.warn(`🔍 [UPDATE_RANKINGS_${updateId}] ❌ Invalid data passed:`, newRankings);
        setLocalRankings([]);
        return;
      }
      
      const formattedRankings = newRankings.map(pokemon => ({
        ...pokemon,
        name: formatPokemonName(pokemon.name),
        generation: pokemon.generation || 1,
        image: pokemon.image || ''
      }));
      
      console.log(`🔍 [UPDATE_RANKINGS_${updateId}] Setting ${formattedRankings.length} formatted rankings`);
      setLocalRankings(formattedRankings);
    };
  }, []);

  console.log(`🔥 [RETURN_CHECK] Returning ${localRankings.length} local rankings`);

  return {
    localRankings,
    updateLocalRankings
  };
};
