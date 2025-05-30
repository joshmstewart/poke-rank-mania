
import { useCallback } from "react";
import { RankedPokemon } from "@/services/pokemon";
import { useEnhancedManualReorder } from "./useEnhancedManualReorder";

export const useBattleManualReorder = (
  finalRankings: RankedPokemon[],
  onRankingsUpdate: (updatedRankings: RankedPokemon[]) => void
) => {
  const { handleEnhancedManualReorder } = useEnhancedManualReorder(
    finalRankings,
    onRankingsUpdate
  );

  const handleManualReorder = useCallback((
    draggedPokemonId: number, 
    sourceIndex: number, 
    destinationIndex: number
  ) => {
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ENHANCED] Enhanced manual reorder started`);
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ENHANCED] Pokemon: ${draggedPokemonId}, ${sourceIndex} → ${destinationIndex}`);
    
    // Use the enhanced reorder logic
    handleEnhancedManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
    
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ENHANCED] Enhanced manual reorder completed`);
  }, [handleEnhancedManualReorder]);

  return { handleManualReorder };
};
