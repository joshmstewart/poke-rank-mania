
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleInteractions } from "./useBattleInteractions";

export const useBattleActionsInteractions = (
  currentBattle: Pokemon[],
  stableSetCurrentBattle: (battle: Pokemon[]) => void,
  selectedPokemon: number[],
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  battleResults: any[],
  setBattleResults: React.Dispatch<React.SetStateAction<any[]>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  battleType: BattleType,
  processBattleResult: (selectedPokemonIds: number[], currentBattlePokemon: Pokemon[], battleType: BattleType, selectedGeneration?: number) => void,
  goBack: () => void
) => {
  // Use interactions hook for Pokemon selection handling
  const {
    handlePokemonSelect,
    handleGoBack: goBackHelper,
    isProcessing
  } = useBattleInteractions(
    currentBattle,
    stableSetCurrentBattle,
    selectedPokemon,
    setSelectedPokemon,
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    battleHistory,
    setBattleHistory,
    (battleType: BattleType, currentBattle: Pokemon[]) => {
      if (battleType === "triplets") {
        processBattleResult(selectedPokemon, currentBattle, battleType, 0);
      }
    },
    () => {
      console.log("Going back in battle navigation");
      goBack();
    },
    battleType,
    processBattleResult
  );

  return {
    handlePokemonSelect,
    isProcessing
  };
};
