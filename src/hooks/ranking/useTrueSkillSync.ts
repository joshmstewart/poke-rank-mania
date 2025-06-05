
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
    console.log('🔄🔄🔄 [TRUESKILL_SYNC_RANKING_GENERATION] ===== GENERATING RANKINGS FROM TRUESKILL =====');
    const ratings = getAllRatings();
    console.log('🔄🔄🔄 [TRUESKILL_SYNC_RANKING_GENERATION] Retrieved ratings from store:', Object.keys(ratings).length);
    
    const rankedPokemon: RankedPokemon[] = Object.entries(ratings)
      .map(([pokemonId, rating]) => {
        const pokemon = pokemonLookupMap.get(parseInt(pokemonId));
        if (!pokemon) {
          console.warn('🔄 [TRUESKILL_SYNC] Pokemon not found in lookup map:', pokemonId);
          return null;
        }
        
        const conservativeEstimate = rating.mu - rating.sigma;
        const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));
        
        console.log(`🔄🔄🔄 [TRUESKILL_SYNC_SCORE_CALC] ${pokemon.name}: μ=${rating.mu.toFixed(3)}, σ=${rating.sigma.toFixed(3)}, score=${conservativeEstimate.toFixed(3)}`);
        
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

    console.log('🔄🔄🔄 [TRUESKILL_SYNC_RANKING_GENERATION] Created', rankedPokemon.length, 'ranked Pokemon');

    // CRITICAL: Only auto-sort if preventAutoResorting is false
    if (preventAutoResorting) {
      console.log('🔄🔄🔄 [TRUESKILL_SYNC_MANUAL_MODE] Manual mode active - preserving manual order');
      // If we have a manual order, preserve it but update the scores
      if (lastManualOrderRef.current.length > 0) {
        const manualOrder = lastManualOrderRef.current.map(manualPokemon => {
          const updatedPokemon = rankedPokemon.find(p => p.id === manualPokemon.id);
          if (updatedPokemon) {
            console.log(`🔄🔄🔄 [TRUESKILL_SYNC_SCORE_UPDATE] Updated ${updatedPokemon.name} score: ${updatedPokemon.score.toFixed(3)}`);
          }
          return updatedPokemon || manualPokemon;
        });
        
        // Add any new Pokemon that weren't in the manual order
        const newPokemon = rankedPokemon.filter(p => 
          !lastManualOrderRef.current.some(manual => manual.id === p.id)
        );
        
        const finalOrder = [...manualOrder, ...newPokemon.sort((a, b) => b.score - a.score)];
        console.log('🔄🔄🔄 [TRUESKILL_SYNC_MANUAL_MODE] Final manual order:', finalOrder.length, 'Pokemon');
        return finalOrder;
      }
      
      // First time in manual mode, sort by score but remember this order
      const sortedByScore = rankedPokemon.sort((a, b) => b.score - a.score);
      console.log('🔄🔄🔄 [TRUESKILL_SYNC_MANUAL_MODE] First time manual mode - sorted by score');
      return sortedByScore;
    }
    
    // Auto-sort mode - sort by score
    console.log('🔄🔄🔄 [TRUESKILL_SYNC_AUTO_SORT] Auto-sort mode - sorting by score');
    const sortedRankings = rankedPokemon.sort((a, b) => b.score - a.score);
    console.log('🔄🔄🔄 [TRUESKILL_SYNC_AUTO_SORT] Final sorted rankings:', sortedRankings.slice(0, 5).map(p => `${p.name}: ${p.score.toFixed(3)}`));
    return sortedRankings;
  }, [getAllRatings, pokemonLookupMap, preventAutoResorting]);

  // Update local rankings when TrueSkill data changes
  useEffect(() => {
    console.log('🔄 [TRUESKILL_SYNC] Rankings from TrueSkill updated:', rankingsFromTrueSkill.length);
    setLocalRankings(rankingsFromTrueSkill);
  }, [rankingsFromTrueSkill]);

  const updateLocalRankings = (newRankings: RankedPokemon[]) => {
    console.log('🔄🔄🔄 [TRUESKILL_SYNC_UPDATE] Manual rankings update received:', newRankings.length);
    
    // Store the manual order for future reference
    if (preventAutoResorting) {
      lastManualOrderRef.current = [...newRankings];
      console.log('🔄🔄🔄 [TRUESKILL_SYNC_UPDATE] Stored manual order in ref - first 3:', 
        newRankings.slice(0, 3).map((p, i) => `${i+1}. ${p.name}: ${p.score.toFixed(3)}`));
    }
    
    setLocalRankings(newRankings);
  };

  return {
    localRankings,
    updateLocalRankings
  };
};
