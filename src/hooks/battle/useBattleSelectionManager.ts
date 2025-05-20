import { useState, useRef, useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleSelectionManager = (
  battleHistory: { battle: Pokemon[]; selected: number[] }[],
  setBattleHistory: React.Dispatch<
    React.SetStateAction<{ battle: Pokemon[]; selected: number[] }[]>
  >,
  processBattleResult: (
    selections: number[],
    battleType: BattleType,
    currentBattle: Pokemon[]
  ) => void,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  const [selectedPokemon, setLocalSelectedPokemon] = useState<number[]>([]);
  const isProcessingRef = useRef(false);

  const handlePokemonSelect = useCallback(
    (id: number, battleType: BattleType, currentBattle: Pokemon[]) => {
      if (isProcessingRef.current) {
        console.log(
          `useBattleSelectionManager: Ignoring selection, processing in progress`
        );
        return;
      }

      console.log(
        `useBattleSelectionManager: Handling selection for id: ${id}, battleType: ${battleType}`
      );

      isProcessingRef.current = true;

      if (battleType === "pairs") {
        setBattleHistory((prev) => [
          ...prev,
          { battle: [...currentBattle], selected: [id] },
        ]);

        setLocalSelectedPokemon([id]);
        setSelectedPokemon([id]);

        processBattleResult([id], battleType, currentBattle);

        // Clear selection after processing
        setLocalSelectedPokemon([]);
        setSelectedPokemon([]);
      } else {
        // Triplets mode (toggle selection)
        setLocalSelectedPokemon((prevSelected) => {
          if (prevSelected.includes(id)) {
            return prevSelected.filter((pokemonId) => pokemonId !== id);
          } else {
            return [...prevSelected, id];
          }
        });
      }

      // Reset processing after short delay to ensure the next battle can start
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 250); // 250ms is sufficient for state updates
    },
    [
      setBattleHistory,
      setSelectedPokemon,
      processBattleResult,
    ]
  );

  const handleTripletSelectionComplete = useCallback(
    (battleType: BattleType, currentBattle: Pokemon[]) => {
      if (battleType === "pairs") {
        console.log(
          "useBattleSelectionManager: Skipping triplet completion for pairs mode"
        );
        return;
      }

      if (isProcessingRef.current || selectedPokemon.length === 0) {
        console.log(
          `useBattleSelectionManager: Ignoring triplet completion, processing in progress or no selection`
        );
        return;
      }

      console.log(
        "useBattleSelectionManager: Triplet selection complete with selections:",
        selectedPokemon
      );

      isProcessingRef.current = true;

      setBattleHistory((prev) => [
        ...prev,
        { battle: [...currentBattle], selected: [...selectedPokemon] },
      ]);

      processBattleResult(selectedPokemon, battleType, currentBattle);

      // Reset selections
      setLocalSelectedPokemon([]);
      setSelectedPokemon([]);

      setTimeout(() => {
        isProcessingRef.current = false;
      }, 250);
    },
    [
      selectedPokemon,
      setBattleHistory,
      processBattleResult,
      setSelectedPokemon,
    ]
  );

  return {
    selectedPokemon,
    setSelectedPokemon: setLocalSelectedPokemon,
    handlePokemonSelect,
    handleTripletSelectionComplete,
  };
};
