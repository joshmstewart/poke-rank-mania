
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { Rating, rate } from "ts-trueskill";
import { BattleType, SingleBattle } from "./types";
import { useBattleFlowLogger } from "./useBattleFlowLogger";

export const useBattleResultProcessor = (
  battleResults?: SingleBattle[],
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
  activeTier?: any,
  freezePokemonForTier?: any,
  trackLowerTierLoss?: any
) => {
  const { getRating, updateRating, incrementBattleCount, incrementTotalBattles } = useTrueSkillStore();
  const { logStoreChange } = useBattleFlowLogger();

  const processBattleForTrueSkill = useCallback(async (battlePokemon: Pokemon[], winnerIds: number[]) => {
    console.log(`🎯 [TRUESKILL_PROCESSOR] ===== STARTING TRUESKILL BATTLE PROCESSING =====`);
    console.log(`🎯 [TRUESKILL_PROCESSOR] Processing TrueSkill battle for Pokemon:`, battlePokemon.map(p => `${p.name}(${p.id})`));
    console.log(`🎯 [TRUESKILL_PROCESSOR] Winner IDs:`, winnerIds);
    
    logStoreChange('BATTLE_START', { 
      pokemon: battlePokemon.map(p => ({ id: p.id, name: p.name })),
      winners: winnerIds 
    });
    
    try {
      // Get current ratings for all Pokemon
      const ratings = battlePokemon.map(pokemon => {
        const currentRating = getRating(pokemon.id.toString());
        console.log(`🎯 [TRUESKILL_PROCESSOR] Current rating for ${pokemon.name}: mu=${currentRating.mu.toFixed(3)}, sigma=${currentRating.sigma.toFixed(3)}`);
        return currentRating;
      });

      // Create teams based on battle type
      let teams: Rating[][];
      
      if (battlePokemon.length === 2) {
        // Pairs battle - each Pokemon is its own team
        teams = ratings.map(rating => [rating]);
        console.log(`🎯 [TRUESKILL_PROCESSOR] Pairs battle - 2 teams of 1`);
      } else if (battlePokemon.length === 3) {
        // Triplets battle - winners vs loser
        const winnerRatings = battlePokemon
          .filter(pokemon => winnerIds.includes(pokemon.id))
          .map(pokemon => getRating(pokemon.id.toString()));
        
        const loserRatings = battlePokemon
          .filter(pokemon => !winnerIds.includes(pokemon.id))
          .map(pokemon => getRating(pokemon.id.toString()));
        
        teams = [winnerRatings, loserRatings];
        console.log(`🎯 [TRUESKILL_PROCESSOR] Triplets battle - winners team vs loser team`);
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
          const oldRating = getRating(pokemon.id.toString());
          const newRating = newRatings[index][0];
          console.log(`🎯 [TRUESKILL_PROCESSOR] Updating ${pokemon.name} rating: μ ${oldRating.mu.toFixed(3)} → ${newRating.mu.toFixed(3)}, σ ${oldRating.sigma.toFixed(3)} → ${newRating.sigma.toFixed(3)}`);
          
          updateRating(pokemon.id.toString(), newRating);
          incrementBattleCount(pokemon.id.toString());
        });
      } else if (battlePokemon.length === 3) {
        // Triplets battle
        const winnerPokemon = battlePokemon.filter(pokemon => winnerIds.includes(pokemon.id));
        const loserPokemon = battlePokemon.filter(pokemon => !winnerIds.includes(pokemon.id));
        
        // Update winner ratings
        winnerPokemon.forEach((pokemon, index) => {
          const oldRating = getRating(pokemon.id.toString());
          const newRating = newRatings[0][index];
          console.log(`🎯 [TRUESKILL_PROCESSOR] Updating winner ${pokemon.name} rating: μ ${oldRating.mu.toFixed(3)} → ${newRating.mu.toFixed(3)}`);
          
          updateRating(pokemon.id.toString(), newRating);
          incrementBattleCount(pokemon.id.toString());
        });
        
        // Update loser ratings
        loserPokemon.forEach((pokemon, index) => {
          const oldRating = getRating(pokemon.id.toString());
          const newRating = newRatings[1][index];
          console.log(`🎯 [TRUESKILL_PROCESSOR] Updating loser ${pokemon.name} rating: μ ${oldRating.mu.toFixed(3)} → ${newRating.mu.toFixed(3)}`);
          
          updateRating(pokemon.id.toString(), newRating);
          incrementBattleCount(pokemon.id.toString());
        });
      }

      // CRITICAL: Increment total battle count
      console.log(`🎯 [TRUESKILL_PROCESSOR] Incrementing total battle count`);
      incrementTotalBattles();

      logStoreChange('BATTLE_COMPLETE', { 
        pokemon: battlePokemon.map(p => ({ id: p.id, name: p.name })),
        winners: winnerIds,
        newRatings: battlePokemon.map(p => {
          const rating = getRating(p.id.toString());
          return { id: p.id, name: p.name, mu: rating.mu, sigma: rating.sigma, battles: rating.battleCount };
        })
      });

      console.log(`🎯 [TRUESKILL_PROCESSOR] ✅ TrueSkill processing complete for battle`);
      
    } catch (error) {
      console.error(`🎯 [TRUESKILL_PROCESSOR] ❌ Error processing TrueSkill battle:`, error);
      logStoreChange('BATTLE_ERROR', { error: error.message });
      throw error;
    }
  }, [getRating, updateRating, incrementBattleCount, incrementTotalBattles, logStoreChange]);

  // Create the processResult function that other files expect
  const processResult = useCallback((
    selectedPokemonIds: number[],
    battleType: BattleType,
    currentBattle: Pokemon[]
  ) => {
    console.log(`🎯 [BATTLE_RESULT_PROCESSOR] Processing battle result:`, {
      selectedPokemonIds,
      battleType,
      currentBattle: currentBattle.map(p => `${p.name}(${p.id})`)
    });

    // Call the TrueSkill processor
    processBattleForTrueSkill(currentBattle, selectedPokemonIds);

    // Return a battle result object for compatibility
    return {
      battleType,
      pokemonIds: currentBattle.map(p => p.id),
      selectedPokemonIds,
      timestamp: new Date().toISOString()
    };
  }, [processBattleForTrueSkill]);

  return {
    processBattleForTrueSkill,
    processResult
  };
};
