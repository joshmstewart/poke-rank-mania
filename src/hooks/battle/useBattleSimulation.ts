
import { useCallback } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { Rating } from 'ts-trueskill';
import { RankedPokemon } from '@/services/pokemon';

// EXPLICIT NOTE: "Implied Battles" logic has been permanently removed.
// This hook now focuses on direct TrueSkill rating updates for manual reordering.
export const useBattleSimulation = () => {
  const { updateRating, getRating } = useTrueSkillStore();

  const simulateBattlesForReorder = useCallback((
    reorderedRankings: RankedPokemon[],
    movedPokemon: RankedPokemon,
    oldIndex: number,
    newIndex: number
  ) => {
    console.log(`🎲 [BATTLE_SIM] Direct TrueSkill updates for ${movedPokemon.name} (${oldIndex} -> ${newIndex})`);
    console.log(`🎲 [BATTLE_SIM] EXPLICIT NOTE: No longer using implied battles - direct rating updates only`);
    
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
  }, [getRating, updateRating]);

  return { simulateBattlesForReorder };
};
