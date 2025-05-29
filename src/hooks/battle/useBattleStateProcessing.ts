
import { useCallback, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleStateProcessing = (
  selectedPokemon: number[],
  currentBattle: Pokemon[],
  battleType: BattleType,
  selectedGeneration: number,
  isAnyProcessing: boolean,
  isProcessingResult: boolean,
  processBattleResultWithRefinement: any,
  setIsBattleTransitioning: (transitioning: boolean) => void,
  setIsAnyProcessing: (processing: boolean) => void,
  startNewBattleWrapper: () => void
) => {
  const processingRef = useRef(false);

  const handleTripletSelectionComplete = useCallback(async () => {
    const expectedCount = battleType === "pairs" ? 1 : 2;
    console.log(`🔄 [SELECTION_COMPLETE_ULTRA_DEBUG] handleTripletSelectionComplete called:`, {
      selectedCount: selectedPokemon.length,
      expectedCount,
      battleType,
      selectedPokemon,
      isProcessing: isAnyProcessing,
      isProcessingResult,
      processingRef: processingRef.current
    });

    if (selectedPokemon.length !== expectedCount) {
      console.warn(`❌ [SELECTION_COMPLETE_ULTRA_DEBUG] Incorrect number of Pokémon selected: ${selectedPokemon.length}, expected: ${expectedCount}`);
      return;
    }

    if (isAnyProcessing || isProcessingResult || processingRef.current) {
      console.warn(`❌ [SELECTION_COMPLETE_ULTRA_DEBUG] Already processing, ignoring duplicate call`);
      return;
    }

    console.log(`✅ [SELECTION_COMPLETE_ULTRA_DEBUG] Starting battle processing...`);
    processingRef.current = true;
    setIsBattleTransitioning(true);
    setIsAnyProcessing(true);

    try {
      await processBattleResultWithRefinement(
        selectedPokemon,
        currentBattle,
        battleType,
        selectedGeneration
      );

      console.log(`✅ [SELECTION_COMPLETE_ULTRA_DEBUG] Battle processed successfully`);
      
      // SPEED FIX: Reset processing state immediately
      processingRef.current = false;
      setIsBattleTransitioning(false);
      setIsAnyProcessing(false);
    } catch (error) {
      console.error("❌ [SELECTION_COMPLETE_ULTRA_DEBUG] Error processing battle result:", error);
      processingRef.current = false;
      setIsBattleTransitioning(false);
      setIsAnyProcessing(false);
    }
  }, [selectedPokemon, currentBattle, battleType, selectedGeneration, processBattleResultWithRefinement, isAnyProcessing, isProcessingResult, setIsBattleTransitioning, setIsAnyProcessing]);

  return {
    handleTripletSelectionComplete,
    processingRef
  };
};
