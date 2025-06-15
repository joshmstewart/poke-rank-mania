
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
    console.log(`[DEBUG] Reordering pokemon ${draggedPokemonId} from ${sourceIndex} to ${destinationIndex}. Current rankings count: ${finalRankings?.length}`);
    if (!finalRankings) {
      return;
    }

    try {
      // Create a working copy of the rankings
      const workingRankings = [...finalRankings];
      
      // Handle new Pokemon being added (sourceIndex === -1)
      if (sourceIndex === -1) {
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
      } else {
        // Handle reordering existing Pokemon
        const [movedPokemon] = workingRankings.splice(sourceIndex, 1);
        workingRankings.splice(destinationIndex, 0, movedPokemon);
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

      // Update ranks for all Pokemon
      const finalRankingsWithRanks = workingRankings.map((pokemon, index) => ({
        ...pokemon,
        rank: index + 1
      }));

      // Update the rankings
      onRankingsUpdate(finalRankingsWithRanks);
      
    } catch (error) {
      // Only log errors, not debug info
      console.error('Error during manual reorder:', error);
    }
  }, [finalRankings, onRankingsUpdate, preventAutoResorting, forceScoreBetweenNeighbors, getAllRatings, calculateScoreBetweenNeighbors]);

  return { handleEnhancedManualReorder };
};
