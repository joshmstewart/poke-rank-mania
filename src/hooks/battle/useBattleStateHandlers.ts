
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";

export const useBattleStateHandlers = (
  allPokemon: Pokemon[],
  originalProcessBattleResult: any,
  finalRankings: any[]
) => {
  const refinementQueue = useSharedRefinementQueue();

  // Handle manual reordering
  const handleManualReorder = useCallback((draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🔄 [MANUAL_REORDER] Handling reorder for Pokemon ${draggedPokemonId}: ${sourceIndex} → ${destinationIndex}`);
    
    // Calculate neighbor Pokemon IDs for validation battles
    const neighbors: number[] = [];
    const rankings = finalRankings || [];
    
    // Add Pokemon above and below the new position
    if (destinationIndex > 0 && rankings[destinationIndex - 1]) {
      neighbors.push(rankings[destinationIndex - 1].id);
    }
    if (destinationIndex < rankings.length - 1 && rankings[destinationIndex + 1]) {
      neighbors.push(rankings[destinationIndex + 1].id);
    }
    
    // Also add a few more nearby Pokemon for more thorough validation
    if (destinationIndex > 1 && rankings[destinationIndex - 2]) {
      neighbors.push(rankings[destinationIndex - 2].id);
    }
    if (destinationIndex < rankings.length - 2 && rankings[destinationIndex + 2]) {
      neighbors.push(rankings[destinationIndex + 2].id);
    }
    
    // Queue refinement battles - this is where the drag action creates future battles
    refinementQueue.queueBattlesForReorder(draggedPokemonId, neighbors, destinationIndex + 1);
    
    console.log(`🔄 [MANUAL_REORDER] Queued validation battles with neighbors: ${neighbors.join(', ')}`);
    console.log(`🔄 [MANUAL_REORDER] Next battle will prioritize these validation battles`);
  }, [finalRankings, refinementQueue]);

  // Handle battle completion to pop refinement battles from queue
  const processBattleResultWithRefinement = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    console.log(`⚔️ [REFINEMENT_COMPLETION] Processing battle result...`);
    console.log(`⚔️ [REFINEMENT_COMPLETION] Current battle Pokemon IDs: ${currentBattlePokemon.map(p => p.id).join(', ')}`);
    console.log(`⚔️ [REFINEMENT_COMPLETION] Has refinement battles: ${refinementQueue.hasRefinementBattles}`);
    console.log(`⚔️ [REFINEMENT_COMPLETION] Refinement queue count: ${refinementQueue.refinementBattleCount}`);
    
    // Check if this was a refinement battle before processing
    if (refinementQueue.hasRefinementBattles && currentBattlePokemon.length === 2) {
      const currentRefinement = refinementQueue.getNextRefinementBattle();
      
      if (currentRefinement) {
        const battlePokemonIds = currentBattlePokemon.map(p => p.id).sort((a, b) => a - b);
        const refinementIds = [currentRefinement.primaryPokemonId, currentRefinement.opponentPokemonId].sort((a, b) => a - b);
        
        console.log(`⚔️ [REFINEMENT_COMPLETION] Comparing battle IDs [${battlePokemonIds.join(', ')}] with refinement IDs [${refinementIds.join(', ')}]`);
        
        // Check if this battle matches the current refinement battle
        if (battlePokemonIds[0] === refinementIds[0] && battlePokemonIds[1] === refinementIds[1]) {
          console.log(`⚔️ [REFINEMENT_COMPLETION] ✅ This was a refinement battle! Popping from queue`);
          console.log(`⚔️ [REFINEMENT_COMPLETION] Reason: ${currentRefinement.reason}`);
          refinementQueue.popRefinementBattle();
          console.log(`⚔️ [REFINEMENT_COMPLETION] Remaining refinement battles: ${refinementQueue.refinementBattleCount - 1}`);
        } else {
          console.log(`⚔️ [REFINEMENT_COMPLETION] ❌ Battle IDs don't match, not a refinement battle`);
        }
      } else {
        console.log(`⚔️ [REFINEMENT_COMPLETION] ❌ No current refinement battle found`);
      }
    } else {
      console.log(`⚔️ [REFINEMENT_COMPLETION] ❌ Not a refinement battle (hasRefinements: ${refinementQueue.hasRefinementBattles}, battleLength: ${currentBattlePokemon.length})`);
    }
    
    // Call original battle processing
    return originalProcessBattleResult(selectedPokemonIds, currentBattlePokemon, battleType, selectedGeneration);
  }, [originalProcessBattleResult, refinementQueue]);

  return {
    handleManualReorder,
    processBattleResultWithRefinement,
    pendingRefinements: new Set(refinementQueue.refinementQueue.map(b => b.primaryPokemonId)),
    refinementBattleCount: refinementQueue.refinementBattleCount,
    clearRefinementQueue: refinementQueue.clearRefinementQueue
  };
};
