
import { useCallback } from "react";
import { RankedPokemon } from "@/services/pokemon";
import { useTrueSkillStore } from "@/stores/trueskillStore";

export const useEnhancedManualReorder = (
  finalRankings: RankedPokemon[],
  onRankingsUpdate: (updatedRankings: RankedPokemon[]) => void,
  preventAutoResorting: boolean = false
) => {
  console.log(`🎯 [ENHANCED_MANUAL_REORDER] ===== HOOK INITIALIZATION =====`);
  console.log(`🎯 [ENHANCED_MANUAL_REORDER] finalRankings length: ${finalRankings?.length || 0}`);
  console.log(`🎯 [ENHANCED_MANUAL_REORDER] preventAutoResorting: ${preventAutoResorting}`);
  console.log(`🎯 [ENHANCED_MANUAL_REORDER] onRankingsUpdate exists: ${!!onRankingsUpdate}`);

  const { forceScoreBetweenNeighbors, getAllRatings } = useTrueSkillStore();

  // Helper function to calculate score between neighbors
  const calculateScoreBetweenNeighbors = useCallback((
    higherNeighborScore: number | undefined,
    lowerNeighborScore: number | undefined
  ): number => {
    console.log(`🧮 [SCORE_CALCULATION] Higher: ${higherNeighborScore}, Lower: ${lowerNeighborScore}`);
    
    if (higherNeighborScore !== undefined && lowerNeighborScore !== undefined) {
      const midpoint = (higherNeighborScore + lowerNeighborScore) / 2;
      console.log(`🧮 [SCORE_CALCULATION] Midpoint between neighbors: ${midpoint}`);
      return midpoint;
    } else if (higherNeighborScore !== undefined) {
      const newScore = higherNeighborScore + 1.0;
      console.log(`🧮 [SCORE_CALCULATION] Above highest: ${newScore}`);
      return newScore;
    } else if (lowerNeighborScore !== undefined) {
      const newScore = lowerNeighborScore - 1.0;
      console.log(`🧮 [SCORE_CALCULATION] Below lowest: ${newScore}`);
      return newScore;
    } else {
      console.log(`🧮 [SCORE_CALCULATION] Default score: 25.0`);
      return 25.0; // Default TrueSkill rating
    }
  }, []);

  const handleEnhancedManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    console.log(`🎯 [ENHANCED_MANUAL_REORDER] ===== MANUAL REORDER START =====`);
    console.log(`🎯 [ENHANCED_MANUAL_REORDER] Pokemon ${draggedPokemonId} moved from ${sourceIndex} to ${destinationIndex}`);
    console.log(`🎯 [ENHANCED_MANUAL_REORDER] preventAutoResorting: ${preventAutoResorting}`);

    if (!finalRankings || finalRankings.length === 0) {
      console.error(`🎯 [ENHANCED_MANUAL_REORDER] ❌ No rankings available`);
      return;
    }

    try {
      // Create a working copy of the rankings
      const workingRankings = [...finalRankings];
      
      // Handle new Pokemon being added (sourceIndex === -1)
      if (sourceIndex === -1) {
        console.log(`🎯 [ENHANCED_MANUAL_REORDER] Adding new Pokemon ${draggedPokemonId} at position ${destinationIndex}`);
        
        const allRatings = getAllRatings();
        const pokemonRating = allRatings[draggedPokemonId.toString()];
        
        if (!pokemonRating) {
          console.error(`🎯 [ENHANCED_MANUAL_REORDER] ❌ No rating found for Pokemon ${draggedPokemonId}`);
          return;
        }

        // Create new Pokemon entry with current TrueSkill score
        const newPokemon: RankedPokemon = {
          id: draggedPokemonId,
          name: `Pokemon-${draggedPokemonId}`, // This will be updated by the parent
          image: '',
          types: [],
          score: pokemonRating.mu,
          rank: destinationIndex + 1
        };

        // Insert at destination
        workingRankings.splice(destinationIndex, 0, newPokemon);
        console.log(`🎯 [ENHANCED_MANUAL_REORDER] Inserted new Pokemon at index ${destinationIndex}`);
      } else {
        // Handle reordering existing Pokemon
        console.log(`🎯 [ENHANCED_MANUAL_REORDER] Reordering existing Pokemon`);
        
        // Remove from source position
        const [movedPokemon] = workingRankings.splice(sourceIndex, 1);
        console.log(`🎯 [ENHANCED_MANUAL_REORDER] Removed ${movedPokemon.name} from position ${sourceIndex}`);
        
        // Insert at destination position
        workingRankings.splice(destinationIndex, 0, movedPokemon);
        console.log(`🎯 [ENHANCED_MANUAL_REORDER] Inserted ${movedPokemon.name} at position ${destinationIndex}`);
      }

      // CRITICAL: Set the exact score for the moved Pokemon based on its new neighbors
      const higherNeighbor = destinationIndex > 0 ? workingRankings[destinationIndex - 1] : undefined;
      const lowerNeighbor = destinationIndex < workingRankings.length - 1 ? workingRankings[destinationIndex + 1] : undefined;
      
      const targetScore = calculateScoreBetweenNeighbors(
        higherNeighbor?.score,
        lowerNeighbor?.score
      );
      
      console.log(`🎯 [ENHANCED_MANUAL_REORDER] Setting exact score ${targetScore} for Pokemon ${draggedPokemonId}`);
      
      // Force the score in TrueSkill store
      forceScoreBetweenNeighbors(
        draggedPokemonId.toString(),
        higherNeighbor?.id.toString(),
        lowerNeighbor?.id.toString()
      );

      // Update the score in the working rankings
      workingRankings[destinationIndex].score = targetScore;

      // Update ranks for all Pokemon
      const finalRankingsWithRanks = workingRankings.map((pokemon, index) => ({
        ...pokemon,
        rank: index + 1
      }));

      console.log(`🎯 [ENHANCED_MANUAL_REORDER] ✅ Manual reorder completed successfully`);
      console.log(`🎯 [ENHANCED_MANUAL_REORDER] Final rankings length: ${finalRankingsWithRanks.length}`);
      
      // Update the rankings
      onRankingsUpdate(finalRankingsWithRanks);
      
    } catch (error) {
      console.error(`🎯 [ENHANCED_MANUAL_REORDER] ❌ Error during manual reorder:`, error);
    }
  }, [finalRankings, onRankingsUpdate, preventAutoResorting, forceScoreBetweenNeighbors, getAllRatings, calculateScoreBetweenNeighbors]);

  console.log(`🎯 [ENHANCED_MANUAL_REORDER] Hook created, returning handleEnhancedManualReorder function`);
  
  return { handleEnhancedManualReorder };
};
