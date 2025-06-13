
import { useCallback } from "react";
import { RankedPokemon } from "@/services/pokemon";
import { useBackgroundTrueSkillProcessor } from "@/hooks/ranking/useBackgroundTrueSkillProcessor";
import { arrayMove } from '@dnd-kit/sortable';

export const useBattleManualReorder = (
  finalRankings: RankedPokemon[],
  onRankingsUpdate: (updatedRankings: RankedPokemon[]) => void,
  isMilestoneView: boolean = false
) => {
  console.log(`🎯 [BATTLE_MANUAL_REORDER] ===== HOOK INITIALIZATION =====`);
  console.log(`🎯 [BATTLE_MANUAL_REORDER] finalRankings length: ${finalRankings?.length || 0}`);
  console.log(`🎯 [BATTLE_MANUAL_REORDER] isMilestoneView: ${isMilestoneView}`);

  // Use background processor for heavy TrueSkill operations
  const { queueBackgroundOperation } = useBackgroundTrueSkillProcessor();

  const handleManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    console.log(`🎯 [BATTLE_MANUAL_REORDER] ===== MANUAL REORDER CALLED =====`);
    console.log(`🎯 [BATTLE_MANUAL_REORDER] Pokemon ${draggedPokemonId} moved from ${sourceIndex} to ${destinationIndex}`);

    if (!finalRankings || finalRankings.length === 0) {
      return;
    }

    try {
      // Instant visual update using arrayMove
      const newRankings = arrayMove(finalRankings, sourceIndex, destinationIndex);
      
      // Update ranks for all Pokemon immediately
      const finalRankingsWithRanks = newRankings.map((pokemon, index) => ({
        ...pokemon,
        rank: index + 1
      }));

      // Update UI immediately
      onRankingsUpdate(finalRankingsWithRanks);
      
      // Queue heavy TrueSkill calculations for background processing
      queueBackgroundOperation(draggedPokemonId, sourceIndex, destinationIndex);
      
      console.log(`🎯 [BATTLE_MANUAL_REORDER] ✅ Instant visual reorder completed, TrueSkill queued for background`);
    } catch (error) {
      console.error(`🎯 [BATTLE_MANUAL_REORDER] ❌ Error in manual reorder:`, error);
    }
  }, [finalRankings, onRankingsUpdate, queueBackgroundOperation]);

  console.log(`🎯 [BATTLE_MANUAL_REORDER] Hook created, returning handleManualReorder function`);
  
  return { handleManualReorder };
};
