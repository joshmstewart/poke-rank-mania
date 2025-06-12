
import { useCallback } from "react";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { Rating } from "ts-trueskill";
import { RankedPokemon } from "@/services/pokemon";

export const useBattleRankings = () => {
  const { getAllRatings } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();

  const generateRankingsFromBattleHistory = useCallback((battleHistory: any[]) => {
    console.log(`📊🔧🔧🔧 [BATTLE_RANKINGS_MEGA_FIX] ===== GENERATING MILESTONE RANKINGS =====`);
    console.log(`📊🔧🔧🔧 [BATTLE_RANKINGS_MEGA_FIX] Battle history length: ${battleHistory?.length || 0}`);
    
    // CRITICAL FIX: Always use TrueSkill store data instead of battle history
    // This ensures milestone rankings match Manual mode exactly
    const allRatings = getAllRatings();
    console.log(`📊🔧🔧🔧 [BATTLE_RANKINGS_MEGA_FIX] TrueSkill store raw ratings:`, Object.keys(allRatings).slice(0, 5));
    
    // CRITICAL FIX: Convert string keys to numbers for Pokemon ID lookup
    const ratedPokemonIds = Object.keys(allRatings).map(key => {
      const numericId = Number(key);
      console.log(`📊🔧🔧🔧 [BATTLE_RANKINGS_MEGA_FIX] Converting key "${key}" to number ${numericId}`);
      return numericId;
    }).filter(id => !isNaN(id));
    
    console.log(`📊🔧🔧🔧 [BATTLE_RANKINGS_MEGA_FIX] TrueSkill store contains ${ratedPokemonIds.length} rated Pokemon`);
    console.log(`📊🔧🔧🔧 [BATTLE_RANKINGS_MEGA_FIX] Pokemon lookup map size: ${pokemonLookupMap.size}`);
    console.log(`📊🔧🔧🔧 [BATTLE_RANKINGS_MEGA_FIX] First 5 rated Pokemon IDs:`, ratedPokemonIds.slice(0, 5));
    
    if (ratedPokemonIds.length === 0) {
      console.log(`📊🔧🔧🔧 [BATTLE_RANKINGS_MEGA_FIX] No TrueSkill ratings found, returning empty rankings`);
      return [];
    }

    // Create RankedPokemon objects from TrueSkill store (same as Manual mode)
    const rankings: RankedPokemon[] = [];
    
    ratedPokemonIds.forEach(pokemonId => {
      console.log(`📊🔧🔧🔧 [BATTLE_RANKINGS_MEGA_FIX] Processing Pokemon ID: ${pokemonId}`);
      
      const basePokemon = pokemonLookupMap.get(pokemonId);
      // CRITICAL FIX: Use string key for ratings lookup
      const ratingData = allRatings[pokemonId.toString()];
      
      console.log(`📊🔧🔧🔧 [BATTLE_RANKINGS_MEGA_FIX] Pokemon ${pokemonId} - basePokemon found: ${!!basePokemon}, ratingData found: ${!!ratingData}`);
      
      if (basePokemon && ratingData) {
        const rating = new Rating(ratingData.mu, ratingData.sigma);
        const conservativeEstimate = rating.mu - rating.sigma;
        const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));
        
        const rankedPokemon: RankedPokemon = {
          ...basePokemon,
          score: conservativeEstimate,
          confidence: confidence,
          rating: rating,
          count: ratingData.battleCount || 0,
          wins: 0, // These would need to be calculated from battle history
          losses: 0,
          winRate: 0
        };
        
        rankings.push(rankedPokemon);
        console.log(`📊🔧🔧🔧 [BATTLE_RANKINGS_MEGA_FIX] ✅ Added ${basePokemon.name} to rankings`);
      } else {
        console.log(`📊🔧🔧🔧 [BATTLE_RANKINGS_MEGA_FIX] ⚠️ Missing data for Pokemon ${pokemonId}: basePokemon=${!!basePokemon}, ratingData=${!!ratingData}`);
        
        // CRITICAL DEBUG: Check if it's a key mismatch issue
        if (!basePokemon) {
          console.log(`📊🔧🔧🔧 [BATTLE_RANKINGS_MEGA_FIX] Pokemon ${pokemonId} not found in lookup map`);
        }
        if (!ratingData) {
          console.log(`📊🔧🔧🔧 [BATTLE_RANKINGS_MEGA_FIX] Rating data for ${pokemonId} not found. Available keys:`, Object.keys(allRatings).slice(0, 10));
        }
      }
    });
    
    // Sort by score (conservative estimate) - same as Manual mode
    rankings.sort((a, b) => b.score - a.score);
    
    console.log(`📊🔧🔧🔧 [BATTLE_RANKINGS_MEGA_FIX] Generated ${rankings.length} rankings from TrueSkill store`);
    if (rankings.length > 0) {
      console.log(`📊🔧🔧🔧 [BATTLE_RANKINGS_MEGA_FIX] Top 5 rankings:`, rankings.slice(0, 5).map(p => ({
        name: p.name,
        id: p.id,
        score: p.score.toFixed(3),
        confidence: p.confidence.toFixed(1)
      })));
    } else {
      console.log(`📊🔧🔧🔧 [BATTLE_RANKINGS_MEGA_FIX] ❌ NO RANKINGS GENERATED - CRITICAL ISSUE!`);
    }
    console.log(`📊🔧🔧🔧 [BATTLE_RANKINGS_MEGA_FIX] ===== MILESTONE RANKINGS COMPLETE =====`);
    
    return rankings;
  }, [getAllRatings, pokemonLookupMap]);

  return {
    generateRankingsFromBattleHistory
  };
};
