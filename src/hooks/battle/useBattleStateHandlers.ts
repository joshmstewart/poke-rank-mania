
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";

export const useBattleStateHandlers = (
  allPokemon: Pokemon[],
  originalProcessBattleResult: any,
  finalRankings: any[]
) => {
  // Use the shared refinement queue
  const refinementQueue = useSharedRefinementQueue();

  // Handle manual reordering by generating refinement battles
  const handleManualReorder = useCallback((
    draggedPokemonId: number, 
    sourceIndex: number, 
    destinationIndex: number
  ) => {
    console.log(`🔄 [MANUAL_REORDER_HANDLER] Pokemon ${draggedPokemonId} moved from ${sourceIndex} to ${destinationIndex}`);
    
    // Get neighboring Pokemon IDs around the new position for validation battles
    const neighborIds: number[] = [];
    
    // Add Pokemon before the new position
    if (destinationIndex > 0 && finalRankings[destinationIndex - 1]) {
      neighborIds.push(finalRankings[destinationIndex - 1].id);
    }
    
    // Add Pokemon after the new position
    if (destinationIndex < finalRankings.length - 1 && finalRankings[destinationIndex + 1]) {
      neighborIds.push(finalRankings[destinationIndex + 1].id);
    }
    
    // Queue refinement battles for this manual reorder with correct parameters
    refinementQueue.queueBattlesForReorder(
      draggedPokemonId,
      neighborIds,
      destinationIndex
    );
    
    console.log(`✅ [MANUAL_REORDER_HANDLER] Queued refinement battles for Pokemon ${draggedPokemonId}`);
    console.log(`📊 [MANUAL_REORDER_HANDLER] Total refinement battles in queue: ${refinementQueue.refinementBattleCount}`);
  }, [refinementQueue, finalRankings]);

  // Handle battle completion - enhanced with refinement processing
  const processBattleResultWithRefinement = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    console.log(`⚔️ [BATTLE_RESULT_PROCESSING] ===== BATTLE RESULT PROCESSING =====`);
    console.log(`⚔️ [BATTLE_RESULT_PROCESSING] Selected Pokemon IDs: ${selectedPokemonIds.join(', ')}`);
    console.log(`⚔️ [BATTLE_RESULT_PROCESSING] Current battle Pokemon: ${currentBattlePokemon.map(p => `${p.name} (${p.id})`).join(', ')}`);
    console.log(`⚔️ [BATTLE_RESULT_PROCESSING] Battle type: ${battleType}`);
    
    // Check if this was a refinement battle
    const nextRefinement = refinementQueue.getNextRefinementBattle();
    if (nextRefinement && 
        currentBattlePokemon.some(p => p.id === nextRefinement.primaryPokemonId) &&
        currentBattlePokemon.some(p => p.id === nextRefinement.opponentPokemonId)) {
      console.log(`⚔️ [REFINEMENT_BATTLE_COMPLETED] Completed refinement battle for Pokemon ${nextRefinement.primaryPokemonId} vs ${nextRefinement.opponentPokemonId}`);
      // Pop the completed refinement battle
      refinementQueue.popRefinementBattle();
    }
    
    console.log(`⚔️ [BATTLE_RESULT_PROCESSING] ===== END BATTLE RESULT PROCESSING =====`);
    
    // Call original battle processing
    return originalProcessBattleResult(selectedPokemonIds, currentBattlePokemon, battleType, selectedGeneration);
  }, [originalProcessBattleResult, refinementQueue]);

  return {
    processBattleResultWithRefinement,
    handleManualReorder,
    pendingRefinements: new Set(refinementQueue.refinementQueue.map(r => r.primaryPokemonId)),
    refinementBattleCount: refinementQueue.refinementBattleCount,
    clearRefinementQueue: refinementQueue.clearRefinementQueue
  };
};
