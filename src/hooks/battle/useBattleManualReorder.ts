
import { useCallback } from "react";
import { RankedPokemon } from "@/services/pokemon";
import { useEnhancedManualReorder } from "./useEnhancedManualReorder";

export const useBattleManualReorder = (
  finalRankings: RankedPokemon[],
  onRankingsUpdate: (updatedRankings: RankedPokemon[]) => void,
  isMilestoneView: boolean = false
) => {
  console.log(`🎯 [BATTLE_MANUAL_REORDER] ===== HOOK INITIALIZATION =====`);
  console.log(`🎯 [BATTLE_MANUAL_REORDER] finalRankings length: ${finalRankings?.length || 0}`);
  console.log(`🎯 [BATTLE_MANUAL_REORDER] isMilestoneView: ${isMilestoneView}`);
  console.log(`🎯 [BATTLE_MANUAL_REORDER] onRankingsUpdate exists: ${!!onRankingsUpdate}`);

  // Use the enhanced manual reorder hook with preventAutoResorting set to true for milestone views
  const { handleEnhancedManualReorder } = useEnhancedManualReorder(
    finalRankings,
    onRankingsUpdate,
    isMilestoneView // Prevent auto-resorting during milestone views
  );

  const handleManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    console.log(`🎯 [BATTLE_MANUAL_REORDER] ===== MANUAL REORDER CALLED =====`);
    console.log(`🎯 [BATTLE_MANUAL_REORDER] Pokemon ${draggedPokemonId} moved from ${sourceIndex} to ${destinationIndex}`);
    console.log(`🎯 [BATTLE_MANUAL_REORDER] isMilestoneView: ${isMilestoneView}`);
    console.log(`🎯 [BATTLE_MANUAL_REORDER] Will prevent auto-resorting: ${isMilestoneView}`);

    if (!handleEnhancedManualReorder) {
      console.error(`🎯 [BATTLE_MANUAL_REORDER] ❌ No enhanced manual reorder function available!`);
      return;
    }

    try {
      console.log(`🎯 [BATTLE_MANUAL_REORDER] Calling enhanced manual reorder...`);
      handleEnhancedManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
      console.log(`🎯 [BATTLE_MANUAL_REORDER] ✅ Enhanced manual reorder completed`);
    } catch (error) {
      console.error(`🎯 [BATTLE_MANUAL_REORDER] ❌ Error in enhanced manual reorder:`, error);
    }
  }, [handleEnhancedManualReorder, isMilestoneView]);

  console.log(`🎯 [BATTLE_MANUAL_REORDER] Hook created, returning handleManualReorder function`);
  
  return { handleManualReorder };
};
