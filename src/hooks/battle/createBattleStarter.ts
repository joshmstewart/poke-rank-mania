
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
  
  // Track when we last used a suggestion (to prevent multiple battles in a row)
  const lastUsedSuggestion = { timestamp: 0 };

  // Track which suggestions have been used in this session to avoid overusing the same ones
  const recentlyUsedSuggestions = new Set<number>();
  
  // Track consecutive battles without suggestion to force suggestion use
  let battlesWithoutSuggestion = 0;
  
  // Debug flag to log detailed battle selection information
  const DEBUG_BATTLE_SELECTION = true;

  // Function to get a random Pokemon from a group
  const getRandomFromGroup = (group: Pokemon[]): Pokemon | null => {
    if (!group || group.length === 0) return null;
    return group[Math.floor(Math.random() * group.length)];
  };

  // Find the suggested pokemon to prioritize (if any)
  const findActiveSuggestion = (): RankedPokemon | undefined => {
    // Add more detailed logging to help debug
    if (DEBUG_BATTLE_SELECTION) {
      console.log(`🔍 findActiveSuggestion: Searching through ${currentRankings.length} Pokémon for suggestions`);
    }
    
    let suggestedCount = 0;
    let unusedCount = 0;
    
    currentRankings.forEach(p => {
      const rankedP = p as RankedPokemon;
      if (rankedP.suggestedAdjustment) {
        suggestedCount++;
        if (!rankedP.suggestedAdjustment.used) {
          unusedCount++;
        }
      }
    });
    
    if (DEBUG_BATTLE_SELECTION) {
      console.log(`📊 findActiveSuggestion: Found ${suggestedCount} total suggestions (${unusedCount} unused)`);
    }
    
    // Higher priority to unused suggestions that haven't been used recently 
    const unusedSuggestions = currentRankings.filter(p => {
      const rankedP = p as RankedPokemon;
      return rankedP.suggestedAdjustment && 
        !rankedP.suggestedAdjustment.used &&
        !recentlyUsedSuggestions.has(p.id);
    }) as RankedPokemon[];
    
    if (DEBUG_BATTLE_SELECTION) {
      console.log(`🔄 findActiveSuggestion: Found ${unusedSuggestions.length} fresh unused suggestions`);
    }
    
    if (unusedSuggestions.length > 0) {
      // Randomly select from available unused suggestions
      const selected = unusedSuggestions[Math.floor(Math.random() * unusedSuggestions.length)];
      console.log(`✅ Selected suggestion for ${selected.name}`);
      return selected;
    }
    
    // If we've exhausted fresh suggestions, try any unused ones even if used recently
    const anyUnusedSuggestion = currentRankings.find(p => {
      const rankedP = p as RankedPokemon;
      return rankedP.suggestedAdjustment && !rankedP.suggestedAdjustment.used;
    }) as RankedPokemon | undefined;
    
    if (anyUnusedSuggestion) {
      console.log(`⚠️ Using recently seen suggestion for ${anyUnusedSuggestion.name}`);
      return anyUnusedSuggestion;
    }
    
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
    
    if (DEBUG_BATTLE_SELECTION) {
      console.log(`Selecting opponent for ${suggested.name} with direction=${direction}, strength=${strength}, offset=${offset}`);
    }
    
    // Create a pool based on direction
    let pool: Pokemon[] = [];
    
    if (direction === "up") {
      // For "up" suggestion, select from better ranked Pokemon
      const startIdx = Math.max(0, suggestedIndex - offset - 5); // Added extra range
      pool = currentRankings.slice(startIdx, suggestedIndex);
      if (DEBUG_BATTLE_SELECTION) {
        console.log(`For "up" suggestion, selecting from ranks ${startIdx} to ${suggestedIndex-1} (pool size: ${pool.length})`);
      }
    } else {
      // For "down" suggestion, select from lower ranked Pokemon
      const endIdx = Math.min(currentRankings.length, suggestedIndex + 1 + offset + 5); // Added extra range
      pool = currentRankings.slice(suggestedIndex + 1, endIdx);
      if (DEBUG_BATTLE_SELECTION) {
        console.log(`For "down" suggestion, selecting from ranks ${suggestedIndex+1} to ${endIdx-1} (pool size: ${pool.length})`);
      }
    }
    
    // If pool is empty, fallback to normal selection
    if (pool.length === 0) {
      console.log("No suitable opponents in pool, falling back to random selection");
      return null;
    }
    
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
    
    console.log(`Starting new ${battleType} battle (need ${pokemonNeeded} Pokémon)`);
    
    // ALWAYS prioritize suggestions (100% chance)
    // This guarantees suggested Pokémon will be selected if available
    const forceSuggestionMatch = true;
    
    // Also force suggestion after 3 battles without using one
    const mustUseSuggestion = battlesWithoutSuggestion >= 3;
    
    if (mustUseSuggestion) {
      console.log("⚠️ FORCING suggestion match after", battlesWithoutSuggestion, "battles without using one");
    }
    
    // Always try to use a suggestion
    const canUseSuggestion = true;
    
    if (canUseSuggestion) {
      const suggestedPokemon = findActiveSuggestion();
      
      if (suggestedPokemon) {
        console.log(`Found suggestion for ${suggestedPokemon.name}, creating battle`);
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
                  `✅ Setting suggestion battle with ${suggestedPokemon.name}, ${opponent.name}, ${randomPokemon.name}`
                );
                setCurrentBattle([suggestedPokemon, opponent, randomPokemon]);
                
                // Track that we used this suggestion
                lastUsedSuggestion.timestamp = Date.now();
                recentlyUsedSuggestions.add(suggestedPokemon.id);
                battlesWithoutSuggestion = 0;
                
                // Clear recently used suggestions if the set gets too large
                if (recentlyUsedSuggestions.size > 10) {
                  const oldestSuggestion = Array.from(recentlyUsedSuggestions)[0];
                  recentlyUsedSuggestions.delete(oldestSuggestion);
                }
                
                return;
              }
            } else {
              // For pairs, just use the suggestion and opponent
              console.log(
                `✅ Setting suggestion battle with ${suggestedPokemon.name}, ${opponent.name}`
              );
              setCurrentBattle([suggestedPokemon, opponent]);
              
              // Track that we used this suggestion
              lastUsedSuggestion.timestamp = Date.now();
              recentlyUsedSuggestions.add(suggestedPokemon.id);
              battlesWithoutSuggestion = 0;
              
              return;
            }
          }
        }
      }
    }
    
    // If no suggestion or we couldn't build a suggestion battle, fall back to normal logic
    console.log("No active suggestions found, using normal battle selection");
    battlesWithoutSuggestion++; // Increment counter for battles without using suggestions
    
    // Ensure we have proper Pokemon lists to work with
    const safeAllPokemon = Array.isArray(allPokemon) ? allPokemon : [];
    
    if (safeAllPokemon.length < pokemonNeeded) {
      console.error("Not enough Pokemon for a battle, only have", safeAllPokemon.length);
      return [];
    }

    // Ensure we have arrays to work with
    const ranked = Array.isArray(currentRankings) ? [...currentRankings] : [];
    const unranked = safeAllPokemon.filter(p => !ranked.some(r => r.id === p.id));
    
    if (DEBUG_BATTLE_SELECTION) {
      console.log(`Starting battle with ${ranked.length} ranked and ${unranked.length} unranked Pokémon`);
    }
    
    // Simple fallback if we have no strategy
    let result: Pokemon[] = [];
    
    // In the worst case, just pick random Pokemon
    if (safeAllPokemon.length >= pokemonNeeded) {
      result = shuffleArray([...safeAllPokemon]).slice(0, pokemonNeeded);
      console.log("Using fallback random selection with", result.map(p => p.name).join(", "));
    }
    
    // Get the final Pokemon for the battle
    const finalResult = result.length >= pokemonNeeded ? result : shuffleArray([...safeAllPokemon]).slice(0, pokemonNeeded);
    
    // Set the current battle
    if (finalResult.length >= pokemonNeeded) {
      console.log("Setting battle with", finalResult.map(p => p.name).join(", "));
      setCurrentBattle(finalResult);
      return finalResult;
    } else {
      console.error("Failed to create a battle");
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
