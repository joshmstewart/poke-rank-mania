
import { useState, useRef } from "react";
import { Pokemon } from "@/services/pokemon";

export const useBattleStarter = (
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>
) => {
  // Track previous battles to avoid repetition
  const [previousBattles, setPreviousBattles] = useState<number[][]>([]);
  // Use ref to track the most recent battle Pokemon IDs for immediate comparison
  const lastBattleRef = useRef<number[]>([]);
  // Track seen Pokemon IDs to avoid repeating the same Pokemon too frequently
  const recentlySeenPokemon = useRef<Set<number>>(new Set());
  // Count consecutive repeats to force more variety
  const consecutiveRepeatsRef = useRef(0);

  // Fisher-Yates shuffle algorithm for better randomization
  const shuffleArray = (array: Pokemon[]): Pokemon[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
// Utility function to roll a random number between 0–100
const roll = () => Math.random() * 100;
  // Simulate priority status (e.g., Pokémon in top 25%) using a Set of high IDs
const priorityPokemon = new Set<number>();
const PRIORITY_THRESHOLD = 200; // Adjust this if needed

// We'll mark Pokémon with IDs <= PRIORITY_THRESHOLD as priority
const updatePriorityPokemon = (pokemonList: Pokemon[]) => {
  priorityPokemon.clear();
  const sorted = [...pokemonList].sort((a, b) => a.id - b.id);
  const topCount = Math.floor(sorted.length * 0.25);
  sorted.slice(0, topCount).forEach(p => priorityPokemon.add(p.id));
};



  const startNewBattle = (battleType: "pairs" | "triplets") => {
    console.log("[useBattleStarter] startNewBattle called. battleType:", battleType);
console.log("[useBattleStarter] Using allPokemonForGeneration length:", allPokemonForGeneration?.length || 0);
console.log("[useBattleStarter] Using currentFinalRankings length:", currentFinalRankings?.length || 0);
if (currentFinalRankings && currentFinalRankings.length > 0) {
  console.log("[useBattleStarter] Sample of currentFinalRankings:", currentFinalRankings.slice(0,3).map(p => p.name));
} else {
  console.log("[useBattleStarter] currentFinalRankings is empty or undefined at start of startNewBattle.");
}
    console.log("Starting new battle with pokemonList:", pokemonList?.length || 0);

    // ----- START OF NEW TIERED PAIRING LOGIC -----
    const battleSize = battleType === "pairs" ? 2 : 3;

    // This check should be at the very start of startNewBattle using allPokemonForGeneration
    if (!allPokemonForGeneration || allPokemonForGeneration.length < battleSize) {
      console.error("[useBattleStarter] Not enough Pokémon in allPokemonForGeneration for a battle. Needed:", battleSize, "Got:", allPokemonForGeneration?.length || 0);
      setCurrentBattle([]); // Clear current battle if we can't form one
      return [];
    }

    let newBattlePokemon: Pokemon[] = [];

    const ranked = Array.isArray(currentFinalRankings) ? currentFinalRankings : [];
    const unrankedPool = allPokemonForGeneration.filter(p => !ranked.find(r => r.id === p.id));

    const getSliceByCount = (list: Pokemon[], count: number): Pokemon[] => list.slice(0, Math.min(list.length, Math.max(0, count)));
    const getSliceByPercent = (list: Pokemon[], percent: number): Pokemon[] => {
      const count = Math.floor(list.length * (percent / 100));
      return list.slice(0, Math.max(0, count));
    };

    const T_Top20_Ranked = getSliceByCount(ranked, 20);
    const T_Top10Percent_Ranked = getSliceByPercent(ranked, 10);
    const T_Top25Percent_Ranked = getSliceByPercent(ranked, 25);
    const T_Top50Percent_Ranked = getSliceByPercent(ranked, 50);
    const T_Bottom50Percent_Ranked = ranked.filter(p => !T_Top50Percent_Ranked.some(topP => topP.id === p.id));
    const T_Unranked = [...unrankedPool];

    const pickDistinctFromPools = (pool1: Pokemon[], pool2: Pokemon[], count: number, avoidIds: number[]): Pokemon[] => {
        let p1: Pokemon | undefined, p2: Pokemon | undefined, p3: Pokemon | undefined;
        let result: Pokemon[] = [];
        const maxAttempts = 50; 
        let attempts = 0;

        const createEffectivePool = (pool: Pokemon[], avoid: number[]) => {
            if (!Array.isArray(pool) || pool.length === 0) return [];
            const filtered = shuffleArray(pool.filter(p_filter => !avoid.includes(p_filter.id)));
            const minRequiredForPool = (pool1 === pool2 && pool === pool1 && count > 1) ? count : 1; 
            return filtered.length >= minRequiredForPool ? filtered : shuffleArray([...pool]);
        };
        
        let P1_Effective_Pool = createEffectivePool(pool1, avoidIds);
        let P2_Effective_Pool = createEffectivePool(pool2, avoidIds);

        if (P1_Effective_Pool.length === 0) { console.warn(`[pickDistinct] P1_Effective_Pool is empty. Initial pool1: ${pool1?.length}`); return []; }
        if (count > 1 && P1_Effective_Pool === P2_Effective_Pool && P1_Effective_Pool.length < count) { console.warn(`[pickDistinct] Cannot pick ${count} distinct from same small pool. Size: ${P1_Effective_Pool.length}`); return [];}
        if (count > 1 && P2_Effective_Pool.length === 0 && P1_Effective_Pool !== P2_Effective_Pool) { console.warn(`[pickDistinct] P2_Effective_Pool is empty. Initial pool2: ${pool2?.length}`); return []; }


        for (attempts = 0; attempts < maxAttempts; attempts++) {
            if (P1_Effective_Pool.length === 0) break; // Cannot pick p1
            p1 = P1_Effective_Pool[Math.floor(Math.random() * P1_Effective_Pool.length)];
            
            let p2Options = (P1_Effective_Pool === P2_Effective_Pool) 
                ? P2_Effective_Pool.filter(p => p.id !== p1?.id)
                : P2_Effective_Pool;
            
            if (p2Options.length === 0) continue; 
            p2 = p2Options[Math.floor(Math.random() * p2Options.length)];

            if (p1 && p2 && p1.id !== p2.id) {
                if (count === 2) { 
                    const currentPairIdsSorted = [p1.id, p2.id].sort((a,b)=>a-b);
                    const avoidIdsSorted = [...avoidIds].sort((a,b)=>a-b);
                    if (avoidIds.length !== 2 || currentPairIdsSorted.join(',') !== avoidIdsSorted.join(',')) {
                        result = [p1, p2];
                        break;
                    }
                } else if (count === 3) { 
                    let p3Options = allPokemonForGeneration.filter(p => p.id !== p1?.id && p.id !== p2?.id && !avoidIds.includes(p.id));
                    if (p3Options.length === 0) p3Options = allPokemonForGeneration.filter(p => p.id !== p1?.id && p.id !== p2?.id);
                    
                    if (p3Options.length > 0) {
                        p3 = p3Options[Math.floor(Math.random() * p3Options.length)];
                        if (p3) { result = [p1, p2, p3]; break; }
                    }
                }
            }
        }
        if (result.length < count) console.warn(`[pickDistinct] Could not find ${count} distinct Pokemon for strategy: ${strategyUsed}. Attempts: ${attempts}`);
        return result;
    };

    const roll = Math.random() * 100;
    let strategyUsed = "Fallback"; // Will be updated if a specific strategy is chosen
    newBattlePokemon = []; 

    if (battleType === "pairs") { 
        if (roll < 15) { 
          if (T_Top10Percent_Ranked.length > 0 && T_Top20_Ranked.length > 0) {
            strategyUsed = "Top10%_Ranked vs Top20_Ranked";
            newBattlePokemon = pickDistinctFromPools(T_Top10Percent_Ranked, T_Top20_Ranked, battleSize, lastBattleRef.current);
          }
        } else if (roll < 30) { 
          if (T_Top10Percent_Ranked.length > 0 && T_Top25Percent_Ranked.length > 0) {
            strategyUsed = "Top10%_Ranked vs Top25%_Ranked";
            newBattlePokemon = pickDistinctFromPools(T_Top10Percent_Ranked, T_Top25Percent_Ranked, battleSize, lastBattleRef.current);
          }
        } else if (roll < 50) { 
          if (T_Top25Percent_Ranked.length > 0 && T_Top50Percent_Ranked.length > 0) {
            strategyUsed = "Top25%_Ranked vs Top50%_Ranked";
            newBattlePokemon = pickDistinctFromPools(T_Top25Percent_Ranked, T_Top50Percent_Ranked, battleSize, lastBattleRef.current);
          }
        } else if (roll < 70) { 
          if (T_Top50Percent_Ranked.length > 0 && T_Bottom50Percent_Ranked.length > 0) {
            strategyUsed = "Top50%_Ranked vs Bottom50%_Ranked";
            newBattlePokemon = pickDistinctFromPools(T_Top50Percent_Ranked, T_Bottom50Percent_Ranked, battleSize, lastBattleRef.current);
          }
        } else { 
          if (T_Unranked.length > 0 && T_Top50Percent_Ranked.length > 0) {
            strategyUsed = "Unranked vs Top50%_Ranked";
            newBattlePokemon = pickDistinctFromPools(T_Unranked, T_Top50Percent_Ranked, battleSize, lastBattleRef.current);
          } else if (T_Unranked.length >= battleSize) { 
            strategyUsed = "Two_Unranked (Fallback for Unranked strategy)";
            newBattlePokemon = pickDistinctFromPools(T_Unranked, T_Unranked, battleSize, lastBattleRef.current);
          }
        }
    } // End of pairs-specific tiered strategy
    
    console.log(`[useBattleStarter] Pairing strategy attempted: ${strategyUsed}, Result length: ${newBattlePokemon.length}`);

    // Fallback if a strategy failed or produced an insufficient pair/triplet
    if (newBattlePokemon.length < battleSize) {
      console.warn(`[useBattleStarter] Strategy '${strategyUsed}' failed or produced insufficient Pokémon (found ${newBattlePokemon.length}, needed ${battleSize}). Using general random fallback.`);
      newBattlePokemon = pickDistinctFromPools(allPokemonForGeneration, allPokemonForGeneration, battleSize, lastBattleRef.current);
      
      // If even the broadest pick fails, it's a critical issue with data or distinct picking.
      if (newBattlePokemon.length < battleSize) {
          console.error("[useBattleStarter] Fallback with allPokemonForGeneration also failed to produce enough distinct Pokemon. (Pool size:", allPokemonForGeneration.length, "Needed:", battleSize,")");
          // Attempt a very simple slice as a last resort, may contain non-distinct if allPokemonForGeneration is small or has duplicates (which it shouldn't by ID)
          if (allPokemonForGeneration.length >= battleSize) {
              newBattlePokemon = shuffleArray([...allPokemonForGeneration]).slice(0, battleSize);
              console.warn("[useBattleStarter] Last resort fallback: Sliced from allPokemonForGeneration. Distinctness not fully guaranteed if list is small with similar IDs.");
          } else {
              setCurrentBattle([]); 
              return []; // Cannot form a battle
          }
      }
    }
    // ----- END OF NEW TIERED PAIRING LOGIC -----
    ```

    
    // Get the last battle Pokemon IDs from ref for immediate comparison
    const lastBattleIds = lastBattleRef.current;
    console.log("Last battle IDs:", lastBattleIds);
    
    // Get the recently seen Pokemon IDs
    const seenPokemonIds = Array.from(recentlySeenPokemon.current);
    
    // CRITICAL: Filter out the Pokemon from the last battle to avoid repetition
    if (lastBattleIds.length > 0) {
      console.log("Filtering out previously used Pokemon:", lastBattleIds);
      
      // Strictly filter out Pokemon that were in the last battle
      availablePokemon = availablePokemon.filter(p => !lastBattleIds.includes(p.id));
      
      // Ensure we have enough Pokemon left
      if (availablePokemon.length < battleSize) {
        console.log("Not enough unique Pokémon left after filtering, using shuffle strategy");
        
        // If we don't have enough Pokemon after filtering, use the full list but ensure
        // we don't get the exact same combination as before
        availablePokemon = [...pokemonList];
        
        // Still try to avoid the last battle's Pokemon if possible
        const preferredPokemon = availablePokemon.filter(p => !lastBattleIds.includes(p.id));
        if (preferredPokemon.length >= battleSize) {
          availablePokemon = preferredPokemon;
        } else {
          // Force more variety if we have too many consecutive repeats
          consecutiveRepeatsRef.current += 1;
        }
      }
    }
    
    // Also try to avoid recently seen Pokemon (beyond just the last battle)
    if (seenPokemonIds.length > 0 && availablePokemon.length > battleSize * 3) {
      // Prefer Pokemon that haven't been seen recently
      const preferredPokemon = availablePokemon.filter(p => !seenPokemonIds.includes(p.id));
      
      if (preferredPokemon.length >= battleSize) {
        availablePokemon = preferredPokemon;
      }
    }
    
    // Better shuffle algorithm
    const shuffled = shuffleArray(availablePokemon);
    
    
    // Double-check to ensure we don't get the exact same battle
    if (lastBattleIds.length > 0) {
      // Extract IDs from the new battle Pokemon
      const newBattleIds = newBattlePokemon.map(p => p.id).sort();
      const sortedLastIds = [...lastBattleIds].sort();
      
      // Check if the new battle contains exactly the same Pokemon (regardless of order)
      const isSameBattle = newBattleIds.length === sortedLastIds.length && 
        newBattleIds.every((id, i) => id === sortedLastIds[i]);
      
      // If we got the same battle or have too many repeats, force a different selection
      if (isSameBattle || consecutiveRepeatsRef.current > 2) {
        console.log("Still got the same Pokemon or too many repeats, forcing different selection...");
        consecutiveRepeatsRef.current += 1;
        
        // Force a completely different selection
        if (shuffled.length > battleSize * 2) {
          newBattlePokemon = shuffled.slice(battleSize, battleSize * 2);
        } else {
          // Last resort - just take a new random selection from the full list
          // but with a different random seed
          newBattlePokemon = shuffleArray(pokemonList).slice(0, battleSize);
            
          // Ensure at least one Pokemon is different from last battle
          const forceNewIndex = Math.floor(Math.random() * battleSize);
          let replacementOptions = pokemonList.filter(p => !lastBattleIds.includes(p.id));
          
          if (replacementOptions.length > 0) {
            const forcedDifferentPokemon = replacementOptions[Math.floor(Math.random() * replacementOptions.length)];
            newBattlePokemon[forceNewIndex] = forcedDifferentPokemon;
          }
        }
      } else {
        // Reset consecutive repeats counter since we got a different battle
        consecutiveRepeatsRef.current = 0;
      }
    }
    
    // Save this battle to track and avoid repetition
    const newBattleIds = newBattlePokemon.map(p => p.id);
    setPreviousBattles(prev => [...prev, newBattleIds].slice(-10)); // Keep only the last 10 battles
    
    // Update the ref with current battle IDs for immediate use in next battle
    lastBattleRef.current = newBattleIds;
    
    // Add these Pokemon to the recently seen set (keep only the last 20 Pokemon)
    newBattleIds.forEach(id => {
      recentlySeenPokemon.current.add(id);
      if (recentlySeenPokemon.current.size > 20) {
        // Remove the oldest Pokemon from the set
        recentlySeenPokemon.current.delete(Array.from(recentlySeenPokemon.current)[0]);
      }
    });
    
    console.log("New battle Pokémon:", newBattlePokemon.map(p => p.name));
    
    // Update React state with the new battle Pokémon
    setCurrentBattle(newBattlePokemon);
    
    return newBattlePokemon;
  };

  return { startNewBattle };
};
