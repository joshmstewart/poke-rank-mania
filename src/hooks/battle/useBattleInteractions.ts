
import { useCallback, useState, useEffect } from "react";
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
  const [lastSelectedId, setLastSelectedId] = useState<number | null>(null);

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

  // Reset selectedPokemon when battle type changes or current battle changes
  useEffect(() => {
    console.log("🔄 Resetting selected pokemon due to battle change or type change");
    setSelectedPokemon([]);
    setLastSelectedId(null);
  }, [battleType, setSelectedPokemon, currentBattle]);

  const handlePokemonSelect = useCallback(
    (id: number) => {
      if (currentBattle.length === 0) return;
      
      // Prevent duplicate processing of the same Pokemon
      if (lastSelectedId === id && battleType === "pairs") {
        console.log(`🔄 Ignoring duplicate selection of Pokemon ID: ${id}`);
        return;
      }
      
      // Prevent processing if already in progress
      if (isProcessing) {
        console.log("🛑 handlePokemonSelect: Processing in progress, ignoring click");
        return;
      }

      // CRITICAL FIX: For pair battles, we ALWAYS set to just the newly selected Pokemon ID
      // This must be a new array with just the single ID to prevent accumulation
      let updatedSelected: number[];
      
      if (battleType === "pairs") {
        // For pairs, we always set to ONLY the newly selected Pokemon ID
        updatedSelected = [id]; // <-- Critical fix: Always a new single-element array
        console.log(`🛠️ [PAIR BATTLE FIX] Setting selection to a SINGLE ID: [${id}]`);
      } else {
        // For triplets, we accumulate selections (up to 2)
        // If we already have 2 selections, replace the array with just this new ID
        if (selectedPokemon.length >= 2) {
          updatedSelected = [id];
        } else {
          updatedSelected = [...selectedPokemon, id];
        }
      }

      // Track this selection to prevent duplicates
      setLastSelectedId(id);

      // Update the selected Pokémon state
      console.log(`🔍 [BEFORE STATE UPDATE] Current selectedPokemon: [${selectedPokemon.join(', ')}]`);
      console.log(`🔍 [STATE UPDATE] Setting selectedPokemon to: [${updatedSelected.join(', ')}]`);
      setSelectedPokemon(updatedSelected);
      
      // Log after state update (though this will show the previous state due to React's batching)
      console.log(`🎮 handlePokemonSelect: Updated selection to [${updatedSelected.join(', ')}] for ${battleType} battle`);

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
          // CRITICAL FIX: Always use the updatedSelected array directly, not the state variable
          // which might not have updated yet due to React's batching of state updates
          console.log(`[DEBUG useBattleInteractions] Passing to processBattleResult - selectedPokemonIds:`, updatedSelected);
          processBattleResult(updatedSelected, currentBattleCopy, battleType);
          console.log("useBattleInteractions: Battle processed successfully");
        } catch (e) {
          console.error("Error processing battle:", e);
        } finally {
          setIsProcessing(false);
        }
      }
    },
    [
      battleHistory,
      battleType,
      currentBattle,
      processBattleResult,
      selectedPokemon,
      setBattleHistory,
      setSelectedPokemon,
      isProcessing,
      lastSelectedId
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
