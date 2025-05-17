
import { useState, useEffect, useMemo, useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleResult, BattleType } from "./types";
import { createBattleStarter } from "./createBattleStarter";
import { useBattleProcessor } from "./useBattleProcessor";

export const useBattleSelectionState = () => {
  const storedBattleType = localStorage.getItem('pokemon-ranker-battle-type');
  const initialBattleType = (storedBattleType === "triplets") ? "triplets" : "pairs";
  console.log("useBattleSelectionState initialized with battleType:", initialBattleType);
  
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [battleResults, setBattleResults] = useState<BattleResult>([]);
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);
  const [currentBattleType, setCurrentBattleType] = useState<BattleType>(initialBattleType);

  // Generate current rankings from battle results
  const getCurrentRankings = useMemo(() => {
    return () => {
      if (battleResults.length === 0) return [];
      
      const pokemonMap = new Map<number, Pokemon>();
      
      // First add all winners
      battleResults.forEach(result => {
        if (!pokemonMap.has(result.winner.id)) {
          pokemonMap.set(result.winner.id, result.winner);
        }
      });
      
      // Then add losers if they haven't been added yet
      battleResults.forEach(result => {
        if (!pokemonMap.has(result.loser.id)) {
          pokemonMap.set(result.loser.id, result.loser);
        }
      });
      
      return Array.from(pokemonMap.values());
    };
  }, [battleResults]);
 
  // Current rankings, either from battle results or all Pokemon
  const currentRankings = useMemo(() => {
    return battleResults.length > 0 ? getCurrentRankings() : allPokemon;
  }, [battleResults, allPokemon, getCurrentRankings]);

  // Initialize battle starter function without useState inside the memo
  const battleStarter = useMemo(() => {
    if (!allPokemon || allPokemon.length === 0) {
      return null;
    }
    return createBattleStarter(
      allPokemon,
      allPokemon,
      currentRankings,
      setCurrentBattle
    );
  }, [allPokemon, currentRankings]);

  // Process battle result
  const processBattleResult = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType = currentBattleType
  ) => {
    if (!selectedPokemonIds || selectedPokemonIds.length === 0 || !currentBattlePokemon || currentBattlePokemon.length === 0) {
      console.error("Invalid battle data:", { selectedPokemonIds, currentBattlePokemon });
      return;
    }
    
    if (battleType === "pairs") {
      // For pairs, we have a winner and a loser
      const winner = currentBattlePokemon.find(p => selectedPokemonIds.includes(p.id));
      const loser = currentBattlePokemon.find(p => !selectedPokemonIds.includes(p.id));
      
      if (winner && loser) {
        console.log(`Battle result: ${winner.name} beats ${loser.name}`);
        setBattleResults(prev => [...prev, { winner, loser }]);
      } else {
        console.error("Couldn't determine winner/loser:", { selectedPokemonIds, currentBattlePokemon });
      }
    } else {
      // For triplets, each selected Pokemon beats each unselected one
      const winners = currentBattlePokemon.filter(p => selectedPokemonIds.includes(p.id));
      const losers = currentBattlePokemon.filter(p => !selectedPokemonIds.includes(p.id));
      
      if (winners.length > 0 && losers.length > 0) {
        setBattleResults(prev => {
          const newResults = [...prev];
          winners.forEach(winner => {
            losers.forEach(loser => {
              console.log(`Battle result: ${winner.name} beats ${loser.name}`);
              newResults.push({ winner, loser });
            });
          });
          return newResults;
        });
      } else {
        console.error("Invalid triplet selection:", { winners, losers, selectedPokemonIds });
      }
    }
  }, [currentBattleType]);

  // Monitor for battle type changes in local storage
  useEffect(() => {
    const handleStorageChange = () => {
      const newBattleType = localStorage.getItem('pokemon-ranker-battle-type') as BattleType;
      if (newBattleType && newBattleType !== currentBattleType) {
        console.log("Storage change detected:", newBattleType);
        setCurrentBattleType(newBattleType);
      }
    };
    
    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentBattleType]);

  // Start a new battle
  const startNewBattle = useCallback((pokemonList: Pokemon[], battleType: BattleType = currentBattleType) => {
    console.log("startNewBattle with", pokemonList?.length, battleType);
    
    if (!pokemonList || pokemonList.length < 2) {
      console.warn("Not enough Pokémon for a battle.");
      return;
    }

    // Update battle type if different
    if (battleType !== currentBattleType) {
      setCurrentBattleType(battleType);
      localStorage.setItem('pokemon-ranker-battle-type', battleType);
    }

    // Initialize allPokemon if empty
    if (allPokemon.length === 0) {
      setAllPokemon(pokemonList);
    }

    try {
      // Start a new battle using our hook
      if (battleStarter) {
        const newBattlePokemon = battleStarter.startNewBattle(battleType);
        
        if (newBattlePokemon && newBattlePokemon.length > 0) {
          // Reset selected Pokemon and set the new battle
          setSelectedPokemon([]);
          setCurrentBattle(newBattlePokemon);
          console.log("New battle started with:", newBattlePokemon.map(p => p.name).join(", "));
        } else {
          console.error("Failed to create new battle - no Pokémon returned");
        }
      } else {
        console.error("Battle starter not initialized");
        // Initialize with random pokemon as fallback
        if (pokemonList && pokemonList.length >= 2) {
          const shuffled = [...pokemonList].sort(() => Math.random() - 0.5);
          const selectedForBattle = shuffled.slice(0, battleType === "pairs" ? 2 : 3);
          setCurrentBattle(selectedForBattle);
          console.log("Fallback battle started with:", selectedForBattle.map(p => p.name).join(", "));
        }
      }
    } catch (error) {
      console.error("Error starting new battle:", error);
    }
  }, [allPokemon, battleStarter, currentBattleType]);

  return {
    currentBattle,
    setCurrentBattle,
    allPokemon,
    setAllPokemon,
    selectedPokemon,
    setSelectedPokemon,
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    battleHistory,
    setBattleHistory,
    startNewBattle,
    currentBattleType,
    processBattleResult
  };
};

