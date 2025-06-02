
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
  
  useEffect(() => {
    if (currentBattle && currentBattle.length > 0) {
      processingStateRef.current = false;
      setIsProcessing(false);
    }
  }, [currentBattle.map(p => p.id).join(',')]);

  useEffect(() => {
    processingStateRef.current = false;
    setIsProcessing(false);
  }, [battlesCompleted]);

  useEffect(() => {
    const timer = setTimeout(() => {
      processingStateRef.current = false;
      setIsProcessing(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handlePokemonSelect = useCallback((id: number) => {
    if (processingStateRef.current) {
      return;
    }

    processingStateRef.current = true;
    setIsProcessing(true);

    try {
      if (battleType === "pairs") {
        processBattleResult([id], currentBattle, battleType);
        setBattleHistory(prev => [...prev, { battle: currentBattle, selected: [id] }]);
        
        setTimeout(() => {
          processingStateRef.current = false;
          setIsProcessing(false);
        }, 100);
      } else {
        if (selectedPokemon.includes(id)) {
          setSelectedPokemon(prev => prev.filter(pokemonId => pokemonId !== id));
        } else {
          setSelectedPokemon(prev => [...prev, id]);
        }
        
        processingStateRef.current = false;
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error in handlePokemonSelect:', error);
      processingStateRef.current = false;
      setIsProcessing(false);
    }
  }, [currentBattle, selectedPokemon, setSelectedPokemon, battleType, processBattleResult, setBattleHistory, isProcessing]);

  const handleGoBack = useCallback(() => {
    if (processingStateRef.current) return;
    onGoBack();
  }, [onGoBack]);

  return {
    handlePokemonSelect,
    handleGoBack,
    isProcessing: processingStateRef.current || isProcessing
  };
};
