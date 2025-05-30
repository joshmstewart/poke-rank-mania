
import { useState, useCallback, useEffect } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { Rating, rate_1vs1 } from "ts-trueskill";
import { useImpliedBattleTracker } from "@/contexts/ImpliedBattleTracker";

export interface UnifiedRankingState {
  allRankedPokemon: RankedPokemon[];
  unrankedPokemon: Pokemon[];
  isLoading: boolean;
}

export const useUnifiedTrueSkillRankings = (allPokemon: Pokemon[]) => {
  const [allRankedPokemon, setAllRankedPokemon] = useState<RankedPokemon[]>([]);
  const [unrankedPokemon, setUnrankedPokemon] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addImpliedBattle } = useImpliedBattleTracker();

  console.log(`🏆 [UNIFIED_RANKINGS] ===== UNIFIED TRUESKILL RANKINGS HOOK =====`);
  console.log(`🏆 [UNIFIED_RANKINGS] Total Pokemon: ${allPokemon.length}`);

  // Initialize rankings from Pokemon data
  const initializeRankings = useCallback(() => {
    console.log(`🏆 [UNIFIED_RANKINGS] Initializing rankings...`);
    
    const ranked: RankedPokemon[] = [];
    const unranked: Pokemon[] = [];

    allPokemon.forEach(pokemon => {
      if (pokemon.rating && pokemon.rating instanceof Rating) {
        // Pokemon has TrueSkill rating - add to ranked list
        const conservativeScore = pokemon.rating.mu - 3 * pokemon.rating.sigma;
        const confidence = Math.max(0, Math.min(100, 100 * (1 - (pokemon.rating.sigma / 8.33))));
        
        const rankedPokemon: RankedPokemon = {
          ...pokemon,
          score: conservativeScore,
          confidence: confidence,
          count: 0, // Will be calculated from battle history if needed
          wins: 0,
          losses: 0,
          winRate: 0
        };
        
        ranked.push(rankedPokemon);
        console.log(`🏆 [UNIFIED_RANKINGS] Added ranked: ${pokemon.name} (score: ${conservativeScore.toFixed(3)})`);
      } else {
        // Pokemon has no TrueSkill rating - add to unranked list
        unranked.push(pokemon);
      }
    });

    // Sort ranked Pokemon by their conservative TrueSkill score
    ranked.sort((a, b) => b.score - a.score);
    
    console.log(`🏆 [UNIFIED_RANKINGS] Initialization complete:`);
    console.log(`🏆 [UNIFIED_RANKINGS] - Ranked Pokemon: ${ranked.length}`);
    console.log(`🏆 [UNIFIED_RANKINGS] - Unranked Pokemon: ${unranked.length}`);
    
    setAllRankedPokemon(ranked);
    setUnrankedPokemon(unranked);
  }, [allPokemon]);

  // Add Pokemon to rankings (from unranked to ranked)
  const addPokemonToRankings = useCallback((pokemon: Pokemon, targetIndex: number) => {
    console.log(`🏆 [UNIFIED_RANKINGS] ===== ADDING POKEMON TO RANKINGS =====`);
    console.log(`🏆 [UNIFIED_RANKINGS] Pokemon: ${pokemon.name} at index ${targetIndex}`);

    // Initialize TrueSkill rating if not present
    if (!pokemon.rating) {
      pokemon.rating = new Rating(); // Default mu=25, sigma≈8.33
      console.log(`🏆 [UNIFIED_RANKINGS] Initialized TrueSkill rating for ${pokemon.name}`);
    }

    // Create ranked version
    const conservativeScore = pokemon.rating.mu - 3 * pokemon.rating.sigma;
    const confidence = Math.max(0, Math.min(100, 100 * (1 - (pokemon.rating.sigma / 8.33))));
    
    const rankedPokemon: RankedPokemon = {
      ...pokemon,
      score: conservativeScore,
      confidence: confidence,
      count: 0,
      wins: 0,
      losses: 0,
      winRate: 0
    };

    // Insert at target position
    const newRanked = [...allRankedPokemon];
    newRanked.splice(targetIndex, 0, rankedPokemon);

    // Remove from unranked
    const newUnranked = unrankedPokemon.filter(p => p.id !== pokemon.id);

    // Apply TrueSkill updates for this positioning
    processManualRankingUpdate(rankedPokemon.id, targetIndex, newRanked);

    setAllRankedPokemon(newRanked);
    setUnrankedPokemon(newUnranked);
  }, [allRankedPokemon, unrankedPokemon, addImpliedBattle]);

  // Reorder Pokemon within rankings
  const reorderPokemon = useCallback((draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🏆 [UNIFIED_RANKINGS] ===== REORDERING POKEMON =====`);
    console.log(`🏆 [UNIFIED_RANKINGS] Pokemon ${draggedPokemonId}: ${sourceIndex} → ${destinationIndex}`);

    const newRanked = [...allRankedPokemon];
    const [movedPokemon] = newRanked.splice(sourceIndex, 1);
    newRanked.splice(destinationIndex, 0, movedPokemon);

    // Apply TrueSkill updates for this repositioning
    processManualRankingUpdate(draggedPokemonId, destinationIndex, newRanked);

    setAllRankedPokemon(newRanked);
  }, [allRankedPokemon, addImpliedBattle]);

  // Process TrueSkill updates for manual ranking changes
  const processManualRankingUpdate = useCallback((draggedPokemonId: number, newIndex: number, updatedRankings: RankedPokemon[]) => {
    console.log(`🏆 [UNIFIED_RANKINGS] ===== PROCESSING TRUESKILL UPDATES =====`);
    
    const draggedPokemon = updatedRankings.find(p => p.id === draggedPokemonId);
    if (!draggedPokemon) {
      console.error(`🏆 [UNIFIED_RANKINGS] Dragged Pokemon ${draggedPokemonId} not found`);
      return;
    }

    const N = updatedRankings.length;
    const impliedBattles: Array<{ opponent: RankedPokemon; draggedWins: boolean; battleType: string; frequency: number }> = [];

    // P_above_1: immediate neighbor above (dragged loses) - 2x weight
    if (newIndex > 0) {
      const p_above_1 = updatedRankings[newIndex - 1];
      if (p_above_1 && p_above_1.id !== draggedPokemonId) {
        impliedBattles.push({
          opponent: p_above_1,
          draggedWins: false,
          battleType: "P_above_1",
          frequency: 2
        });
      }
    }

    // P_above_2: secondary neighbor above (dragged loses) - 1x weight
    if (newIndex > 1) {
      const p_above_2 = updatedRankings[newIndex - 2];
      if (p_above_2 && p_above_2.id !== draggedPokemonId) {
        impliedBattles.push({
          opponent: p_above_2,
          draggedWins: false,
          battleType: "P_above_2",
          frequency: 1
        });
      }
    }

    // P_below_1: immediate neighbor below (dragged wins) - 2x weight
    if (newIndex < N - 1) {
      const p_below_1 = updatedRankings[newIndex + 1];
      if (p_below_1 && p_below_1.id !== draggedPokemonId) {
        impliedBattles.push({
          opponent: p_below_1,
          draggedWins: true,
          battleType: "P_below_1",
          frequency: 2
        });
      }
    }

    // P_below_2: secondary neighbor below (dragged wins) - 1x weight
    if (newIndex < N - 2) {
      const p_below_2 = updatedRankings[newIndex + 2];
      if (p_below_2 && p_below_2.id !== draggedPokemonId) {
        impliedBattles.push({
          opponent: p_below_2,
          draggedWins: true,
          battleType: "P_below_2",
          frequency: 1
        });
      }
    }

    console.log(`🏆 [UNIFIED_RANKINGS] Processing ${impliedBattles.length} battle types for ${draggedPokemon.name}`);

    // Apply TrueSkill updates
    impliedBattles.forEach(({ opponent, draggedWins, battleType, frequency }) => {
      // Ensure both Pokemon have valid TrueSkill ratings
      if (!draggedPokemon.rating) draggedPokemon.rating = new Rating();
      if (!opponent.rating) opponent.rating = new Rating();

      for (let i = 0; i < frequency; i++) {
        const [newWinnerRating, newLoserRating] = draggedWins
          ? rate_1vs1(draggedPokemon.rating, opponent.rating)
          : rate_1vs1(opponent.rating, draggedPokemon.rating);

        if (draggedWins) {
          draggedPokemon.rating = newWinnerRating;
          opponent.rating = newLoserRating;
        } else {
          opponent.rating = newWinnerRating;
          draggedPokemon.rating = newLoserRating;
        }

        // Log to implied battle tracker
        addImpliedBattle({
          draggedPokemon: draggedPokemon.name,
          opponent: opponent.name,
          winner: draggedWins ? draggedPokemon.name : opponent.name,
          battleType: `${battleType} (unified ranking update ${i + 1}/${frequency})`
        });

        console.log(`🏆 [UNIFIED_RANKINGS] Update ${i + 1}/${frequency}: ${draggedPokemon.name} vs ${opponent.name} - ${draggedWins ? 'dragged wins' : 'opponent wins'}`);
      }
    });

    // Recalculate scores and re-sort
    updatedRankings.forEach(pokemon => {
      if (pokemon.rating) {
        const conservativeScore = pokemon.rating.mu - 3 * pokemon.rating.sigma;
        pokemon.score = conservativeScore;
        pokemon.confidence = Math.max(0, Math.min(100, 100 * (1 - (pokemon.rating.sigma / 8.33))));
      }
    });

    updatedRankings.sort((a, b) => b.score - a.score);
    console.log(`🏆 [UNIFIED_RANKINGS] TrueSkill updates complete and rankings re-sorted`);
  }, [addImpliedBattle]);

  // Update rankings from external battle results
  const updateFromBattleResults = useCallback((updatedPokemon: RankedPokemon[]) => {
    console.log(`🏆 [UNIFIED_RANKINGS] Updating from external battle results: ${updatedPokemon.length} Pokemon`);
    setAllRankedPokemon(updatedPokemon);
  }, []);

  // Initialize on mount and when allPokemon changes
  useEffect(() => {
    initializeRankings();
  }, [initializeRankings]);

  return {
    allRankedPokemon,
    unrankedPokemon,
    isLoading,
    addPokemonToRankings,
    reorderPokemon,
    updateFromBattleResults,
    refreshRankings: initializeRankings
  };
};
