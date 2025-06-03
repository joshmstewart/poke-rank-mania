
import { useCallback } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { Rating } from 'ts-trueskill';
import { RankedPokemon } from '@/services/pokemon';

// EXPLICIT NOTE: "Implied Battles" logic has been permanently removed.
// EXPLICIT NOTE: Immediate TrueSkill updates have been explicitly removed from drag-and-drop.
// This hook is now deprecated for manual reordering operations.
export const useBattleSimulation = () => {
  const { updateRating, getRating } = useTrueSkillStore();

  const simulateBattlesForReorder = useCallback((
    reorderedRankings: RankedPokemon[],
    movedPokemon: RankedPokemon,
    oldIndex: number,
    newIndex: number
  ) => {
    console.log(`🎲 [BATTLE_SIM] EXPLICIT NOTE: TrueSkill updates explicitly disabled for manual reordering`);
    console.log(`🎲 [BATTLE_SIM] Manual drag-and-drop explicitly manages μ and σ directly now`);
    console.log(`🎲 [BATTLE_SIM] Returning 0 battles simulated - no immediate updates applied`);
    
    // EXPLICITLY removed immediate TrueSkill updates.
    // Manual drag-and-drop explicitly manages μ and σ directly now.
    
    /*
    // EXPLICITLY COMMENTED OUT - was causing immediate score updates
    let battlesSimulated = 0;
    const maxBattles = Math.min(10, Math.abs(newIndex - oldIndex));
    
    if (newIndex < oldIndex) {
      // Pokemon moved up - it should beat Pokemon it moved past
      console.log('🎲 [BATTLE_SIM] Pokemon moved UP - applying direct rating increases');
      const endIndex = Math.min(oldIndex, newIndex + maxBattles);
      
      for (let i = newIndex; i < endIndex && battlesSimulated < maxBattles; i++) {
        const opponent = reorderedRankings[i + 1];
        if (opponent && opponent.id !== movedPokemon.id) {
          const winnerRating = getRating(movedPokemon.id.toString());
          const loserRating = getRating(opponent.id.toString());
          
          const ratingChange = 1.0;
          
          const newWinnerRating = new Rating(
            winnerRating.mu + ratingChange,
            Math.max(winnerRating.sigma * 0.9, 1.0)
          );
          
          const newLoserRating = new Rating(
            loserRating.mu - ratingChange,
            Math.max(loserRating.sigma * 0.9, 1.0)
          );
          
          updateRating(movedPokemon.id.toString(), newWinnerRating);
          updateRating(opponent.id.toString(), newLoserRating);
          
          console.log('🎲 [BATTLE_SIM] Direct update:', movedPokemon.name, 'rating increased vs', opponent.name);
          battlesSimulated++;
        }
      }
    } else if (newIndex > oldIndex) {
      // Pokemon moved down - Pokemon it moved past should beat it
      console.log('🎲 [BATTLE_SIM] Pokemon moved DOWN - applying direct rating decreases');
      const endIndex = Math.min(newIndex + 1, oldIndex + 1 + maxBattles);
      
      for (let i = oldIndex + 1; i <= newIndex && i < endIndex && battlesSimulated < maxBattles; i++) {
        const opponent = reorderedRankings[i - 1];
        if (opponent && opponent.id !== movedPokemon.id) {
          const winnerRating = getRating(opponent.id.toString());
          const loserRating = getRating(movedPokemon.id.toString());
          
          const ratingChange = 1.0;
          
          const newWinnerRating = new Rating(
            winnerRating.mu + ratingChange,
            Math.max(winnerRating.sigma * 0.9, 1.0)
          );
          
          const newLoserRating = new Rating(
            loserRating.mu - ratingChange,
            Math.max(loserRating.sigma * 0.9, 1.0)
          );
          
          updateRating(opponent.id.toString(), newWinnerRating);
          updateRating(movedPokemon.id.toString(), newLoserRating);
          
          console.log('🎲 [BATTLE_SIM]', opponent.name, 'rating increased vs', movedPokemon.name);
          battlesSimulated++;
        }
      }
    }
    
    console.log(`🎲 [BATTLE_SIM] ✅ Applied ${battlesSimulated} direct TrueSkill updates`);
    return battlesSimulated;
    */
    
    return 0; // No battles simulated - visual reordering only
  }, [getRating, updateRating]);

  return { simulateBattlesForReorder };
};
