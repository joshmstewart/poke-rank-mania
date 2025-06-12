
import { useState, useCallback, useEffect, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleStarterCore } from "./useBattleStarterCore";
import { useTrueSkillStore } from "@/stores/trueskillStore";

export const useBattleStateSimplified = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
  console.log(`🚀 [SIMPLIFIED] Battle state hook initializing with ${allPokemon.length} Pokemon`);
  
  // Core state - simplified to essentials only
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [battleType, setBattleType] = useState<BattleType>(initialBattleType);
  const [selectedGeneration, setSelectedGeneration] = useState(initialSelectedGeneration);
  const [battleResults, setBattleResults] = useState<SingleBattle[]>([]);
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);
  
  // TrueSkill integration
  const { totalBattles } = useTrueSkillStore();
  
  // Simple battle creation - no complex orchestration
  const getCurrentRankings = useCallback(() => {
    return allPokemon.map(pokemon => ({
      ...pokemon,
      score: 0,
      count: 0,
      confidence: 0,
      wins: 0,
      losses: 0,
      winRate: 0
    }));
  }, [allPokemon]);
  
  const { startNewBattle: startNewBattleCore } = useBattleStarterCore(allPokemon, getCurrentRankings);
  
  // Optimized battle creation - no delays, simplified logic
  const startNewBattle = useCallback((type: BattleType = battleType): Pokemon[] => {
    console.log(`🚀 [SIMPLIFIED] Starting new ${type} battle`);
    
    if (!allPokemon || allPokemon.length < 2) {
      console.log(`🚀 [SIMPLIFIED] Not enough Pokemon for battle`);
      return [];
    }
    
    const config = {
      allPokemon,
      currentRankings: getCurrentRankings(),
      battleType: type,
      selectedGeneration: 0,
      freezeList: []
    };
    
    const result = startNewBattleCore(config);
    console.log(`🚀 [SIMPLIFIED] Battle created:`, result?.map(p => p.name).join(' vs ') || 'none');
    
    if (result && result.length > 0) {
      setCurrentBattle(result);
      setSelectedPokemon([]);
    }
    
    return result || [];
  }, [allPokemon, battleType, startNewBattleCore, getCurrentRankings]);
  
  // Initialize first battle when Pokemon are available
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current && allPokemon.length >= 2 && currentBattle.length === 0) {
      console.log(`🚀 [SIMPLIFIED] Auto-starting initial battle`);
      startNewBattle();
      initializedRef.current = true;
    }
  }, [allPokemon.length, currentBattle.length, startNewBattle]);
  
  // Optimized handlers - no delays
  const handlePokemonSelect = useCallback((pokemonId: number) => {
    console.log(`🚀 [SIMPLIFIED] Pokemon selected: ${pokemonId}`);
    
    if (battleType === "pairs") {
      // For pairs, immediately process the selection
      const winner = currentBattle.find(p => p.id === pokemonId);
      const loser = currentBattle.find(p => p.id !== pokemonId);
      
      if (winner && loser) {
        const battle: SingleBattle = {
          battleType,
          generation: selectedGeneration,
          pokemonIds: currentBattle.map(p => p.id),
          selectedPokemonIds: [pokemonId],
          timestamp: new Date().toISOString(),
          winner,
          loser
        };
        
        setBattleResults(prev => [...prev, battle]);
        setBattleHistory(prev => [...prev, { battle: currentBattle, selected: [pokemonId] }]);
        
        // Start next battle immediately - no delay
        startNewBattle();
      }
    } else {
      // For triplets, collect selections
      setSelectedPokemon(prev => {
        const newSelection = prev.includes(pokemonId) 
          ? prev.filter(id => id !== pokemonId)
          : [...prev, pokemonId];
        
        if (newSelection.length === 2) {
          // Process triplet selection
          const winners = currentBattle.filter(p => newSelection.includes(p.id));
          const loser = currentBattle.find(p => !newSelection.includes(p.id));
          
          if (winners.length === 2 && loser) {
            const battle: SingleBattle = {
              battleType,
              generation: selectedGeneration,
              pokemonIds: currentBattle.map(p => p.id),
              selectedPokemonIds: newSelection,
              timestamp: new Date().toISOString()
            };
            
            setBattleResults(prev => [...prev, battle]);
            setBattleHistory(prev => [...prev, { battle: currentBattle, selected: newSelection }]);
            
            // Start next battle immediately - no delay
            startNewBattle();
          }
        }
        
        return newSelection;
      });
    }
  }, [currentBattle, battleType, selectedGeneration, startNewBattle]);
  
  const handleTripletSelectionComplete = useCallback(() => {
    // This is handled automatically in handlePokemonSelect
    console.log(`🚀 [SIMPLIFIED] Triplet selection complete`);
  }, []);
  
  // Simple reset
  const performFullBattleReset = useCallback(() => {
    console.log(`🚀 [SIMPLIFIED] Performing full reset`);
    setCurrentBattle([]);
    setSelectedPokemon([]);
    setBattleResults([]);
    setBattleHistory([]);
    initializedRef.current = false;
    
    // Restart immediately after reset - no delay
    if (allPokemon.length >= 2) {
      startNewBattle();
    }
  }, [allPokemon.length, startNewBattle]);
  
  // Simple milestone reset function
  const resetMilestoneInProgress = useCallback(() => {
    console.log(`🚀 [SIMPLIFIED] Reset milestone in progress`);
    // For simplified version, this is a no-op but maintains interface compatibility
  }, []);
  
  return {
    // State
    currentBattle,
    selectedPokemon,
    battleType,
    selectedGeneration,
    battleResults,
    battleHistory,
    battlesCompleted: totalBattles,
    
    // Simple derived state
    showingMilestone: false,
    rankingGenerated: false,
    finalRankings: getCurrentRankings(),
    activeTier: 'all',
    milestones: [10, 50, 100, 250, 500, 1000],
    isAnyProcessing: false,
    
    // Actions
    setBattleType,
    setSelectedGeneration,
    setShowingMilestone: () => {},
    setActiveTier: () => {},
    handlePokemonSelect,
    handleTripletSelectionComplete,
    goBack: () => {},
    handleContinueBattles: () => startNewBattle(),
    performFullBattleReset,
    handleSaveRankings: () => {},
    suggestRanking: () => {},
    removeSuggestion: () => {},
    resetMilestoneInProgress,
    handleManualReorder: () => {}
  };
};
