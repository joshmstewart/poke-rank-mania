
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { Rating, rate } from "ts-trueskill";
import { BattleType, SingleBattle } from "./types";
import { useBattleFlowSafety } from "./useBattleFlowSafety";

export const useBattleResultProcessor = (
  battleResults?: SingleBattle[],
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
  activeTier?: any,
  freezePokemonForTier?: any,
  trackLowerTierLoss?: any
) => {
  const { getRating, updateRating, incrementBattleCount } = useTrueSkillStore();
  const { safelyRemovePendingAfterBattle } = useBattleFlowSafety();

  const processBattleForTrueSkill = useCallback(async (battlePokemon: Pokemon[], winnerIds: number[]) => {
    const battleId = `BATTLE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🎯🎯🎯 [${battleId}] ===== PROCESSING TRUESKILL BATTLE =====`);
    console.log(`🎯🎯🎯 [${battleId}] Pokemon:`, battlePokemon.map(p => `${p.name}(${p.id})`));
    console.log(`🎯🎯🎯 [${battleId}] Winner IDs:`, winnerIds);
    
    try {
      // Get current ratings for all Pokemon
      const ratings = battlePokemon.map(pokemon => {
        const currentRating = getRating(pokemon.id.toString());
        console.log(`🎯🎯🎯 [${battleId}] Current rating for ${pokemon.name}: mu=${currentRating.mu}, sigma=${currentRating.sigma}`);
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
        console.error(`🎯🎯🎯 [${battleId}] Invalid battle size: ${battlePokemon.length} Pokemon`);
        return;
      }

      console.log(`🎯🎯🎯 [${battleId}] Teams created:`, teams.map((team, idx) => 
        `Team ${idx + 1}: ${team.map(r => `mu=${r.mu.toFixed(2)}, sigma=${r.sigma.toFixed(2)}`).join(', ')}`
      ));

      // Calculate new ratings
      const newRatings = rate(teams);
      console.log(`🎯🎯🎯 [${battleId}] New ratings calculated:`, newRatings.map((team, idx) => 
        `Team ${idx + 1}: ${team.map(r => `mu=${r.mu.toFixed(2)}, sigma=${r.sigma.toFixed(2)}`).join(', ')}`
      ));

      // Update ratings for each Pokemon
      if (battlePokemon.length === 2) {
        // Pairs battle
        battlePokemon.forEach((pokemon, index) => {
          const newRating = newRatings[index][0];
          console.log(`🎯🎯🎯 [${battleId}] Updating ${pokemon.name} rating: ${getRating(pokemon.id.toString()).mu.toFixed(2)} -> ${newRating.mu.toFixed(2)}`);
          
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
          console.log(`🎯🎯🎯 [${battleId}] Updating winner ${pokemon.name} rating: ${getRating(pokemon.id.toString()).mu.toFixed(2)} -> ${newRating.mu.toFixed(2)}`);
          
          updateRating(pokemon.id.toString(), newRating);
          incrementBattleCount(pokemon.id.toString());
        });
        
        // Update loser ratings
        loserPokemon.forEach((pokemon, index) => {
          const newRating = newRatings[1][index];
          console.log(`🎯🎯🎯 [${battleId}] Updating loser ${pokemon.name} rating: ${getRating(pokemon.id.toString()).mu.toFixed(2)} -> ${newRating.mu.toFixed(2)}`);
          
          updateRating(pokemon.id.toString(), newRating);
          incrementBattleCount(pokemon.id.toString());
        });
      }

      console.log(`🎯🎯🎯 [${battleId}] ✅ TrueSkill processing complete for battle`);
      
      // CRITICAL FIX: Remove ALL participating Pokemon from pending after successful TrueSkill update
      const participatingIds = battlePokemon.map(p => p.id);
      console.log(`🎯🎯🎯 [${battleId}] Now removing participating Pokemon from pending:`, participatingIds);
      
      await safelyRemovePendingAfterBattle(participatingIds);
      
      console.log(`🎯🎯🎯 [${battleId}] ✅ Battle processing and pending removal complete`);
      
    } catch (error) {
      console.error(`🎯🎯🎯 [${battleId}] ❌ Error processing TrueSkill battle:`, error);
      throw error;
    }
  }, [getRating, updateRating, incrementBattleCount, safelyRemovePendingAfterBattle]);

  // Create the processResult function that other files expect
  const processResult = useCallback((
    selectedPokemonIds: number[],
    battleType: BattleType,
    currentBattle: Pokemon[]
  ) => {
    const resultId = `RESULT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🎯🎯🎯 [${resultId}] ===== PROCESSING BATTLE RESULT =====`);
    console.log(`🎯🎯🎯 [${resultId}] Selected Pokemon IDs:`, selectedPokemonIds);
    console.log(`🎯🎯🎯 [${resultId}] Battle type:`, battleType);
    console.log(`🎯🎯🎯 [${resultId}] Current battle:`, currentBattle.map(p => `${p.name}(${p.id})`));

    // Call the TrueSkill processor which will also handle pending removal
    processBattleForTrueSkill(currentBattle, selectedPokemonIds);

    // Return a battle result object for compatibility
    const result = {
      battleType,
      pokemonIds: currentBattle.map(p => p.id),
      selectedPokemonIds,
      timestamp: new Date().toISOString()
    };
    
    console.log(`🎯🎯🎯 [${resultId}] ✅ Battle result processed:`, result);
    return result;
  }, [processBattleForTrueSkill]);

  return {
    processBattleForTrueSkill,
    processResult
  };
};
