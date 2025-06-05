
import { useCallback } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { Rating } from 'ts-trueskill';
import { RankedPokemon } from '@/services/pokemon';

export const useBattleSimulation = (
  addImpliedBattle?: (winnerId: number, loserId: number) => void
) => {
  const { updateRating, getRating } = useTrueSkillStore();

  const simulateBattlesForReorder = useCallback((
    reorderedRankings: RankedPokemon[],
    movedPokemon: RankedPokemon,
    oldIndex: number,
    newIndex: number
  ) => {
    console.log(`🎲 [BATTLE_SIM] Simulating battles for ${movedPokemon.name} (${oldIndex} -> ${newIndex})`);
    
    let battlesSimulated = 0;
    const maxBattles = Math.min(10, Math.abs(newIndex - oldIndex));
    
    if (newIndex < oldIndex) {
      // Pokemon moved up - it should beat Pokemon it moved past
      console.log('🎲 [BATTLE_SIM] Pokemon moved UP - simulating wins');
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
          
          console.log('🎲 [BATTLE_SIM] Battle:', movedPokemon.name, 'BEATS', opponent.name);
          battlesSimulated++;
          
          if (addImpliedBattle) {
            addImpliedBattle(movedPokemon.id, opponent.id);
          }
        }
      }
    } else if (newIndex > oldIndex) {
      // Pokemon moved down - Pokemon it moved past should beat it
      console.log('🎲 [BATTLE_SIM] Pokemon moved DOWN - simulating losses');
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
          
          console.log('🎲 [BATTLE_SIM]', opponent.name, 'BEATS', movedPokemon.name);
          battlesSimulated++;
          
          if (addImpliedBattle) {
            addImpliedBattle(opponent.id, movedPokemon.id);
          }
        }
      }
    }
    
    console.log(`🎲 [BATTLE_SIM] ✅ Simulated ${battlesSimulated} battles`);
    return battlesSimulated;
  }, [getRating, updateRating, addImpliedBattle]);

  return { simulateBattlesForReorder };
};
