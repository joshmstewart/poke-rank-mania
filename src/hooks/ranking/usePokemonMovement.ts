
import { useCallback } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { Rating } from 'ts-trueskill';
import { toast } from '@/hooks/use-toast';

export const usePokemonMovement = (
  setAvailablePokemon: React.Dispatch<React.SetStateAction<any[]>>,
  handleEnhancedManualReorder: (pokemonId: number, sourceIndex: number, destinationIndex: number) => void
) => {
  const { updateRating } = useTrueSkillStore();

  const moveFromAvailableToRankings = useCallback(async (
    pokemonId: number,
    insertionPosition: number,
    pokemon: any
  ): Promise<boolean> => {
    console.log(`🔄 [ATOMIC_MOVE] Starting atomic move for Pokemon ${pokemonId} to position ${insertionPosition}`);
    
    try {
      // Step 1: Add default rating to TrueSkill store if it doesn't exist
      const defaultRating = new Rating(25.0, 8.333);
      updateRating(pokemonId.toString(), defaultRating);
      
      // Step 2: Remove from available list atomically
      let removalSuccess = false;
      setAvailablePokemon(prev => {
        const pokemonExists = prev.some(p => p.id === pokemonId);
        if (pokemonExists) {
          removalSuccess = true;
          return prev.filter(p => p.id !== pokemonId);
        }
        return prev;
      });
      
      if (!removalSuccess) {
        console.warn(`🔄 [ATOMIC_MOVE] Pokemon ${pokemonId} not found in available list`);
        return false;
      }
      
      // Step 3: Add to rankings using the enhanced manual reorder
      // Use -1 as sourceIndex to indicate this is a new addition
      handleEnhancedManualReorder(pokemonId, -1, insertionPosition);
      
      toast({
        title: "Pokemon Added",
        description: `${pokemon.name} has been added to rankings at position ${insertionPosition + 1}!`,
        duration: 3000
      });
      
      console.log(`🔄 [ATOMIC_MOVE] ✅ Successfully moved Pokemon ${pokemonId} to rankings`);
      return true;
      
    } catch (error) {
      console.error(`🔄 [ATOMIC_MOVE] ❌ Error during atomic move:`, error);
      
      // Rollback: Try to restore Pokemon to available list
      setAvailablePokemon(prev => {
        const pokemonExists = prev.some(p => p.id === pokemonId);
        if (!pokemonExists) {
          return [...prev, pokemon];
        }
        return prev;
      });
      
      toast({
        title: "Move Failed",
        description: `Failed to move ${pokemon.name}. Please try again.`,
        variant: "destructive",
        duration: 3000
      });
      
      return false;
    }
  }, [setAvailablePokemon, handleEnhancedManualReorder, updateRating]);

  return {
    moveFromAvailableToRankings
  };
};
