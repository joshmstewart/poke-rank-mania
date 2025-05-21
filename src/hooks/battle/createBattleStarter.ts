
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";

// Simple Fisher-Yates shuffle algorithm
const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

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

    // Find Pokémon with active suggestions that haven't been used yet
    const suggestedPokemon = filteredPokemon.filter(p => 
      (p as RankedPokemon).suggestedAdjustment && 
      !(p as RankedPokemon).suggestedAdjustment?.used
    );
    
    console.log(`🎯 createBattleStarter: Found ${suggestedPokemon.length} Pokémon with unused suggestions`);
    
    // If we have suggestions, prioritize them
    if (suggestedPokemon.length > 0) {
      // Always include at least one suggested Pokémon
      const selectedSuggestion = suggestedPokemon[Math.floor(Math.random() * suggestedPokemon.length)];
      console.log(`🎯 createBattleStarter: Selected suggested Pokémon: ${selectedSuggestion.name}`);
      
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
      
      console.log(`🆕 createBattleStarter: Created battle with suggested Pokémon: ${shuffledBattle.map(p => p.name).join(', ')}`);
      setCurrentBattle(shuffledBattle);
      return shuffledBattle;
    }
    
    // If no suggestions, proceed with normal selection logic
    console.log("🎲 createBattleStarter: No suggestions found, using random selection");
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

  return {
    startNewBattle,
    trackLowerTierLoss
  };
};
