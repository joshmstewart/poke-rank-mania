
import { useCallback, useRef, useState, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";

export const useBattleInteractions = (
  currentBattle: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  selectedPokemon: number[],
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  battleResults: SingleBattle[],
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  onTripletComplete: (battleType: BattleType, currentBattle: Pokemon[]) => void,
  onGoBack: () => void,
  battleType: BattleType,
  processBattleResult: (selectedPokemonIds: number[], currentBattlePokemon: Pokemon[], battleType: BattleType, selectedGeneration?: number) => void
) => {
  const processingStateRef = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // ENHANCED: Add battle count context to all logs
  const currentBattleCount = parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10);
  
  console.log(`🔄 [LOADING_CIRCLES_ENHANCED] useBattleInteractions Battle #${currentBattleCount + 1} isProcessing:`, {
    isProcessing,
    processingStateRef: processingStateRef.current,
    battlesCompleted,
    currentBattleLength: currentBattle?.length || 0,
    timestamp: new Date().toISOString()
  });
  
  // ENHANCED: Specific logging for battles 10-11
  if (currentBattleCount === 10 || currentBattleCount === 11) {
    console.error(`🔥 [BATTLE_10_11_PROCESSING] Battle ${currentBattleCount + 1} processing state:`, {
      isProcessing,
      processingStateRef: processingStateRef.current,
      willShowLoadingCircles: isProcessing || processingStateRef.current
    });
  }

  // CRITICAL FIX: Reset processing state when battle changes
  useEffect(() => {
    if (currentBattle && currentBattle.length > 0) {
      console.log(`🔄 [PROCESSING_RESET_ENHANCED] Battle #${currentBattleCount + 1} changed, resetting processing state`);
      processingStateRef.current = false;
      setIsProcessing(false);
    }
  }, [currentBattle.map(p => p.id).join(','), currentBattleCount]);

  // CRITICAL FIX: Reset processing state when battles completed changes (indicates battle finished)
  useEffect(() => {
    console.log(`🔄 [PROCESSING_RESET_ENHANCED] Battles completed changed to ${battlesCompleted}, resetting processing state`);
    processingStateRef.current = false;
    setIsProcessing(false);
  }, [battlesCompleted]);

  // CRITICAL FIX: Reset processing state on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log(`🔄 [PROCESSING_RESET_ENHANCED] Initial reset of processing state for Battle #${currentBattleCount + 1}`);
      processingStateRef.current = false;
      setIsProcessing(false);
    }, 1000); // Give system time to initialize

    return () => clearTimeout(timer);
  }, [currentBattleCount]);

  const handlePokemonSelect = useCallback((id: number) => {
    console.log(`🖱️ [POKEMON_SELECT_ENHANCED] Battle #${currentBattleCount + 1} handlePokemonSelect:`, {
      id,
      isProcessing,
      processingStateRef: processingStateRef.current,
      battleType,
      currentBattleIds: currentBattle?.map(p => p.id) || [],
      timestamp: new Date().toISOString()
    });

    // ENHANCED: Specific logging for battles 10-11
    if (currentBattleCount === 10 || currentBattleCount === 11) {
      console.error(`🔥 [BATTLE_10_11_SELECT] Battle ${currentBattleCount + 1} Pokemon select:`, {
        pokemonId: id,
        isProcessing,
        processingStateRef: processingStateRef.current,
        willProcess: !processingStateRef.current
      });
    }

    if (processingStateRef.current) {
      console.error(`🛑 [LOADING_CIRCLES_BLOCK] Battle #${currentBattleCount + 1}: Processing in progress, ignoring click`);
      return;
    }

    console.log(`✅ [LOADING_CIRCLES_PROCESS] Battle #${currentBattleCount + 1}: Processing click for Pokemon ${id}`);
    processingStateRef.current = true;
    setIsProcessing(true);

    try {
      if (battleType === "pairs") {
        // For pairs, process the battle immediately
        console.log(`🔄 [PAIRS_ENHANCED] Battle #${currentBattleCount + 1}: Processing pairs battle with winner: ${id}`);
        processBattleResult([id], currentBattle, battleType);
        
        // Add to history
        setBattleHistory(prev => [...prev, { battle: currentBattle, selected: [id] }]);
        
        // CRITICAL FIX: Reset processing state immediately after calling processBattleResult
        setTimeout(() => {
          console.log(`🔄 [PROCESSING_RESET_ENHANCED] Battle #${currentBattleCount + 1}: Resetting processing state after pairs battle`);
          processingStateRef.current = false;
          setIsProcessing(false);
        }, 100);
      } else {
        // For triplets, just update selection
        console.log(`🔄 [TRIPLETS_ENHANCED] Battle #${currentBattleCount + 1}: Updating selection for triplets`);
        if (selectedPokemon.includes(id)) {
          setSelectedPokemon(prev => prev.filter(pokemonId => pokemonId !== id));
        } else {
          setSelectedPokemon(prev => [...prev, id]);
        }
        
        // Reset processing for triplets since we're just selecting
        processingStateRef.current = false;
        setIsProcessing(false);
      }
    } catch (error) {
      console.error(`❌ [POKEMON_SELECT_ERROR] Battle #${currentBattleCount + 1}: Error in handlePokemonSelect:`, error);
      processingStateRef.current = false;
      setIsProcessing(false);
    }
  }, [currentBattle, selectedPokemon, setSelectedPokemon, battleType, processBattleResult, setBattleHistory, isProcessing, currentBattleCount]);

  const handleGoBack = useCallback(() => {
    if (processingStateRef.current) return;
    
    console.log(`🔄 [GO_BACK_ENHANCED] Battle #${currentBattleCount + 1}: Going back in battle`);
    onGoBack();
  }, [onGoBack, currentBattleCount]);

  return {
    handlePokemonSelect,
    handleGoBack,
    isProcessing: processingStateRef.current || isProcessing
  };
};
