
import { useState, useEffect, useMemo, useRef } from "react";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { RankedPokemon } from "@/services/pokemon";

export const useTrueSkillSync = (preventAutoResorting: boolean = false) => {
  const { getAllRatings } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>([]);
  const lastManualOrderRef = useRef<RankedPokemon[]>([]);
  
  console.log('🔄 [TRUESKILL_SYNC] Hook initialized with preventAutoResorting:', preventAutoResorting);

  // Transform TrueSkill ratings to RankedPokemon
  const rankingsFromTrueSkill = useMemo(() => {
    const ratings = getAllRatings();
    
    const rankedPokemon: RankedPokemon[] = Object.entries(ratings)
      .map(([pokemonId, rating]) => {
        const pokemon = pokemonLookupMap.get(parseInt(pokemonId));
        if (!pokemon) return null;
        
        const conservativeEstimate = rating.mu - rating.sigma;
        const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));
        
        return {
          ...pokemon,
          score: conservativeEstimate,
          confidence: confidence,
          rating: rating,
          count: rating.battleCount || 0,
          wins: 0,
          losses: 0,
          winRate: 0
        };
      })
      .filter((pokemon): pokemon is RankedPokemon => pokemon !== null);

    // CRITICAL: Only auto-sort if preventAutoResorting is false
    if (preventAutoResorting) {
      console.log('🔄 [TRUESKILL_SYNC] Manual mode active - preserving manual order');
      // If we have a manual order, preserve it but update the scores
      if (lastManualOrderRef.current.length > 0) {
        const manualOrder = lastManualOrderRef.current.map(manualPokemon => {
          const updatedPokemon = rankedPokemon.find(p => p.id === manualPokemon.id);
          return updatedPokemon || manualPokemon;
        });
        
        // Add any new Pokemon that weren't in the manual order
        const newPokemon = rankedPokemon.filter(p => 
          !lastManualOrderRef.current.some(manual => manual.id === p.id)
        );
        
        return [...manualOrder, ...newPokemon.sort((a, b) => b.score - a.score)];
      }
      
      // First time in manual mode, sort by score but remember this order
      return rankedPokemon.sort((a, b) => b.score - a.score);
    }
    
    // Auto-sort mode - sort by score
    console.log('🔄 [TRUESKILL_SYNC] Auto-sort mode - sorting by score');
    return rankedPokemon.sort((a, b) => b.score - a.score);
  }, [getAllRatings, pokemonLookupMap, preventAutoResorting]);

  // Update local rankings when TrueSkill data changes
  useEffect(() => {
    console.log('🔄 [TRUESKILL_SYNC] Rankings from TrueSkill updated:', rankingsFromTrueSkill.length);
    setLocalRankings(rankingsFromTrueSkill);
  }, [rankingsFromTrueSkill]);

  const updateLocalRankings = (newRankings: RankedPokemon[]) => {
    console.log('🔄 [TRUESKILL_SYNC] Manual rankings update received:', newRankings.length);
    
    // Store the manual order for future reference
    if (preventAutoResorting) {
      lastManualOrderRef.current = [...newRankings];
      console.log('🔄 [TRUESKILL_SYNC] Stored manual order in ref');
    }
    
    setLocalRankings(newRankings);
  };

  return {
    localRankings,
    updateLocalRankings
  };
};
