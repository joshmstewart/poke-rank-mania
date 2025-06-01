
import { useEffect, useState } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { RankedPokemon } from '@/services/pokemon';
import { Rating } from 'ts-trueskill';
import { formatPokemonName } from '@/utils/pokemon';

export const useTrueSkillSync = () => {
  const { getAllRatings } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>([]);

  // Sync with TrueSkill store and apply name formatting
  useEffect(() => {
    console.log(`🔥 [TRUESKILL_SYNC] ===== SYNCING WITH TRUESKILL STORE =====`);
    
    const allRatings = getAllRatings();
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    
    console.log(`🔥 [TRUESKILL_SYNC] Found ${ratedPokemonIds.length} rated Pokemon in store`);
    console.log(`🔥 [TRUESKILL_SYNC] Pokemon lookup map size: ${pokemonLookupMap.size}`);

    if (ratedPokemonIds.length === 0) {
      console.log(`🔥 [TRUESKILL_SYNC] No ratings found, setting empty rankings`);
      setLocalRankings([]);
      return;
    }

    const rankings: RankedPokemon[] = [];

    ratedPokemonIds.forEach(pokemonId => {
      const basePokemon = pokemonLookupMap.get(pokemonId);
      const ratingData = allRatings[pokemonId];

      if (basePokemon && ratingData) {
        const rating = new Rating(ratingData.mu, ratingData.sigma);
        const conservativeEstimate = rating.mu - rating.sigma;
        const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));

        // CRITICAL FIX: Apply name formatting here
        const formattedName = formatPokemonName(basePokemon.name);
        console.log(`🔥 [TRUESKILL_SYNC] Formatting: "${basePokemon.name}" → "${formattedName}"`);

        const rankedPokemon: RankedPokemon = {
          ...basePokemon,
          name: formattedName, // Use formatted name
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
        console.log(`🔥 [TRUESKILL_SYNC] ⚠️ Missing data for Pokemon ${pokemonId}: basePokemon=${!!basePokemon}, ratingData=${!!ratingData}`);
      }
    });

    // Sort by score
    rankings.sort((a, b) => b.score - a.score);

    console.log(`🔥 [TRUESKILL_SYNC] Generated ${rankings.length} formatted rankings`);
    console.log(`🔥 [TRUESKILL_SYNC] Sample formatted rankings:`, rankings.slice(0, 3).map(p => ({
      name: p.name,
      id: p.id,
      score: p.score.toFixed(3)
    })));

    setLocalRankings(rankings);
  }, [getAllRatings, pokemonLookupMap]);

  // Manual update function that preserves formatting
  const updateLocalRankings = (newRankings: RankedPokemon[]) => {
    console.log(`🔥 [TRUESKILL_SYNC] Manual update with ${newRankings.length} rankings`);
    
    // Ensure all names are properly formatted
    const formattedRankings = newRankings.map(pokemon => ({
      ...pokemon,
      name: formatPokemonName(pokemon.name)
    }));
    
    setLocalRankings(formattedRankings);
  };

  return {
    localRankings,
    updateLocalRankings
  };
};
