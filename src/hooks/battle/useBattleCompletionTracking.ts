
import { useCallback, useEffect } from "react";

export const useBattleCompletionTracking = () => {
  // Track when a user actually completes a battle (makes a selection)
  const handleBattleCompleted = useCallback((selectedPokemonIds: number[], currentBattle: any[]) => {
    console.log(`🏁 [BATTLE_COMPLETION] User completed battle with selection:`, selectedPokemonIds);
    console.log(`🏁 [BATTLE_COMPLETION] Battle participants:`, currentBattle.map(p => `${p.name}(${p.id})`));
    
    // Check if this was a refinement battle by looking at the participants
    const battleParticipantIds = currentBattle.map(p => p.id);
    
    // Dispatch the actual completion event now that user made their choice
    const completionEvent = new CustomEvent('actual-battle-completed', {
      detail: { 
        pokemonIds: battleParticipantIds,
        selectedPokemonIds: selectedPokemonIds,
        timestamp: new Date().toISOString()
      }
    });
    document.dispatchEvent(completionEvent);
    
    console.log(`🏁 [BATTLE_COMPLETION] Dispatched actual-battle-completed event for Pokemon: [${battleParticipantIds.join(', ')}]`);
  }, []);

  return {
    handleBattleCompleted
  };
};
