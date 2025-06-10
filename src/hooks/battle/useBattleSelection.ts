
import { useCallback, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleSelection = (
  selectedPokemon: number[],
  setSelectedPokemon: any,
  battleType: BattleType,
  currentBattle: Pokemon[],
  selectedGeneration: number,
  processBattleResultWithRefinement: any,
  handleBattleCompleted: any
) => {
  console.log(
    "🔄 [BATTLE_SELECTION_DEBUG] Hook initialized with setter:",
    setSelectedPokemon
  );

  const handlePokemonSelect = useCallback((pokemonId: number) => {
    console.log(`🎯 [POKEMON_SELECT_ULTRA_DEBUG] Pokemon ${pokemonId} selected. Current selections: ${JSON.stringify(selectedPokemon)}`);
    
    if (selectedPokemon.includes(pokemonId)) {
      console.log(`🎯 [POKEMON_SELECT_ULTRA_DEBUG] Pokemon ${pokemonId} already selected, ignoring`);
      return;
    }

    const newSelection = [...selectedPokemon, pokemonId];
    console.log(`🎯 [POKEMON_SELECT_ULTRA_DEBUG] Adding Pokemon ${pokemonId}. New selection: ${JSON.stringify(newSelection)}`);
    
    setSelectedPokemon(newSelection);

    // CRITICAL FIX: Track that this battle was actually completed by the user
    handleBattleCompleted(newSelection, currentBattle);

    if (battleType === "pairs" && newSelection.length === 1) {
      console.log(`🎯 [POKEMON_SELECT_ULTRA_DEBUG] Pairs battle completed with selection: ${newSelection}`);
      processBattleResultWithRefinement(newSelection, currentBattle, battleType, selectedGeneration);
    }
  }, [selectedPokemon, setSelectedPokemon, battleType, currentBattle, selectedGeneration, processBattleResultWithRefinement, handleBattleCompleted]);

  useEffect(() => {
    console.log(
      "🔄 [BATTLE_SELECTION_DEBUG] selectedPokemon updated:",
      selectedPokemon
    );
  }, [selectedPokemon]);

  return { handlePokemonSelect };
};
