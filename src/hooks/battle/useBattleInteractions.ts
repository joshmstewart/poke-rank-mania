
import { useCallback, useState } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleNavigation } from "./useBattleNavigation";

export const useBattleInteractions = (
  currentBattle: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  selectedPokemon: number[],
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  battleResults: any[],
  setBattleResults: React.Dispatch<React.SetStateAction<any[]>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  onBattleComplete: (battleType: BattleType, currentBattle: Pokemon[]) => void,
  onGoBack: () => void,
  battleType: BattleType,
  processBattleResult: (selectedPokemonIds: number[], currentBattlePokemon: Pokemon[], battleType: BattleType, currentSelectedGeneration?: number) => void
) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const { goBack: navigationGoBack } = useBattleNavigation(
    battleHistory,
    setBattleHistory,
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    () => {},
    setSelectedPokemon
  );

  const handlePokemonSelect = useCallback(
    (id: number) => {
      if (currentBattle.length === 0) return;

      // Get the updated selected Pokémon
      const updatedSelected = [...selectedPokemon, id];

      // For pairs mode, immediately process once a Pokémon is selected
      if (battleType === "pairs") {
        const currentBattleCopy = [...currentBattle];
        
        // Save to history before processing
        const updatedHistory = [
          ...battleHistory,
          { battle: currentBattleCopy, selected: updatedSelected }
        ];
        setBattleHistory(updatedHistory);
console.log("🔄 Updating battle history explicitly. New length:", updatedHistory.length);

        
        // Process the battle results
        setIsProcessing(true);
        try {
          console.log("useBattleInteractions: Processing pair battle result");
          processBattleResult(updatedSelected, currentBattleCopy, battleType);
          console.log("useBattleInteractions: Battle processed successfully");
        } catch (e) {
          console.error("Error processing battle:", e);
        } finally {
          setIsProcessing(false);
        }
      }

      // Update the selected Pokémon state
      setSelectedPokemon(updatedSelected);
    },
    [
      battleHistory,
      battleType,
      currentBattle,
      processBattleResult,
      selectedPokemon,
      setBattleHistory,
      setSelectedPokemon
    ]
  );

  const handleGoBack = useCallback(() => {
    console.log("useBattleInteractions: Handling go back");
    navigationGoBack(setCurrentBattle, battleType);
    onGoBack();
  }, [navigationGoBack, onGoBack, setCurrentBattle, battleType]);

  return {
    handlePokemonSelect,
    handleGoBack,
    isProcessing
  };
};
