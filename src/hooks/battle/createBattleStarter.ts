
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

    // CRITICAL FIX: Always check localStorage directly first
    console.log(`🔍 DIRECT CHECK: Looking for suggestions directly in localStorage`);
    let directSuggestionPokemon: Pokemon[] = [];
    
    try {
      const rawSuggestions = localStorage.getItem('pokemon-active-suggestions');
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
            
            // CRITICAL FIX: Log the exact suggestion from localStorage
            const exactSuggestion = parsedSuggestions[selectedSuggestion.id.toString()];
            console.log(`🔍 DIRECT CHECK: Exact suggestion for ${selectedSuggestion.name}:`, exactSuggestion);
            
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
    
    // DETAILED LOGGING: Check for suggestions before filtering
    console.log(`🔎 VERIFICATION: Analyzing ${filteredPokemon.length} Pokémon for suggestions via state`);
    
    // Find Pokémon with active suggestions that haven't been used yet
    const suggestedPokemon = filteredPokemon.filter(p => {
      const rankedP = p as RankedPokemon;
      const hasSuggestion = rankedP.suggestedAdjustment && !rankedP.suggestedAdjustment.used;
      
      if (hasSuggestion) {
        console.log(`✅ Found suggestion for ${p.name}: ${rankedP.suggestedAdjustment?.direction} x${rankedP.suggestedAdjustment?.strength} (used: ${rankedP.suggestedAdjustment?.used})`);
      }
      
      return hasSuggestion;
    });
    
    console.log(`🎯 createBattleStarter: Found ${suggestedPokemon.length} Pokémon with unused suggestions in state`);
    
    // VERIFICATION: Log each suggested Pokemon for debugging
    if (suggestedPokemon.length > 0) {
      suggestedPokemon.forEach(p => {
        const suggestion = (p as RankedPokemon).suggestedAdjustment;
        console.log(`  - Suggestion for ${p.name}: ${suggestion?.direction} x${suggestion?.strength} (used: ${suggestion?.used})`);
      });
    }
    
    // CRITICAL FIX: ALWAYS use suggestion with 100% probability if available
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
      console.log(`🔍 VERIFY: Battle includes suggested Pokémon ${selectedSuggestion.name} with suggestion:`, 
        (selectedSuggestion as RankedPokemon).suggestedAdjustment);
      
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
