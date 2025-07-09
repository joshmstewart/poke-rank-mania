
import { useCallback } from "react";
import { RankedPokemon } from "@/services/pokemon";
import { useTrueSkillStore } from "@/stores/trueskillStore";

export const useEnhancedManualReorder = (
  finalRankings: RankedPokemon[],
  onRankingsUpdate: (updatedRankings: RankedPokemon[]) => void,
  preventAutoResorting: boolean = false
) => {
  const { forceScoreBetweenNeighbors, getAllRatings } = useTrueSkillStore();

  // Helper function to calculate score between neighbors
  const calculateScoreBetweenNeighbors = useCallback((
    higherNeighborScore: number | undefined,
    lowerNeighborScore: number | undefined
  ): number => {
    if (higherNeighborScore !== undefined && lowerNeighborScore !== undefined) {
      return (higherNeighborScore + lowerNeighborScore) / 2;
    } else if (higherNeighborScore !== undefined) {
      // Dropped at the end of the list, score should be lower than the neighbor above it
      return higherNeighborScore - 1.0;
    } else if (lowerNeighborScore !== undefined) {
      // Dropped at the beginning of the list, score should be higher than the neighbor below it
      return lowerNeighborScore + 1.0;
    } else {
      return 25.0; // Default TrueSkill rating
    }
  }, []);

  const handleEnhancedManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    console.log(`[REORDER_DEBUG] ===== MANUAL REORDER START =====`);
    console.log(`[REORDER_DEBUG] Pokemon ID: ${draggedPokemonId}, Source: ${sourceIndex}, Destination: ${destinationIndex}`);
    console.log(`[REORDER_DEBUG] Current rankings count: ${finalRankings?.length}`);
    
    if (!finalRankings) {
      console.log(`[REORDER_DEBUG] No finalRankings available, aborting`);
      return;
    }

    try {
      // Create a working copy of the rankings
      const workingRankings = [...finalRankings];
      console.log(`[REORDER_DEBUG] Working rankings created with ${workingRankings.length} items`);
      
      // Find the Pokemon in the current rankings
      const dragIdx = workingRankings.findIndex(p => p.id === draggedPokemonId);
      console.log(`[REORDER_DEBUG] Found Pokemon at index: ${dragIdx}`);
      
      if (dragIdx === -1) {
        console.warn(`[REORDER_DEBUG] Pokemon ${draggedPokemonId} not found in rankings! Available IDs:`, workingRankings.map(p => p.id));
        return;
      }
      
      // Handle new Pokemon being added (sourceIndex === -1)
      if (sourceIndex === -1) {
        console.log(`[REORDER_DEBUG] Adding new Pokemon to rankings`);
        const allRatings = getAllRatings();
        let pokemonRating = allRatings[draggedPokemonId.toString()];
        
        if (!pokemonRating) {
          // If rating doesn't exist, create a temporary default for processing.
          // It will be properly set by forceScoreBetweenNeighbors.
          pokemonRating = { mu: 25.0, sigma: 8.333, battleCount: 0, lastUpdated: Date.now() };
        }

        // Find the actual Pokemon data from existing rankings or create new entry
        let actualPokemonData = finalRankings.find(p => p.id === draggedPokemonId);
        
        if (!actualPokemonData) {
          const pokemonImageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${draggedPokemonId}.png`;
          const pokemonName = `Pokemon #${draggedPokemonId.toString().padStart(3, '0')}`;
          
          actualPokemonData = {
            id: draggedPokemonId,
            name: pokemonName,
            image: pokemonImageUrl,
            types: [],
            score: pokemonRating.mu,
            count: pokemonRating.battleCount || 0,
            confidence: 50,
            wins: 0,
            losses: 0,
            winRate: 0
          };
        }

        // Create new Pokemon entry
        const newPokemon: RankedPokemon = {
          ...actualPokemonData,
          score: pokemonRating.mu,
          count: pokemonRating.battleCount || 0,
          confidence: 50,
          wins: 0,
          losses: 0,
          winRate: 0
        };

        // Insert at destination
        workingRankings.splice(destinationIndex, 0, newPokemon);
        console.log(`[REORDER_DEBUG] Inserted new Pokemon at index ${destinationIndex}`);
      } else {
        // Handle reordering existing Pokemon
        console.log(`[REORDER_DEBUG] Reordering existing Pokemon from index ${sourceIndex} to ${destinationIndex}`);
        console.log(`[REORDER_DEBUG] Pokemon being moved:`, workingRankings[sourceIndex]?.name);
        
        const [movedPokemon] = workingRankings.splice(sourceIndex, 1);
        workingRankings.splice(destinationIndex, 0, movedPokemon);
        
        console.log(`[REORDER_DEBUG] After splice: Pokemon at destination index ${destinationIndex}:`, workingRankings[destinationIndex]?.name);
      }

      // Set the exact score for the moved Pokemon based on its new neighbors
      const higherNeighbor = destinationIndex > 0 ? workingRankings[destinationIndex - 1] : undefined;
      const lowerNeighbor = destinationIndex < workingRankings.length - 1 ? workingRankings[destinationIndex + 1] : undefined;
      
      console.log('[DEBUG] Neighbors found:', { higher: higherNeighbor?.name, lower: lowerNeighbor?.name });
      
      const targetScore = calculateScoreBetweenNeighbors(
        higherNeighbor?.score,
        lowerNeighbor?.score
      );
      
      console.log(`[DEBUG] Calculated target score: ${targetScore}`);

      // Force the score in TrueSkill store
      forceScoreBetweenNeighbors(
        draggedPokemonId.toString(),
        higherNeighbor?.id.toString(),
        lowerNeighbor?.id.toString()
      );

      // Update the score in the working rankings
      workingRankings[destinationIndex].score = targetScore;
      console.log(`[REORDER_DEBUG] Updated score for Pokemon at destination:`, workingRankings[destinationIndex].score);

      // Update ranks for all Pokemon
      const finalRankingsWithRanks = workingRankings.map((pokemon, index) => ({
        ...pokemon,
        rank: index + 1
      }));

      console.log(`[REORDER_DEBUG] Final rankings with ranks:`, finalRankingsWithRanks.map(p => ({ id: p.id, name: p.name, rank: p.rank, score: p.score })));

      // Update the rankings
      console.log(`[REORDER_DEBUG] Calling onRankingsUpdate with ${finalRankingsWithRanks.length} items`);
      onRankingsUpdate(finalRankingsWithRanks);
      console.log(`[REORDER_DEBUG] ===== MANUAL REORDER COMPLETE =====`);
      
    } catch (error) {
      console.error('[REORDER_DEBUG] Error during manual reorder:', error);
      console.error('[REORDER_DEBUG] Error stack:', error.stack);
    }
  }, [finalRankings, onRankingsUpdate, preventAutoResorting, forceScoreBetweenNeighbors, getAllRatings, calculateScoreBetweenNeighbors]);

  return { handleEnhancedManualReorder };
};
