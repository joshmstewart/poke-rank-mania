
import { useState, useCallback } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { formatPokemonName } from "@/utils/pokemon";

export const useBattleStateData = (
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
  // MILESTONE INVESTIGATION: Log initial milestones
  const initialMilestones = [10, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000];
  console.log(`🔍🔍🔍 [MILESTONE_INVESTIGATION] useBattleStateData initializing with milestones:`, initialMilestones);
  
  // All state hooks - must be called unconditionally
  const [currentBattle, setCurrentBattleRaw] = useState<Pokemon[]>([]);
  const [battleResults, setBattleResults] = useState<SingleBattle[]>([]);
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState(initialSelectedGeneration);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [battleType, setBattleType] = useState<BattleType>(initialBattleType);
  const [finalRankings, setFinalRankings] = useState<RankedPokemon[]>([]);
  const [confidenceScores, setConfidenceScores] = useState<{ [pokemonId: number]: number }>({});
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);
  const [activeTier, setActiveTier] = useState<TopNOption>("All");
  const [isBattleTransitioning, setIsBattleTransitioning] = useState(false);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [milestones, setMilestones] = useState<number[]>(initialMilestones);
  const [milestoneInProgress, setMilestoneInProgress] = useState(false);
  const [isAnyProcessing, setIsAnyProcessing] = useState(false);
  const [frozenPokemon, setFrozenPokemon] = useState<number[]>([]);

  // MILESTONE INVESTIGATION: Wrap setMilestones to log changes
  const setMilestonesWithLogging = useCallback((newMilestones: number[] | ((prev: number[]) => number[])) => {
    console.log(`🔍🔍🔍 [MILESTONE_INVESTIGATION] setMilestones called!`);
    console.log(`🔍🔍🔍 [MILESTONE_INVESTIGATION] Call stack:`, new Error().stack);
    
    if (typeof newMilestones === 'function') {
      setMilestones(prev => {
        const result = newMilestones(prev);
        console.log(`🔍🔍🔍 [MILESTONE_INVESTIGATION] setMilestones function: ${JSON.stringify(prev)} -> ${JSON.stringify(result)}`);
        return result;
      });
    } else {
      console.log(`🔍🔍🔍 [MILESTONE_INVESTIGATION] setMilestones direct: ${JSON.stringify(newMilestones)}`);
      setMilestones(newMilestones);
    }
  }, []);

  // MILESTONE INVESTIGATION: Wrap setBattlesCompleted to log milestone checks
  const setBattlesCompletedWithLogging = useCallback((newCount: number | ((prev: number) => number)) => {
    console.log(`🔍🔍🔍 [MILESTONE_INVESTIGATION] setBattlesCompleted called!`);
    
    if (typeof newCount === 'function') {
      setBattlesCompleted(prev => {
        const result = newCount(prev);
        console.log(`🔍🔍🔍 [MILESTONE_INVESTIGATION] setBattlesCompleted function: ${prev} -> ${result}`);
        console.log(`🔍🔍🔍 [MILESTONE_INVESTIGATION] Current milestones when battles change:`, milestones);
        return result;
      });
    } else {
      console.log(`🔍🔍🔍 [MILESTONE_INVESTIGATION] setBattlesCompleted direct: ${newCount}`);
      console.log(`🔍🔍🔍 [MILESTONE_INVESTIGATION] Current milestones when battles change:`, milestones);
      setBattlesCompleted(newCount);
    }
  }, [milestones]);

  // Wrapper for setCurrentBattle that formats Pokemon names
  const setCurrentBattle = useCallback((battle: Pokemon[]) => {
    console.log(`🔧 [NAME_FORMAT_FIX] Formatting names for ${battle.length} Pokemon in current battle`);
    const formattedBattle = battle.map(pokemon => ({
      ...pokemon,
      name: formatPokemonName(pokemon.name)
    }));
    
    formattedBattle.forEach((pokemon, index) => {
      console.log(`🔧 [NAME_FORMAT_FIX] Pokemon #${index + 1}: "${battle[index].name}" → "${pokemon.name}"`);
    });
    
    setCurrentBattleRaw(formattedBattle);
  }, []);

  // Reset milestones function
  const resetMilestones = useCallback(() => {
    console.log(`🔧 [MILESTONE_DEBUG] Resetting milestones`);
    console.log(`🔍🔍🔍 [MILESTONE_INVESTIGATION] resetMilestones called - resetting to initial:`, initialMilestones);
    setMilestonesWithLogging(initialMilestones);
  }, [setMilestonesWithLogging, initialMilestones]);

  return {
    // State values
    currentBattle,
    battleResults,
    battlesCompleted,
    showingMilestone,
    selectedGeneration,
    completionPercentage,
    rankingGenerated,
    selectedPokemon,
    battleType,
    finalRankings,
    confidenceScores,
    battleHistory,
    activeTier,
    isBattleTransitioning,
    isProcessingResult,
    milestones,
    milestoneInProgress,
    isAnyProcessing,
    frozenPokemon,
    
    // State setters
    setCurrentBattle,
    setBattleResults,
    setBattlesCompleted: setBattlesCompletedWithLogging,
    setShowingMilestone,
    setSelectedGeneration,
    setCompletionPercentage,
    setRankingGenerated,
    setSelectedPokemon,
    setBattleType,
    setFinalRankings,
    setConfidenceScores,
    setBattleHistory,
    setActiveTier,
    setIsBattleTransitioning,
    setIsProcessingResult,
    setMilestones: setMilestonesWithLogging,
    setMilestoneInProgress,
    setIsAnyProcessing,
    setFrozenPokemon,
    resetMilestones
  };
};
