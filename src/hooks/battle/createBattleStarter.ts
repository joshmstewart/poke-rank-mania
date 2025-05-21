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
  // Track recently used Pokémon to prevent immediate repetition - increased size
  const recentlyUsedPokemon = new Set<number>();
  // Add a separate tracking for the last battle to ensure absolute prevention of repeats
  const lastBattlePokemon = new Set<number>();
  
  // Count total number of battles started for debugging
  let totalBattlesStarted = 0;
  
  const startNewBattle = (battleType: BattleType): Pokemon[] => {
    totalBattlesStarted++;
    console.log(`🔄 createBattleStarter: Starting new battle #${totalBattlesStarted} with type: ${battleType}`);
    
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
            
            // Filter out recently used Pokémon AND the selected suggestion
            // BUGFIX: Exclude both recently used AND last battle Pokémon
            let otherPokemon = filteredPokemon.filter(p => 
              p.id !== selectedSuggestion.id && 
              !recentlyUsedPokemon.has(p.id) &&
              !lastBattlePokemon.has(p.id)
            );
            
            // If filtering left us with too few Pokémon, fall back to just excluding the selected suggestion and last battle
            if (otherPokemon.length < remainingSlots) {
              console.log("⚠️ Not enough unused Pokémon, including some recently seen ones");
              otherPokemon = filteredPokemon.filter(p => 
                p.id !== selectedSuggestion.id && 
                !lastBattlePokemon.has(p.id)
              );
              
              // If still too few, just exclude the selected suggestion
              if (otherPokemon.length < remainingSlots) {
                otherPokemon = filteredPokemon.filter(p => p.id !== selectedSuggestion.id);
              }
            }
            
            // Shuffle the other Pokémon
            otherPokemon = shuffleArray(otherPokemon);
            
            // Create the battle with the suggested Pokémon and random others
            const battlePokemon = [
              selectedSuggestion,
              ...otherPokemon.slice(0, remainingSlots)
            ];
            
            // Shuffle the order so the suggested Pokémon isn't always first
            const shuffledBattle = shuffleArray(battlePokemon);
            
            // Update recently used set and last battle set
            // IMPORTANT: Clear lastBattlePokemon before adding new ones
            lastBattlePokemon.clear();
            shuffledBattle.forEach(p => {
              recentlyUsedPokemon.add(p.id);
              lastBattlePokemon.add(p.id); // Add to last battle set
              // Keep the set size reasonable
              if (recentlyUsedPokemon.size > Math.min(20, filteredPokemon.length / 2)) {
                const oldestId = recentlyUsedPokemon.values().next().value;
                recentlyUsedPokemon.delete(oldestId);
              }
            });
            
            console.log(`🆕 DIRECT CHECK: Created battle with suggested Pokémon: ${shuffledBattle.map(p => p.name).join(', ')}`);
            console.log(`🔄 Now tracking ${recentlyUsedPokemon.size} recently used Pokémon`);
            
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

    // BUGFIX: Vastly improved random selection logic to avoid repetition
    let candidatePokemon: Pokemon[] = [];
    const battleSize = battleType === "triplets" ? 3 : 2;
    
    // Phase 1: First try to use Pokémon that are not in recentlyUsedPokemon AND not in lastBattlePokemon
    candidatePokemon = filteredPokemon.filter(p => 
      !recentlyUsedPokemon.has(p.id) && 
      !lastBattlePokemon.has(p.id)
    );
    
    console.log(`🔍 Phase 1: Found ${candidatePokemon.length} unused Pokémon (not in recent or last battle)`);
    
    // Phase 2: If we don't have enough, try just excluding the last battle Pokémon
    if (candidatePokemon.length < battleSize * 2) {
      console.log("⚠️ Not enough unused Pokémon, trying just excluding last battle");
      candidatePokemon = filteredPokemon.filter(p => !lastBattlePokemon.has(p.id));
      console.log(`🔍 Phase 2: Found ${candidatePokemon.length} Pokémon (not in last battle)`);
    }
    
    // Phase 3: Absolute fallback - use all Pokémon but still try to avoid last battle ones if possible
    if (candidatePokemon.length < battleSize) {
      console.log("⚠️ Critical: Using all available Pokémon");
      candidatePokemon = filteredPokemon;
      // Clear tracking to prevent getting stuck if we have very few Pokémon
      recentlyUsedPokemon.clear();
    }
    
    // Shuffle and select
    const shuffled = shuffleArray(candidatePokemon);
    
    if (shuffled.length >= battleSize) {
      // Select battle Pokémon
      const selected = shuffled.slice(0, battleSize);
      
      // Clear last battle and add new battle Pokémon
      lastBattlePokemon.clear();
      
      // Track these Pokémon as recently used and last battle
      selected.forEach(p => {
        recentlyUsedPokemon.add(p.id);
        lastBattlePokemon.add(p.id);
        // Keep the set size reasonable
        if (recentlyUsedPokemon.size > Math.min(20, filteredPokemon.length / 2)) {
          const oldestId = recentlyUsedPokemon.values().next().value;
          recentlyUsedPokemon.delete(oldestId);
        }
      });
      
      console.log(`🆕 createBattleStarter: Created random battle: ${selected.map(p => p.name).join(', ')}`);
      console.log(`🔄 Now tracking ${recentlyUsedPokemon.size} recently used Pokémon`);
      console.log(`🔍 Last battle Pokémon: ${selected.map(p => p.id).join(', ')}`);
      
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
