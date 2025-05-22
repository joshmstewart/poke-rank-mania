import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleSelectionManager = (
  processBattleResult: (selectedPokemonIds: number[], currentBattlePokemon: Pokemon[], battleType: BattleType) => void,
  battleType: BattleType,
  selectedPokemon: number[],
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  currentBattle: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  battleHistory: { battle: Pokemon[]; selected: number[] }[],
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[]; selected: number[] }[]>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>
) => {
  const handlePokemonSelect = useCallback(
    (pokemonId: number) => {
      if (!currentBattle || currentBattle.length === 0) return;

      setSelectedPokemon((prev) => {
        const newSelected = [...prev, pokemonId];

        if (battleType === "pairs") {
          const currentBattleCopy = [...currentBattle];
          setBattleHistory((prevHistory) => {
            const updatedHistory = [
              ...prevHistory,
              { battle: currentBattleCopy, selected: newSelected },
            ];
            console.log(
              "🔄 Updated battle history explicitly by appending. New length:",
              updatedHistory.length
            );
            return updatedHistory;
          });

          processBattleResult(newSelected, currentBattle, battleType);
        }

        return newSelected;
      });
    },
    [currentBattle, battleType, setBattleHistory, processBattleResult, setSelectedPokemon]
  );

  const handleTripletSelectionComplete = useCallback(() => {
    if (selectedPokemon.length === 0 || !currentBattle || currentBattle.length === 0) return;

    const currentBattleCopy = [...currentBattle];
    setBattleHistory((prev) => {
      const updatedHistory = [
        ...prev,
        { battle: currentBattleCopy, selected: selectedPokemon },
      ];
      console.log(
        "🔄 Updated battle history explicitly by appending. New length:",
        updatedHistory.length
      );
      return updatedHistory;
    });

    processBattleResult(selectedPokemon, currentBattle, battleType);
    setSelectedPokemon([]);
  }, [selectedPokemon, currentBattle, battleType, setBattleHistory, processBattleResult, setSelectedPokemon]);

  const goBack = useCallback(() => {
    if (battleHistory.length === 0) return;

    const newHistory = [...battleHistory];
    const lastBattle = newHistory.pop();
    setBattleHistory(newHistory);
    console.log("🔄 Updating battle history explicitly. New length:", newHistory.length);

    if (lastBattle) {
      setCurrentBattle(lastBattle.battle);
      setSelectedPokemon([]);
    }

    setBattlesCompleted((prev) => Math.max(0, prev - 1));
  }, [battleHistory, setBattleHistory, setCurrentBattle, setSelectedPokemon, setBattlesCompleted]);

  const handleSelection = useCallback(
    (selectedPokemonIds: number[]) => {
      console.log("⚫ useBattleSelectionManager: Pokémon selected, incrementing battle");
      processBattleResult(selectedPokemonIds, currentBattle, battleType);
    },
    [processBattleResult, currentBattle, battleType]
  );

  return {
    handleSelection,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    goBack,
  };
};
