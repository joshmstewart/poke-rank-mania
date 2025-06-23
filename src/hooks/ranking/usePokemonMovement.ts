
import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export const usePokemonMovement = (
  setAvailablePokemon: React.Dispatch<React.SetStateAction<any[]>>,
  handleEnhancedManualReorder: (pokemonId: number, sourceIndex: number, destinationIndex: number) => void
) => {

  const moveFromAvailableToRankings = useCallback(async (
    pokemonId: number,
    insertionPosition: number,
    pokemon: any
  ): Promise<boolean> => {
    console.log(`[Move] Attempting to move ${pokemon.name} (ID: ${pokemonId}) to position ${insertionPosition}`);
    try {
      // Step 1: Remove from available list if function provided
      setAvailablePokemon?.(prev => prev.filter(p => p.id !== pokemonId));

      console.log(`[Move] Removed ${pokemon.name} from available list. Adding to rankings.`);
      // Step 2: Add to rankings using the enhanced manual reorder
      handleEnhancedManualReorder(pokemonId, -1, insertionPosition);
      
      toast({
        title: "Pokemon Added",
        description: `${pokemon.name} has been added to rankings at position ${insertionPosition + 1}!`,
        duration: 3000
      });
      
      return true;
      
    } catch (error) {
      console.error('[Move] Error during moveFromAvailableToRankings:', error);
      // Rollback: Try to restore Pokemon to available list
      setAvailablePokemon?.(prev => {
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
  }, [setAvailablePokemon, handleEnhancedManualReorder]);

  return {
    moveFromAvailableToRankings
  };
};
