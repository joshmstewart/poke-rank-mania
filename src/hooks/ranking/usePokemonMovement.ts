
import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { RankedPokemon } from '@/services/pokemon';
import { useTrueSkillStore } from '@/stores/trueskillStore';

export const usePokemonMovement = (
  setAvailablePokemon: React.Dispatch<React.SetStateAction<any[]>>,
  localRankings: RankedPokemon[],
  updateLocalRankings: (rankings: RankedPokemon[]) => void
) => {
  const { getAllRatings, forceScoreBetweenNeighbors } = useTrueSkillStore();

  const moveFromAvailableToRankings = useCallback(async (
    pokemonId: number,
    insertionPosition: number,
    pokemon: any
  ): Promise<boolean> => {
    console.log(`[Move] Attempting to move ${pokemon.name} (ID: ${pokemonId}) to position ${insertionPosition}`);
    try {
      const clampedPosition = Math.max(0, Math.min(insertionPosition, localRankings.length));
      const higherNeighbor = clampedPosition > 0 ? localRankings[clampedPosition - 1] : undefined;
      const lowerNeighbor = clampedPosition < localRankings.length ? localRankings[clampedPosition] : undefined;
      const allRatings = getAllRatings();
      const currentRating = allRatings[pokemonId.toString()];
      const fallbackScore = currentRating?.mu ?? 25.0;
      const targetScore =
        higherNeighbor?.score !== undefined && lowerNeighbor?.score !== undefined
          ? (higherNeighbor.score + lowerNeighbor.score) / 2
          : higherNeighbor?.score !== undefined
            ? higherNeighbor.score - 1.0
            : lowerNeighbor?.score !== undefined
              ? lowerNeighbor.score + 1.0
              : fallbackScore;
      const newPokemon: RankedPokemon = {
        ...pokemon,
        score: targetScore,
        confidence: pokemon.confidence ?? 50,
        count: currentRating?.battleCount ?? pokemon.count ?? 0,
        wins: pokemon.wins ?? 0,
        losses: pokemon.losses ?? 0,
        winRate: pokemon.winRate ?? 0,
        rank: clampedPosition + 1,
      };

      // Step 1: Remove from available list if function provided
      setAvailablePokemon?.(prev => prev.filter(p => p.id !== pokemonId));

      console.log(`[Move] Removed ${pokemon.name} from available list. Adding to rankings.`);
      // Step 2: Persist the new ranked entry directly; reorder-only code rejects cards not already ranked.
      const nextRankings = [...localRankings];
      nextRankings.splice(clampedPosition, 0, newPokemon);
      updateLocalRankings(nextRankings.map((rankedPokemon, index) => ({
        ...rankedPokemon,
        rank: index + 1,
      })));
      forceScoreBetweenNeighbors(
        pokemonId.toString(),
        higherNeighbor?.id.toString(),
        lowerNeighbor?.id.toString()
      );
      
      toast({
        title: "Pokemon Added",
        description: `${pokemon.name} has been added to rankings at position ${clampedPosition + 1}!`,
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
  }, [setAvailablePokemon, localRankings, updateLocalRankings, getAllRatings, forceScoreBetweenNeighbors]);

  return {
    moveFromAvailableToRankings
  };
};
