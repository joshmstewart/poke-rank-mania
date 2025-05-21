import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";

/**
 * Creates a battle starter with various strategies for Pokemon selection
 */
export function createBattleStarter(
  allPokemon: Pokemon[],
  availablePokemon: Pokemon[],
  rankedPokemon: RankedPokemon[] = [],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  suggestedPokemon: RankedPokemon[] = []
) {
  // Keep track of recently used Pokemon to avoid repeats
  const recentlyUsed = new Set<number>();
  // Track Pokemon that have been suggested for ranking adjustments
  const suggested = new Map<number, RankedPokemon>();
  // Track consecutive non-suggestion battles to ensure we don't go too long without them
  let consecutiveNonSuggestionBattles = 0;
  // Track the last time we used each suggestion to avoid repeating the same one
  const lastUsedSuggestion = new Map<number, number>();
  
  // Initialize suggestion tracking
  if (suggestedPokemon.length > 0) {
    suggestedPokemon.forEach(p => suggested.set(p.id, p));
    console.log(`🎮 Battle Starter: Tracking ${suggested.size} Pokemon with suggestions`);
  }

  /**
   * Strategy: Select Pokemon with pending suggestions
   * Specifically selects Pokemon with active suggestions and appropriate opponents
   */
  function selectSuggestedPokemon(battleType: BattleType): Pokemon[] | null {
    if (suggested.size === 0) return null;
    
    const battleSize = battleType === "triplets" ? 3 : 2;
    const result: Pokemon[] = [];
    
    // Get all suggestions from the map
    const suggestedIds = Array.from(suggested.keys());
    if (suggestedIds.length === 0) return null;
    
    // Sort suggestions to prioritize those we haven't used recently
    const battleCounter = consecutiveNonSuggestionBattles + 1; // Current battle number
    const sortedIds = suggestedIds.sort((a, b) => {
      const lastUsedA = lastUsedSuggestion.get(a) || 0;
      const lastUsedB = lastUsedSuggestion.get(b) || 0;
      return lastUsedA - lastUsedB; // Prioritize suggestions we haven't used in a while
    });
    
    // Try to find a suggestion we haven't used too recently
    let selectedId = null;
    for (const id of sortedIds) {
      // Check if we've used this suggestion recently and if it's not in the recently used set
      if (!recentlyUsed.has(id)) {
        selectedId = id;
        break;
      }
    }
    
    // If all have been used recently, just pick one randomly
    if (selectedId === null && sortedIds.length > 0) {
      selectedId = sortedIds[Math.floor(Math.random() * sortedIds.length)];
    }
    
    if (selectedId !== null) {
      const suggestedPokemon = allPokemon.find(p => p.id === selectedId);
      const suggestedData = rankedPokemon.find(p => p.id === selectedId);
      
      if (suggestedPokemon && suggestedData) {
        result.push(suggestedPokemon);
        lastUsedSuggestion.set(selectedId, battleCounter);
        console.log(`🎯 Battle includes suggested Pokemon: ${suggestedPokemon.name}`);
        
        // Find an appropriate opponent based on the suggestion direction
        const suggestion = suggestedData.suggestedAdjustment;
        
        if (suggestion) {
          const currentRank = rankedPokemon.findIndex(p => p.id === suggestedPokemon.id);
          
          if (currentRank >= 0) {
            // Determine target rank based on suggestion direction and strength
            const strengthFactor = suggestion.strength || 1;
            const rankOffset = 3 + (strengthFactor * 2); // 5, 7, or 9 positions
            
            let targetRank = suggestion.direction === "up" 
              ? Math.max(0, currentRank - rankOffset) // Move up
              : Math.min(rankedPokemon.length - 1, currentRank + rankOffset); // Move down
              
            // Ensure we don't pick the same Pokemon
            if (targetRank === currentRank) {
              targetRank = suggestion.direction === "up" ? targetRank - 1 : targetRank + 1;
            }
            
            if (targetRank >= 0 && targetRank < rankedPokemon.length) {
              const opponentData = rankedPokemon[targetRank];
              const opponent = allPokemon.find(p => p.id === opponentData.id);
              
              if (opponent && opponent.id !== suggestedPokemon.id) {
                result.push(opponent);
                console.log(`🎮 Selected opponent ${opponent.name} (rank #${targetRank+1}) for suggested Pokemon ${suggestedPokemon.name} (rank #${currentRank+1}, direction: ${suggestion.direction})`);
              }
            }
          }
        }
      }
    }
    
    // If we couldn't find a suitable opponent, or need more for triplets
    while (result.length < battleSize) {
      // Fill remaining spots with appropriate Pokemon
      const eligiblePokemon = allPokemon.filter(p => 
        !result.some(selected => selected.id === p.id)
      );
      
      if (eligiblePokemon.length === 0) break;
      
      const randomPokemon = eligiblePokemon[Math.floor(Math.random() * eligiblePokemon.length)];
      result.push(randomPokemon);
    }
    
    // Record these Pokemon as recently used
    result.forEach(p => recentlyUsed.add(p.id));
    
    // Only return if we have a valid battle
    return result.length === battleSize ? result : null;
  }
  
  /**
   * Start a new battle using selection strategies
   */
  function startNewBattle(battleType: BattleType = "pairs", forceSuggestionPriority: boolean = false): Pokemon[] {
    // Ensure we have available Pokemon
    if (!allPokemon || allPokemon.length < 2) {
      console.error("Not enough Pokemon available for battle");
      return [];
    }

    const battleSize = battleType === "triplets" ? 3 : 2;
    let selectedPokemon: Pokemon[] = [];
    
    // Update our suggestion list based on the latest ranking data
    suggested.clear();
    rankedPokemon
      .filter(p => p.suggestedAdjustment && !p.suggestedAdjustment.used)
      .forEach(p => suggested.set(p.id, p));
      
    if (suggested.size > 0) {
      console.log(`🎮 Battle Starter: Updated suggestion tracking with ${suggested.size} Pokemon`);
    }
    
    // If forcing suggestion priority OR we have active suggestions with high priority (95%)
    // OR if we've gone too many battles without using suggestions
    if (forceSuggestionPriority || 
        (suggested.size > 0 && Math.random() < 0.9) || 
        consecutiveNonSuggestionBattles >= 3) {
      
      if (forceSuggestionPriority) {
        console.log("🚨 FORCING suggestion priority battle");
      }
      
      // Try to create a suggestion-focused battle
      const suggestedBattle = selectSuggestedPokemon(battleType);
      
      if (suggestedBattle) {
        selectedPokemon = suggestedBattle;
        consecutiveNonSuggestionBattles = 0;
      } else {
        // If no suggestion battle could be created, create a random battle
        consecutiveNonSuggestionBattles++;
        selectedPokemon = shuffleArray(availablePokemon).slice(0, battleSize);
      }
    } else {
      // Otherwise, create a random battle
      consecutiveNonSuggestionBattles++;
      selectedPokemon = shuffleArray(availablePokemon).slice(0, battleSize);
    }
    
    // Add these Pokemon to the recently used set
    selectedPokemon.forEach(p => recentlyUsed.add(p.id));
    
    // Limit the size of the recently used set
    if (recentlyUsed.size > 30) {
      const idsToRemove = Array.from(recentlyUsed).slice(0, 10);
      idsToRemove.forEach(id => recentlyUsed.delete(id));
    }
    
    // Update current battle with selected Pokemon
    setCurrentBattle(selectedPokemon);
    
    return selectedPokemon;
  }
  
  // Helper function to shuffle an array
  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  return { startNewBattle };
}
