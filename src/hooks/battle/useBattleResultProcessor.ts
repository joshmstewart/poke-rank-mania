
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { Rating, rate } from "ts-trueskill";

export const useBattleResultProcessor = () => {
  const { getRating, updateRating, incrementBattleCount } = useTrueSkillStore();

  const processBattleForTrueSkill = useCallback(async (battlePokemon: Pokemon[], winnerIds: number[]) => {
    console.log(`🎯 [TRUESKILL_PROCESSOR] Processing TrueSkill battle for Pokemon:`, battlePokemon.map(p => `${p.name}(${p.id})`));
    console.log(`🎯 [TRUESKILL_PROCESSOR] Winner IDs:`, winnerIds);
    
    try {
      // Get current ratings for all Pokemon
      const ratings = battlePokemon.map(pokemon => {
        const currentRating = getRating(pokemon.id.toString());
        console.log(`🎯 [TRUESKILL_PROCESSOR] Current rating for ${pokemon.name}: mu=${currentRating.mu}, sigma=${currentRating.sigma}`);
        return currentRating;
      });

      // Create teams based on battle type
      let teams: Rating[][];
      
      if (battlePokemon.length === 2) {
        // Pairs battle - each Pokemon is its own team
        teams = ratings.map(rating => [rating]);
      } else if (battlePokemon.length === 3) {
        // Triplets battle - winners vs loser
        const winnerRatings = battlePokemon
          .filter(pokemon => winnerIds.includes(pokemon.id))
          .map(pokemon => getRating(pokemon.id.toString()));
        
        const loserRatings = battlePokemon
          .filter(pokemon => !winnerIds.includes(pokemon.id))
          .map(pokemon => getRating(pokemon.id.toString()));
        
        teams = [winnerRatings, loserRatings];
      } else {
        console.error(`🎯 [TRUESKILL_PROCESSOR] Invalid battle size: ${battlePokemon.length} Pokemon`);
        return;
      }

      console.log(`🎯 [TRUESKILL_PROCESSOR] Teams created:`, teams.map((team, idx) => 
        `Team ${idx + 1}: ${team.map(r => `mu=${r.mu.toFixed(2)}, sigma=${r.sigma.toFixed(2)}`).join(', ')}`
      ));

      // Calculate new ratings
      const newRatings = rate(teams);
      console.log(`🎯 [TRUESKILL_PROCESSOR] New ratings calculated:`, newRatings.map((team, idx) => 
        `Team ${idx + 1}: ${team.map(r => `mu=${r.mu.toFixed(2)}, sigma=${r.sigma.toFixed(2)}`).join(', ')}`
      ));

      // Update ratings for each Pokemon
      if (battlePokemon.length === 2) {
        // Pairs battle
        battlePokemon.forEach((pokemon, index) => {
          const newRating = newRatings[index][0];
          console.log(`🎯 [TRUESKILL_PROCESSOR] Updating ${pokemon.name} rating: ${getRating(pokemon.id.toString()).mu.toFixed(2)} -> ${newRating.mu.toFixed(2)}`);
          
          updateRating(pokemon.id.toString(), newRating);
          incrementBattleCount(pokemon.id.toString());
        });
      } else if (battlePokemon.length === 3) {
        // Triplets battle
        const winnerPokemon = battlePokemon.filter(pokemon => winnerIds.includes(pokemon.id));
        const loserPokemon = battlePokemon.filter(pokemon => !winnerIds.includes(pokemon.id));
        
        // Update winner ratings
        winnerPokemon.forEach((pokemon, index) => {
          const newRating = newRatings[0][index];
          console.log(`🎯 [TRUESKILL_PROCESSOR] Updating winner ${pokemon.name} rating: ${getRating(pokemon.id.toString()).mu.toFixed(2)} -> ${newRating.mu.toFixed(2)}`);
          
          updateRating(pokemon.id.toString(), newRating);
          incrementBattleCount(pokemon.id.toString());
        });
        
        // Update loser ratings
        loserPokemon.forEach((pokemon, index) => {
          const newRating = newRatings[1][index];
          console.log(`🎯 [TRUESKILL_PROCESSOR] Updating loser ${pokemon.name} rating: ${getRating(pokemon.id.toString()).mu.toFixed(2)} -> ${newRating.mu.toFixed(2)}`);
          
          updateRating(pokemon.id.toString(), newRating);
          incrementBattleCount(pokemon.id.toString());
        });
      }

      console.log(`🎯 [TRUESKILL_PROCESSOR] ✅ TrueSkill processing complete for battle`);
      
    } catch (error) {
      console.error(`🎯 [TRUESKILL_PROCESSOR] ❌ Error processing TrueSkill battle:`, error);
      throw error;
    }
  }, [getRating, updateRating, incrementBattleCount]);

  return {
    processBattleForTrueSkill
  };
};
