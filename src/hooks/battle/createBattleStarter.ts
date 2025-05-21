
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";

/**
 * Creates functions for starting battles with optimal opponent selection
 */
export const createBattleStarter = (
  allPokemon: Pokemon[],
  filteredPokemon: Pokemon[],
  currentRankings: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>
) => {
  const startNewBattle = (battleType: BattleType): Pokemon[] => {
    console.log("🔄 createBattleStarter: Starting new battle with type:", battleType);
    
    if (!filteredPokemon || filteredPokemon.length < 2) {
      console.error("Not enough Pokémon available for battle");
      return [];
    }

    // CRITICAL FIX: Consistent storage key
    const STORAGE_KEY = 'pokemon-active-suggestions';
    console.log(`🔍 DIRECT CHECK: Looking for suggestions directly in localStorage (${STORAGE_KEY})`);
    let directSuggestionPokemon: Pokemon[] = [];
    
    try {
      const rawSuggestions = localStorage.getItem(STORAGE_KEY);
      if (rawSuggestions) {
        console.log(`💾 DIRECT CHECK: Found raw suggestion data in localStorage: ${rawSuggestions.substring(0, 100)}...`);
        
        const parsedSuggestions = JSON.parse(rawSuggestions);
        const suggestedIds = Object.keys(parsedSuggestions)
          .map(id => Number(id))
          .filter(id => !parsedSuggestions[id].used); // Only unused suggestions
        
        console.log(`🎯 DIRECT CHECK: Found ${suggestedIds.length} unused suggestion IDs in localStorage`);
        
        if (suggestedIds.length > 0) {
          // Find the Pokemon objects matching these IDs
          directSuggestionPokemon = filteredPokemon.filter(p => suggestedIds.includes(p.id));
          
          console.log(`🎯 DIRECT CHECK: Matched ${directSuggestionPokemon.length} Pokemon with suggestions:`);
          directSuggestionPokemon.forEach(p => console.log(`  - ${p.name} (ID: ${p.id})`));
          
          // If we found direct suggestion Pokemon, use one of them for battle
          if (directSuggestionPokemon.length > 0) {
            const selectedSuggestion = directSuggestionPokemon[Math.floor(Math.random() * directSuggestionPokemon.length)];
            console.log(`⭐ DIRECT CHECK: Selected suggested Pokémon: ${selectedSuggestion.name} (ID: ${selectedSuggestion.id})`);
            
            // Get the remaining battle slots from other Pokémon
            const remainingSlots = battleType === "triplets" ? 2 : 1;
            let otherPokemon = filteredPokemon.filter(p => p.id !== selectedSuggestion.id);
            
            // Shuffle the other Pokémon
            otherPokemon = shuffleArray(otherPokemon);
            
            // Create the battle with the suggested Pokémon and random others
            const battlePokemon = [
              selectedSuggestion,
              ...otherPokemon.slice(0, remainingSlots)
            ];
            
            // Shuffle the order so the suggested Pokémon isn't always first
            const shuffledBattle = shuffleArray(battlePokemon);
            
            console.log(`🆕 DIRECT CHECK: Created battle with suggested Pokémon: ${shuffledBattle.map(p => p.name).join(', ')}`);
            
            // CRITICAL FIX: Add suggestion info to the Pokemon object if it doesn't already have it
            const exactSuggestion = parsedSuggestions[selectedSuggestion.id.toString()];
            console.log(`🔍 DIRECT CHECK: Adding suggestion to ${selectedSuggestion.name}:`, exactSuggestion);
            
            // Apply the suggestion to the Pokemon object if it doesn't already have it
            if (exactSuggestion && !("suggestedAdjustment" in selectedSuggestion)) {
              (selectedSuggestion as RankedPokemon).suggestedAdjustment = exactSuggestion;
            }
            
            setCurrentBattle(shuffledBattle);
            return shuffledBattle;
          }
        }
      } else {
        console.log("💾 DIRECT CHECK: No suggestions found in localStorage");
      }
    } catch (e) {
      console.error("❌ DIRECT CHECK: Error accessing localStorage:", e);
    }
    
    // If we get here, either there were no suggestions in localStorage or we couldn't use them
    console.log("🎲 createBattleStarter: Using random selection");
    const shuffled = shuffleArray(filteredPokemon);
    const battleSize = battleType === "triplets" ? 3 : 2;
    
    if (shuffled.length >= battleSize) {
      const selected = shuffled.slice(0, battleSize);
      console.log(`🆕 createBattleStarter: Created random battle: ${selected.map(p => p.name).join(', ')}`);
      setCurrentBattle(selected);
      return selected;
    } else {
      console.error("Not enough Pokémon for the selected battle type");
      return [];
    }
  };

  const trackLowerTierLoss = (loserId: number) => {
    // This function can be expanded for additional battle statistics
    console.log(`📉 Pokemon #${loserId} lost a battle`);
  };
  
  // Simple Fisher-Yates shuffle algorithm
  const shuffleArray = <T>(array: T[]): T[] => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  return {
    startNewBattle,
    trackLowerTierLoss
  };
};
