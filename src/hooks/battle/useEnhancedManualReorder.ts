import { useCallback } from "react";
import { RankedPokemon } from "@/services/pokemon";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { toast } from "@/hooks/use-toast";

export const useEnhancedManualReorder = (
  finalRankings: RankedPokemon[],
  onRankingsUpdate: (updatedRankings: RankedPokemon[]) => void,
  preventAutoResorting: boolean = false
) => {
  console.log(`🎯 [ENHANCED_MANUAL_REORDER] ===== HOOK INITIALIZATION =====`);
  console.log(`🎯 [ENHANCED_MANUAL_REORDER] finalRankings length: ${finalRankings?.length || 0}`);
  console.log(`🎯 [ENHANCED_MANUAL_REORDER] preventAutoResorting: ${preventAutoResorting}`);
  console.log(`🎯 [ENHANCED_MANUAL_REORDER] onRankingsUpdate exists: ${!!onRankingsUpdate}`);

  const { forceScoreBetweenNeighbors, getAllRatings, getRating } = useTrueSkillStore();

  // Helper function to calculate score between neighbors with CORRECTED direction
  const calculateScoreBetweenNeighbors = useCallback((
    higherRankNeighborScore: number | undefined, // Pokemon with BETTER rank (lower index, higher score)
    lowerRankNeighborScore: number | undefined   // Pokemon with WORSE rank (higher index, lower score)
  ): number => {
    console.log(`🧮 [SCORE_CALCULATION] Higher rank neighbor score: ${higherRankNeighborScore}, Lower rank neighbor score: ${lowerRankNeighborScore}`);
    
    if (higherRankNeighborScore !== undefined && lowerRankNeighborScore !== undefined) {
      // FIXED: Place between the two neighbors
      const midpoint = (higherRankNeighborScore + lowerRankNeighborScore) / 2;
      console.log(`🧮 [SCORE_CALCULATION] Midpoint between neighbors: ${midpoint}`);
      return midpoint;
    } else if (higherRankNeighborScore !== undefined) {
      // FIXED: Moving to position 0 (best rank) - score should be HIGHER than current best
      const newScore = higherRankNeighborScore + 1.0;
      console.log(`🧮 [SCORE_CALCULATION] New best position score: ${newScore}`);
      return newScore;
    } else if (lowerRankNeighborScore !== undefined) {
      // FIXED: Moving to last position (worst rank) - score should be LOWER than current worst
      const newScore = lowerRankNeighborScore - 1.0;
      console.log(`🧮 [SCORE_CALCULATION] New worst position score: ${newScore}`);
      return newScore;
    } else {
      console.log(`🧮 [SCORE_CALCULATION] Default score: 25.0`);
      return 25.0; // Default TrueSkill rating
    }
  }, []);

  const handleEnhancedManualReorder = useCallback(async (
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

        // Find the actual Pokemon data from existing rankings to get proper name and image
        let actualPokemonData = finalRankings.find(p => p.id === draggedPokemonId);
        
        // If not found, create a basic Pokemon object
        if (!actualPokemonData) {
          console.log(`🎯 [ENHANCED_MANUAL_REORDER] Pokemon ${draggedPokemonId} not found in existing rankings, creating new entry`);
          
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

        // Create new Pokemon entry with proper data
        const newPokemon: RankedPokemon = {
          ...actualPokemonData,
          score: pokemonRating.mu,
          count: pokemonRating.battleCount || 0,
          confidence: 50,
          wins: 0,
          losses: 0,
          winRate: 0
        };

        console.log(`🎯 [ENHANCED_MANUAL_REORDER] Created Pokemon entry:`, {
          id: newPokemon.id,
          name: newPokemon.name,
          image: newPokemon.image,
          score: newPokemon.score
        });

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

      // CRITICAL FIX: Set the exact score for the moved Pokemon based on its new neighbors
      // Note: rankings are ordered by score (highest to lowest), so index 0 = best rank = highest score
      const higherRankNeighbor = destinationIndex > 0 ? workingRankings[destinationIndex - 1] : undefined; // Better rank (higher score)
      const lowerRankNeighbor = destinationIndex < workingRankings.length - 1 ? workingRankings[destinationIndex + 1] : undefined; // Worse rank (lower score)
      
      console.log(`🎯 [ENHANCED_MANUAL_REORDER] Neighbors - Higher rank: ${higherRankNeighbor?.name} (${higherRankNeighbor?.score}), Lower rank: ${lowerRankNeighbor?.name} (${lowerRankNeighbor?.score})`);
      
      // FIXED: Force the score in TrueSkill store FIRST and wait for it
      await new Promise<void>((resolve) => {
        forceScoreBetweenNeighbors(
          draggedPokemonId.toString(),
          higherRankNeighbor?.id.toString(),
          lowerRankNeighbor?.id.toString()
        );
        // Give the store a moment to update
        setTimeout(resolve, 50);
      });

      // FIXED: Get the actual updated score from the store
      const updatedRating = getRating(draggedPokemonId.toString());
      const finalScore = updatedRating.mu;
      
      console.log(`🎯 [ENHANCED_MANUAL_REORDER] Updated score from store: ${finalScore} for Pokemon ${draggedPokemonId}`);

      // Update the score in the working rankings
      workingRankings[destinationIndex].score = finalScore;

      // Add rank property for display purposes
      const finalRankingsWithRanks = workingRankings.map((pokemon, index) => ({
        ...pokemon,
        rank: index + 1
      }));

      console.log(`🎯 [ENHANCED_MANUAL_REORDER] ✅ Manual reorder completed successfully`);
      console.log(`🎯 [ENHANCED_MANUAL_REORDER] Final rankings length: ${finalRankingsWithRanks.length}`);
      
      // Update the rankings
      onRankingsUpdate(finalRankingsWithRanks);

      // Show success toast
      const movedPokemon = finalRankingsWithRanks[destinationIndex];
      toast({
        title: "Ranking Updated",
        description: `${movedPokemon.name} moved to position ${destinationIndex + 1}`,
        duration: 2000
      });
      
    } catch (error) {
      console.error(`🎯 [ENHANCED_MANUAL_REORDER] ❌ Error during manual reorder:`, error);
      
      // Show error toast
      toast({
        title: "Reorder Failed",
        description: "Failed to update Pokemon ranking. Please try again.",
        variant: "destructive",
        duration: 3000
      });
      
      // Note: No need to rollback since we're working with a copy
      // The original rankings remain unchanged if this function fails
    }
  }, [finalRankings, onRankingsUpdate, preventAutoResorting, forceScoreBetweenNeighbors, getAllRatings, getRating, calculateScoreBetweenNeighbors]);

  console.log(`🎯 [ENHANCED_MANUAL_REORDER] Hook created, returning handleEnhancedManualReorder function`);
  
  return { handleEnhancedManualReorder };
};
