
import { useCallback } from "react";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";

export const useReRankingTrigger = (
  localRankings: any[],
  updateLocalRankings: (rankings: any[]) => void
) => {
  const { getRating, updateRating } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();

  const triggerReRanking = useCallback(async (pokemonId: number) => {
    console.log(`🔄🔄🔄 [RE_RANKING_TRIGGER] ===== TRIGGERING RE-RANKING =====`);
    console.log(`🔄🔄🔄 [RE_RANKING_TRIGGER] Pokemon ID: ${pokemonId}`);
    
    try {
      // Find the Pokemon in current rankings
      const pokemonIndex = localRankings.findIndex(p => p.id === pokemonId);
      if (pokemonIndex === -1) {
        throw new Error(`Pokemon ${pokemonId} not found in current rankings`);
      }
      
      const pokemon = localRankings[pokemonIndex];
      console.log(`🔄🔄🔄 [RE_RANKING_TRIGGER] Found Pokemon: ${pokemon.name} at index ${pokemonIndex}`);
      
      // Get current TrueSkill rating
      const currentRating = getRating(pokemonId.toString());
      console.log(`🔄🔄🔄 [RE_RANKING_TRIGGER] Current rating: mu=${currentRating.mu.toFixed(2)}, sigma=${currentRating.sigma.toFixed(2)}`);
      
      // Simulate battles with other ranked Pokemon to update rating
      // This is a simplified simulation - in a real implementation, you'd want more sophisticated battle logic
      const otherRankedPokemon = localRankings.filter(p => p.id !== pokemonId);
      
      let updatedRating = currentRating;
      let battleCount = 0;
      
      // Battle against 5-10 other Pokemon to update the rating
      const battleOpponents = otherRankedPokemon
        .sort(() => Math.random() - 0.5) // Randomize
        .slice(0, Math.min(8, otherRankedPokemon.length));
      
      console.log(`🔄🔄🔄 [RE_RANKING_TRIGGER] Will battle against ${battleOpponents.length} opponents`);
      
      for (const opponent of battleOpponents) {
        const opponentRating = getRating(opponent.id.toString());
        
        // Simulate battle outcome (you might want to use actual battle logic here)
        const winProbability = 1 / (1 + Math.pow(10, (opponentRating.mu - updatedRating.mu) / 400));
        const didWin = Math.random() < winProbability;
        
        // Create a simple rating update based on battle outcome
        // This is a simplified version - you might want to use your existing battle system
        if (didWin) {
          // Won - increase rating
          updatedRating = new (require('ts-trueskill').Rating)(
            updatedRating.mu + (opponentRating.mu > updatedRating.mu ? 2 : 1),
            Math.max(updatedRating.sigma * 0.95, 1)
          );
        } else {
          // Lost - decrease rating  
          updatedRating = new (require('ts-trueskill').Rating)(
            updatedRating.mu - (opponentRating.mu < updatedRating.mu ? 2 : 1),
            Math.max(updatedRating.sigma * 0.95, 1)
          );
        }
        
        battleCount++;
        console.log(`🔄🔄🔄 [RE_RANKING_TRIGGER] Battle ${battleCount}: vs ${opponent.name} - ${didWin ? 'WIN' : 'LOSS'}`);
      }
      
      console.log(`🔄🔄🔄 [RE_RANKING_TRIGGER] Final rating: mu=${updatedRating.mu.toFixed(2)}, sigma=${updatedRating.sigma.toFixed(2)}`);
      
      // Update the rating in TrueSkill store
      const currentStats = useTrueSkillStore.getState().getAllRatings()[pokemonId.toString()];
      updateRating(
        pokemonId.toString(), 
        updatedRating, 
        (currentStats?.battleCount || 0) + battleCount
      );
      
      // Create updated rankings by re-sorting all Pokemon by their TrueSkill ratings
      const allRatings = useTrueSkillStore.getState().getAllRatings();
      const updatedRankings = localRankings
        .map(p => {
          const rating = allRatings[p.id.toString()];
          return {
            ...p,
            mu: rating?.mu || 25,
            sigma: rating?.sigma || 8.333,
            battleCount: rating?.battleCount || 0
          };
        })
        .sort((a, b) => {
          // Sort by TrueSkill rating (higher mu = better rank)
          const aScore = a.mu - (3 * a.sigma);
          const bScore = b.mu - (3 * b.sigma);
          return bScore - aScore;
        });
      
      console.log(`🔄🔄🔄 [RE_RANKING_TRIGGER] Updated rankings calculated`);
      
      // Find new position
      const newIndex = updatedRankings.findIndex(p => p.id === pokemonId);
      console.log(`🔄🔄🔄 [RE_RANKING_TRIGGER] ${pokemon.name} moved from rank ${pokemonIndex + 1} to rank ${newIndex + 1}`);
      
      // Update local rankings
      updateLocalRankings(updatedRankings);
      
      // Dispatch event for any listeners
      const event = new CustomEvent('pokemon-re-ranked', {
        detail: { 
          pokemonId, 
          oldRank: pokemonIndex + 1,
          newRank: newIndex + 1,
          battleCount,
          rating: updatedRating
        }
      });
      document.dispatchEvent(event);
      
      console.log(`🔄🔄🔄 [RE_RANKING_TRIGGER] ✅ Re-ranking completed successfully`);
      
    } catch (error) {
      console.error(`🔄🔄🔄 [RE_RANKING_TRIGGER] ❌ Re-ranking failed:`, error);
      throw error;
    }
  }, [localRankings, updateLocalRankings, getRating, updateRating, pokemonLookupMap]);

  return { triggerReRanking };
};
