
import { useState, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleStarter = (
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  pokemonList: Pokemon[] = [],
  allPokemonForGeneration: Pokemon[] = [],
  currentFinalRankings: Pokemon[] = []
) => {
  // Track previous battles to avoid repetition
  const [previousBattles, setPreviousBattles] = useState<number[][]>([]);
  // Use ref to track the most recent battle Pokemon IDs for immediate comparison
  const lastBattleRef = useRef<number[]>([]);
  // Track seen Pokemon IDs to avoid repeating the same Pokemon too frequently
  const recentlySeenPokemon = useRef<Set<number>>(new Set());
  // Count consecutive repeats to force more variety
  const consecutiveRepeatsRef = useRef(0);
  // Counter to ensure we don't get stuck in infinite loops
  const attemptsRef = useRef(0);

  // Fisher-Yates shuffle algorithm for better randomization
  const shuffleArray = (array: Pokemon[]): Pokemon[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Utility function to roll a random number between 0-100
  const roll = () => Math.random() * 100;

  const startNewBattle = (battleType: BattleType) => {
    console.log("[useBattleStarter] startNewBattle called. battleType:", battleType);
    console.log("[useBattleStarter] Using allPokemonForGeneration length:", allPokemonForGeneration?.length || 0);
    console.log("[useBattleStarter] Using currentFinalRankings length:", currentFinalRankings?.length || 0);
    
    if (currentFinalRankings && currentFinalRankings.length > 0) {
      console.log("[useBattleStarter] Sample of currentFinalRankings:", currentFinalRankings.slice(0, 3).map(p => p.name));
    } else {
      console.log("[useBattleStarter] currentFinalRankings is empty or undefined at start of startNewBattle.");
    }
    
    console.log("Starting new battle with pokemonList length:", pokemonList?.length || 0);

    // Reset attempts counter
    attemptsRef.current = 0;

    const battleSize = battleType === "pairs" ? 2 : 3;

    // Safety check - do we have enough Pokémon?
    if (!allPokemonForGeneration || allPokemonForGeneration.length < battleSize) {
      console.error("[useBattleStarter] Not enough Pokémon in allPokemonForGeneration for a battle. Needed:", battleSize, "Got:", allPokemonForGeneration?.length || 0);
      setCurrentBattle([]); // Clear current battle if we can't form one
      return [];
    }

    // Initialize battle Pokémon array
    let newBattlePokemon: Pokemon[] = [];

    // Try to get a unique battle combination
    const getUniqueBattle = (): Pokemon[] => {
      // Simple fallback to guarantee we always get some Pokémon
      if (allPokemonForGeneration.length >= battleSize) {
        // Shuffle and take first N Pokémon as our baseline fallback
        const shuffled = shuffleArray([...allPokemonForGeneration]);
        newBattlePokemon = shuffled.slice(0, battleSize);
      }

      // Try advanced selection only if we have ranked Pokémon
      if (currentFinalRankings && currentFinalRankings.length > 0) {
        try {
          const ranked = [...currentFinalRankings]; // Make a copy to be safe
          const unrankedPool = allPokemonForGeneration.filter(p => 
            !ranked.some(r => r.id === p.id)
          );

          // Helper functions for slicing
          const getSliceByCount = (list: Pokemon[], count: number): Pokemon[] => 
            list.slice(0, Math.min(list.length, Math.max(0, count)));
          
          const getSliceByPercent = (list: Pokemon[], percent: number): Pokemon[] => {
            const count = Math.floor(list.length * (percent / 100));
            return list.slice(0, Math.max(0, count));
          };

          // Create tiered pools
          const T_Top20_Ranked = getSliceByCount(ranked, 20);
          const T_Top10Percent_Ranked = getSliceByPercent(ranked, 10);
          const T_Top25Percent_Ranked = getSliceByPercent(ranked, 25);
          const T_Top50Percent_Ranked = getSliceByPercent(ranked, 50);
          const T_Bottom50Percent_Ranked = ranked.filter(p => !T_Top50Percent_Ranked.some(topP => topP.id === p.id));
          const T_Unranked = [...unrankedPool];

          // Try to pick from our tiered pools
          const randomNumber = roll();
          let candidatePokemon: Pokemon[] = [];

          // For pairs battles only
          if (battleType === "pairs") {
            // Different strategies based on random roll
            if (randomNumber < 15 && T_Top10Percent_Ranked.length > 0 && T_Top20_Ranked.length > 0) {
              // Top 10% vs Top 20
              candidatePokemon = pickPokemonFromPools(T_Top10Percent_Ranked, T_Top20_Ranked);
            } 
            else if (randomNumber < 30 && T_Top10Percent_Ranked.length > 0 && T_Top25Percent_Ranked.length > 0) {
              // Top 10% vs Top 25%
              candidatePokemon = pickPokemonFromPools(T_Top10Percent_Ranked, T_Top25Percent_Ranked);
            }
            else if (randomNumber < 50 && T_Top25Percent_Ranked.length > 0 && T_Top50Percent_Ranked.length > 0) {
              // Top 25% vs Top 50%
              candidatePokemon = pickPokemonFromPools(T_Top25Percent_Ranked, T_Top50Percent_Ranked);
            }
            else if (randomNumber < 70 && T_Top50Percent_Ranked.length > 0 && T_Bottom50Percent_Ranked.length > 0) {
              // Top 50% vs Bottom 50%
              candidatePokemon = pickPokemonFromPools(T_Top50Percent_Ranked, T_Bottom50Percent_Ranked);
            }
            else if (T_Unranked.length > 0 && T_Top50Percent_Ranked.length > 0) {
              // Unranked vs Top 50%
              candidatePokemon = pickPokemonFromPools(T_Unranked, T_Top50Percent_Ranked);
            }
            else if (T_Unranked.length >= battleSize) {
              // Two unranked
              candidatePokemon = pickPokemonFromPools(T_Unranked, T_Unranked);
            }
          }

          // If we got valid candidates from our tiered selection, use them
          if (candidatePokemon.length === battleSize) {
            newBattlePokemon = candidatePokemon;
          }
        } catch (error) {
          console.error("Error in tiered selection:", error);
          // Fallback to our simple selection is handled below
        }
      }

      return newBattlePokemon;
    };

    // Get an initial battle set
    newBattlePokemon = getUniqueBattle();

    // Ensure we don't get the exact same battle as last time
    const lastBattleIds = lastBattleRef.current;
    if (lastBattleIds.length > 0) {
      // Get IDs of our new selection
      const newBattleIds = newBattlePokemon.map(p => p.id).sort();
      const sortedLastIds = [...lastBattleIds].sort();
      
      // Check if it's the same battle
      const isSameBattle = newBattleIds.length === sortedLastIds.length &&
        newBattleIds.every((id, i) => id === sortedLastIds[i]);
      
      // If we got the same battle or too many repeats, force a different selection
      if (isSameBattle || consecutiveRepeatsRef.current > 2) {
        console.log("Got the same Pokemon or too many repeats, forcing different selection");
        
        // Attempt to get a different battle up to 5 times
        let maxAttempts = 5;
        let foundDifferentBattle = false;
        
        while (!foundDifferentBattle && maxAttempts > 0) {
          const shuffled = shuffleArray([...allPokemonForGeneration]);
          
          // Get different Pokémon (from random parts of the shuffled array)
          const offset = Math.floor(Math.random() * (shuffled.length - battleSize));
          newBattlePokemon = shuffled.slice(offset, offset + battleSize);
          
          // Check if we got a different battle
          const attemptIds = newBattlePokemon.map(p => p.id).sort();
          const isDifferent = !attemptIds.every((id, i) => id === sortedLastIds[i]);
          
          if (isDifferent) {
            foundDifferentBattle = true;
            console.log("Found different battle after attempts:", 6 - maxAttempts);
          }
          
          maxAttempts--;
        }
        
        consecutiveRepeatsRef.current += 1;
      } else {
        // Reset repeat counter
        consecutiveRepeatsRef.current = 0;
      }
    }
    
    // Safety check: make sure we have enough Pokémon
    if (newBattlePokemon.length < battleSize) {
      console.error("Failed to create battle with correct size, using random selection");
      newBattlePokemon = shuffleArray([...allPokemonForGeneration]).slice(0, battleSize);
    }
    
    // Save this battle for future reference
    const newBattleIds = newBattlePokemon.map(p => p.id);
    setPreviousBattles(prev => [...prev, newBattleIds].slice(-10)); // Keep only last 10
    lastBattleRef.current = newBattleIds;
    
    // Add these Pokemon to recently seen set
    newBattleIds.forEach(id => {
      recentlySeenPokemon.current.add(id);
      if (recentlySeenPokemon.current.size > 20) {
        // Remove oldest Pokemon from the set
        recentlySeenPokemon.current.delete(Array.from(recentlySeenPokemon.current)[0]);
      }
    });
    
    console.log("New battle Pokémon:", newBattlePokemon.map(p => p.name));


    // Update React state
    setCurrentBattle(newBattlePokemon);
    // Save this battle as the last one
lastBattleRef.current = newBattlePokemon.map(p => p.id);

    
    return newBattlePokemon;
  };

  // Helper function to pick Pokémon from two pools
  function pickPokemonFromPools(pool1: Pokemon[], pool2: Pokemon[]): Pokemon[] {
    // Safety check
    if (!pool1?.length || !pool2?.length) return [];
    
    const battlePokemon: Pokemon[] = [];
    const used = new Set<number>();

    // Pick from pool 1
    const p1Index = Math.floor(Math.random() * pool1.length);
    const pokemon1 = pool1[p1Index];
    if (pokemon1) {
      battlePokemon.push(pokemon1);
      used.add(pokemon1.id);
    }

    // Pick from pool 2, avoiding duplicates
    let attempts = 0;
    while (battlePokemon.length < 2 && attempts < 10) {
      const p2Index = Math.floor(Math.random() * pool2.length);
      const pokemon2 = pool2[p2Index];
      
      if (pokemon2 && !used.has(pokemon2.id)) {
        battlePokemon.push(pokemon2);
        break;
      }
      
      attempts++;
    }

    return battlePokemon;
  }

  return { startNewBattle };
};
