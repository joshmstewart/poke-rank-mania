
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
  
  console.log(`🔄 [LOADING CIRCLES DEBUG] useBattleInteractions isProcessing:`, {
    isProcessing,
    processingStateRef: processingStateRef.current,
    timestamp: new Date().toISOString()
  });

  // CRITICAL FIX: Reset processing state when battle changes
  useEffect(() => {
    if (currentBattle && currentBattle.length > 0) {
      console.log(`🔄 [PROCESSING_RESET] Battle changed, resetting processing state`);
      processingStateRef.current = false;
      setIsProcessing(false);
    }
  }, [currentBattle.map(p => p.id).join(',')]);

  // CRITICAL FIX: Reset processing state when battles completed changes (indicates battle finished)
  useEffect(() => {
    console.log(`🔄 [PROCESSING_RESET] Battles completed changed to ${battlesCompleted}, resetting processing state`);
    processingStateRef.current = false;
    setIsProcessing(false);
  }, [battlesCompleted]);

  // CRITICAL FIX: Reset processing state on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log(`🔄 [PROCESSING_RESET] Initial reset of processing state`);
      processingStateRef.current = false;
      setIsProcessing(false);
    }, 1000); // Give system time to initialize

    return () => clearTimeout(timer);
  }, []);

  const handlePokemonSelect = useCallback((id: number) => {
    console.log(`🖱️ [LOADING CIRCLES DEBUG] useBattleInteractions handlePokemonSelect:`, {
      id,
      isProcessing,
      processingStateRef: processingStateRef.current,
      timestamp: new Date().toISOString()
    });

    if (processingStateRef.current) {
      console.log(`🛑 [LOADING CIRCLES] Processing in progress, ignoring click`);
      return;
    }

    console.log(`✅ [LOADING CIRCLES] Processing click for Pokemon ${id}`);
    processingStateRef.current = true;
    setIsProcessing(true);

    try {
      if (battleType === "pairs") {
        // For pairs, process the battle immediately
        console.log(`🔄 [PAIRS] Processing pairs battle with winner: ${id}`);
        processBattleResult([id], currentBattle, battleType);
        
        // Add to history
        setBattleHistory(prev => [...prev, { battle: currentBattle, selected: [id] }]);
        
        // CRITICAL FIX: Reset processing state immediately after calling processBattleResult
        setTimeout(() => {
          console.log(`🔄 [PROCESSING_RESET] Resetting processing state after pairs battle`);
          processingStateRef.current = false;
          setIsProcessing(false);
        }, 100);
      } else {
        // For triplets, just update selection
        console.log(`🔄 [TRIPLETS] Updating selection for triplets`);
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
      console.error("Error in handlePokemonSelect:", error);
      processingStateRef.current = false;
      setIsProcessing(false);
    }
  }, [currentBattle, selectedPokemon, setSelectedPokemon, battleType, processBattleResult, setBattleHistory, isProcessing]);

  const handleGoBack = useCallback(() => {
    if (processingStateRef.current) return;
    
    console.log("Going back in battle");
    onGoBack();
  }, [onGoBack]);

  return {
    handlePokemonSelect,
    handleGoBack,
    isProcessing: processingStateRef.current || isProcessing
  };
};
