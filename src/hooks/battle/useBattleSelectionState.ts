
import { useState } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleResult, BattleType } from "./types";
import { useBattleStarter } from "./useBattleStarter";

export const useBattleSelectionState = () => {
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [battleResults, setBattleResults] = useState<BattleResult>([]);
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);

  const { startNewBattle: initiateNewBattle } = useBattleStarter();
  
  // Define startNewBattle function
  const startNewBattle = (pokemonList: Pokemon[], battleType: BattleType = "pairs") => {
    if (!pokemonList || pokemonList.length < 2) {
      // Not enough Pokémon for a battle
      console.log("Not enough Pokémon for a battle:", pokemonList?.length || 0);
      return;
    }
    
    const newBattlePokemon = initiateNewBattle(pokemonList, battleType);
    setCurrentBattle(newBattlePokemon);
    setSelectedPokemon([]);
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
    startNewBattle
  };
};
