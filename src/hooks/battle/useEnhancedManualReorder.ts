
import { useCallback } from "react";
import { RankedPokemon } from "@/services/pokemon";

export const useEnhancedManualReorder = (
  finalRankings: RankedPokemon[],
  onRankingsUpdate: (updatedRankings: RankedPokemon[]) => void,
  preventAutoResorting: boolean = false
) => {
  console.log(`🎯 [ENHANCED_MANUAL_REORDER] ===== HOOK INITIALIZATION =====`);
  console.log(`🎯 [ENHANCED_MANUAL_REORDER] finalRankings length: ${finalRankings?.length || 0}`);
  console.log(`🎯 [ENHANCED_MANUAL_REORDER] preventAutoResorting: ${preventAutoResorting}`);

  const handleEnhancedManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    console.log(`🎯 [ENHANCED_MANUAL_REORDER] ===== MANUAL REORDER CALLED =====`);
    console.log(`🎯 [ENHANCED_MANUAL_REORDER] Pokemon ${draggedPokemonId} moved from ${sourceIndex} to ${destinationIndex}`);
    console.log(`🎯 [ENHANCED_MANUAL_REORDER] preventAutoResorting: ${preventAutoResorting}`);

    if (!finalRankings || finalRankings.length === 0) {
      console.error(`🎯 [ENHANCED_MANUAL_REORDER] ❌ No rankings to reorder!`);
      return;
    }

    // CRITICAL FIX: Preserve the exact Pokemon objects without any modifications
    const newRankings = [...finalRankings];
    
    // Log the original Pokemon name for debugging
    const draggedPokemon = newRankings.find(p => p.id === draggedPokemonId);
    if (draggedPokemon) {
      console.log(`🎯 [ENHANCED_MANUAL_REORDER] Original Pokemon name: "${draggedPokemon.name}"`);
    }

    // Perform the reorder
    const [removed] = newRankings.splice(sourceIndex, 1);
    newRankings.splice(destinationIndex, 0, removed);

    // CRITICAL: Log the Pokemon name after reorder to ensure no changes
    const reorderedPokemon = newRankings[destinationIndex];
    if (reorderedPokemon) {
      console.log(`🎯 [ENHANCED_MANUAL_REORDER] Reordered Pokemon name: "${reorderedPokemon.name}"`);
      
      // Verify name preservation
      if (draggedPokemon && reorderedPokemon.name !== draggedPokemon.name) {
        console.error(`🎯 [ENHANCED_MANUAL_REORDER] ❌ NAME CHANGED DURING REORDER!`);
        console.error(`🎯 [ENHANCED_MANUAL_REORDER] Original: "${draggedPokemon.name}", New: "${reorderedPokemon.name}"`);
      }
    }

    console.log(`🎯 [ENHANCED_MANUAL_REORDER] ✅ Reorder completed, calling onRankingsUpdate`);
    
    // Pass the reordered rankings with preserved names
    onRankingsUpdate(newRankings);
    
  }, [finalRankings, onRankingsUpdate, preventAutoResorting]);

  return { handleEnhancedManualReorder };
};
