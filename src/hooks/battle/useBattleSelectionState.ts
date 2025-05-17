import { useState, useEffect, useMemo } from "react";
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

  const getCurrentRankings = (): Pokemon[] => {
    if (battleResults.length === 0) return [];
    const pokemonMap = new Map<number, Pokemon>();
    battleResults.forEach(result => {
      if (!pokemonMap.has(result.winner.id)) {
        pokemonMap.set(result.winner.id, result.winner);
      }
    });
    battleResults.forEach(result => {
      if (!pokemonMap.has(result.loser.id)) {
        pokemonMap.set(result.loser.id, result.loser);
      }
    });
    return Array.from(pokemonMap.values());
  };
 

const startBattleFromHook = createBattleStarter(
  allPokemon,
  allPokemon,
  getCurrentRankings(),
  setCurrentBattle
);



  const processBattleResult = (
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType = currentBattleType
  ) => {
    if (selectedPokemonIds.length === 0 || currentBattlePokemon.length === 0) return;
    if (battleType === "pairs") {
      const winner = currentBattlePokemon.find(p => selectedPokemonIds.includes(p.id));
      const loser = currentBattlePokemon.find(p => !selectedPokemonIds.includes(p.id));
      if (winner && loser) {
        setBattleResults(prev => [...prev, { winner, loser }]);
      }
    } else {
      const winners = currentBattlePokemon.filter(p => selectedPokemonIds.includes(p.id));
      const losers = currentBattlePokemon.filter(p => !selectedPokemonIds.includes(p.id));
      if (winners.length > 0 && losers.length > 0) {
        setBattleResults(prev => {
          const newResults = [...prev];
          winners.forEach(winner => {
            losers.forEach(loser => {
              newResults.push({ winner, loser });
            });
          });
          return newResults;
        });
      }
    }
  };

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

  const startNewBattle = (pokemonList: Pokemon[], battleType: BattleType = currentBattleType) => {
    console.log("startNewBattle with", pokemonList?.length, battleType);
    if (!pokemonList || pokemonList.length < 2) {
      console.warn("Not enough Pokémon for a battle.");
      return;
    }

    if (battleType !== currentBattleType) {
      setCurrentBattleType(battleType);
      localStorage.setItem('pokemon-ranker-battle-type', battleType);
    }

    if (allPokemon.length === 0) {
      setAllPokemon(pokemonList);
    }

    const newBattlePokemon = startBattleFromHook.startNewBattle(battleType);

    if (newBattlePokemon && newBattlePokemon.length > 0) {
      setCurrentBattle(newBattlePokemon);
      setSelectedPokemon([]);
    } else {
      console.error("Failed to create new battle - no Pokémon returned");
    }
  };

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
