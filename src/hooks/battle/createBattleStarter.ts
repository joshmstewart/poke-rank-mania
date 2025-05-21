
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";

// Helper function for shuffling array that was missing
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const createBattleStarter = (
  allPokemon: Pokemon[],
  filteredPokemon: Pokemon[],
  currentRankings: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>
) => {
  // Track lower tier losses for temporary tier skipping logic
  const lowerTierLossCounter: Record<string, number> = {};
  
  // Function to get a random Pokemon from a group
  const getRandomFromGroup = (group: Pokemon[]): Pokemon | null => {
    if (!group || group.length === 0) return null;
    return group[Math.floor(Math.random() * group.length)];
  };

  // Find the suggested pokemon to prioritize (if any)
  const findActiveSuggestion = (): RankedPokemon | undefined => {
    // Higher priority to unused suggestions 
    const unusedSuggestion = currentRankings.find(p => 
      (p as RankedPokemon).suggestedAdjustment && 
      !(p as RankedPokemon).suggestedAdjustment!.used
    ) as RankedPokemon | undefined;
    
    if (unusedSuggestion) return unusedSuggestion;
    
    // If no unused suggestions, check for used ones too
    // so we can still use them for battle selection
    return currentRankings.find(p => 
      (p as RankedPokemon).suggestedAdjustment
    ) as RankedPokemon | undefined;
  };

  // Select opponent based on suggestion params
  const selectOpponentForSuggestion = (
    suggested: RankedPokemon, 
    suggestedIndex: number
  ): Pokemon | null => {
    const { direction, strength } = suggested.suggestedAdjustment!;
    // Calculate offset based on strength (1-3)
    const offset = strength * 5;
    
    // Create a pool based on direction
    let pool: Pokemon[] = [];
    
    if (direction === "up") {
      // For "up" suggestion, select from better ranked Pokemon
      pool = currentRankings.slice(Math.max(0, suggestedIndex - offset), suggestedIndex);
    } else {
      // For "down" suggestion, select from lower ranked Pokemon
      pool = currentRankings.slice(
        suggestedIndex + 1, 
        Math.min(currentRankings.length, suggestedIndex + 1 + offset)
      );
    }
    
    // If pool is empty, fallback to normal selection
    if (pool.length === 0) return null;
    
    // Select opponent with lowest confidence or random if not available
    const opponent = pool.reduce((lowest, current) => {
      const currentConfidence = (current as RankedPokemon).confidence || 0;
      const lowestConfidence = (lowest as RankedPokemon).confidence || 0;
      return currentConfidence < lowestConfidence ? current : lowest;
    }, pool[0]);
    
    console.log(
      `🧪 Pairing '${suggested.name}' (arrow ${direction} x${strength}) vs '${opponent.name}'`
    );
    
    return opponent;
  };

  // Fill in battles based on algorithm
  const startNewBattle = (battleType: BattleType) => {
    // Determine how many Pokemon are needed
    const pokemonNeeded = battleType === "triplets" ? 3 : 2;
    
    // First, check for any active ranking suggestions
    // Increase probability of finding a suggestion
    const forceSuggestionMatch = Math.random() < 0.85; // 85% chance to prioritize suggestions
    if (forceSuggestionMatch) {
      const suggestedPokemon = findActiveSuggestion();
      
      if (suggestedPokemon) {
        const suggestedIndex = currentRankings.findIndex(p => p.id === suggestedPokemon.id);
        
        if (suggestedIndex !== -1) {
          // Find appropriate opponent for suggestion
          const opponent = selectOpponentForSuggestion(suggestedPokemon, suggestedIndex);
          
          if (opponent) {
            // We found a suitable opponent based on suggestion
            if (battleType === "triplets") {
              // For triplets, add one more random Pokemon
              const randomPokemon = filteredPokemon
                .filter(p => p.id !== suggestedPokemon.id && p.id !== opponent.id)
                .sort(() => 0.5 - Math.random())[0];
              
              if (randomPokemon) {
                console.log(
                  `createBattleStarter: Setting suggestion battle with ${suggestedPokemon.name}, ${opponent.name}, ${randomPokemon.name}`
                );
                setCurrentBattle([suggestedPokemon, opponent, randomPokemon]);
                return;
              }
            } else {
              // For pairs, just use the suggestion and opponent
              console.log(
                `createBattleStarter: Setting suggestion battle with ${suggestedPokemon.name}, ${opponent.name}`
              );
              setCurrentBattle([suggestedPokemon, opponent]);
              return;
            }
          }
        }
      }
    }
    
    // If no suggestion or we couldn't build a suggestion battle, fall back to normal logic
    console.log("createBattleStarter: No active suggestions or suggestion match skipped, using normal battle selection");
    
    // Ensure we have proper Pokemon lists to work with
    const safeAllPokemon = Array.isArray(allPokemon) ? allPokemon : [];
    
    if (safeAllPokemon.length < pokemonNeeded) {
      console.error("createBattleStarter: Not enough Pokemon for a battle, only have", safeAllPokemon.length);
      return [];
    }

    // Ensure we have arrays to work with
    const ranked = Array.isArray(currentRankings) ? [...currentRankings] : [];
    const unranked = safeAllPokemon.filter(p => !ranked.some(r => r.id === p.id));
    
    console.log(`createBattleStarter: Starting battle with ${ranked.length} ranked and ${unranked.length} unranked Pokémon`);
    
    // Simple fallback if we have no strategy
    let result: Pokemon[] = [];
    
    // In the worst case, just pick random Pokemon
    if (safeAllPokemon.length >= pokemonNeeded) {
      result = shuffleArray([...safeAllPokemon]).slice(0, pokemonNeeded);
      console.log("createBattleStarter: Using fallback random selection with", result.map(p => p.name).join(", "));
    }
    
    // Get the final Pokemon for the battle
    const finalResult = result.length >= pokemonNeeded ? result : shuffleArray([...safeAllPokemon]).slice(0, pokemonNeeded);
    
    // Set the current battle
    if (finalResult.length >= pokemonNeeded) {
      console.log("createBattleStarter: Setting battle with", finalResult.map(p => p.name).join(", "));
      setCurrentBattle(finalResult);
      return finalResult;
    } else {
      console.error("createBattleStarter: Failed to create a battle");
      return [];
    }
  };

  return {
    startNewBattle,
    trackLowerTierLoss: (rankIndex: number) => {
      lowerTierLossCounter[rankIndex] = (lowerTierLossCounter[rankIndex] || 0) + 1;
    }
  };
};
