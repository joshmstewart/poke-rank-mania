import { useCallback } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";

export const useBattleStateHandlers = (
  allPokemon: Pokemon[],
  currentBattle: Pokemon[],
  selectedPokemon: number[],
  battleType: BattleType,
  selectedGeneration: number,
  battlesCompleted: number,
  milestones: number[],
  finalRankings: RankedPokemon[],
  frozenPokemon: number[],
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  startNewBattle: any,
  getCurrentRankings: () => RankedPokemon[],
  refinementQueue: any,
  setBattleHistory: (history: any) => void,
  setBattlesCompleted: (count: number) => void,
  setBattleResults: (results: any) => void,
  setSelectedPokemon: (pokemon: number[]) => void,
  setCurrentBattle: (battle: Pokemon[]) => void,
  setMilestoneInProgress: (inProgress: boolean) => void,
  setShowingMilestone: (showing: boolean) => void,
  setRankingGenerated: (generated: boolean) => void,
  setIsBattleTransitioning: (transitioning: boolean) => void,
  setIsAnyProcessing: (processing: boolean) => void,
  processBattleResultWithRefinement: any,
  clearAllSuggestions: () => void,
  clearRefinementQueue: () => void
) => {
  const handlePokemonSelect = useCallback((id: number) => {
    console.log(`🎯 [POKEMON_SELECT_ULTRA_DEBUG] Pokemon ${id} selected. Current selections:`, selectedPokemon);
    
    setSelectedPokemon(prev => {
      if (prev.includes(id)) {
        console.log(`🎯 [POKEMON_SELECT_ULTRA_DEBUG] Deselecting Pokemon ${id}`);
        return prev.filter(pokemonId => pokemonId !== id);
      } else {
        const newSelection = [...prev, id];
        console.log(`🎯 [POKEMON_SELECT_ULTRA_DEBUG] Adding Pokemon ${id}. New selection:`, newSelection);
        return newSelection;
      }
    });
  }, [selectedPokemon, setSelectedPokemon]);

  const originalProcessBattleResult = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    console.log(`🔄 [BATTLE_PROCESSING_ULTRA_DEBUG] Processing battle result:`, {
      selectedIds: selectedPokemonIds,
      battlePokemon: currentBattlePokemon.map(p => p.name),
      battleType
    });

    // SPEED FIX: Process immediately without delays
    const selected = selectedPokemonIds.sort((a, b) => a - b);
    setBattleHistory(prev => [...prev, { battle: currentBattlePokemon, selected }]);

    const newBattlesCompleted = battlesCompleted + 1;
    setBattlesCompleted(newBattlesCompleted);
    localStorage.setItem('pokemon-battle-count', String(newBattlesCompleted));

    const newBattleResult: SingleBattle = {
      battleType,
      generation: selectedGeneration,
      pokemonIds: currentBattlePokemon.map(p => p.id),
      selectedPokemonIds: selectedPokemonIds,
      timestamp: new Date().toISOString()
    };

    setBattleResults(prev => [...prev, newBattleResult]);

    // CRITICAL FIX: Check if new battles completed hits a milestone from the milestones array
    const isAtMilestone = milestones.includes(newBattlesCompleted);
    console.log(`🎯 [MILESTONE_CHECK_ULTRA_DEBUG] Battle ${newBattlesCompleted} completed. Is milestone? ${isAtMilestone}. Milestones: ${milestones.join(', ')}`);
    
    if (isAtMilestone) {
      console.log(`🏆 [MILESTONE_HIT_ULTRA_DEBUG] Milestone ${newBattlesCompleted} reached!`);
      
      // UPDATED: Trigger the proper ranking generation system instead of basic rankings
      // This will be handled by the external ranking system that uses TrueSkill
      setMilestoneInProgress(true);
      setShowingMilestone(true);
      setRankingGenerated(true); // Mark that rankings should be generated
    }

    setSelectedPokemon([]);
    console.log(`✅ [BATTLE_PROCESSING_ULTRA_DEBUG] Battle result processed successfully`);
    return Promise.resolve();
  }, [battlesCompleted, milestones, setBattleHistory, setBattlesCompleted, setBattleResults, setSelectedPokemon, setMilestoneInProgress, setShowingMilestone, setRankingGenerated]);

  const startNewBattleWrapper = useCallback(() => {
    console.log(`🚀 [START_NEW_BATTLE_ULTRA_DEBUG] ===== START NEW BATTLE =====`);
    console.log(`🚀 [START_NEW_BATTLE_ULTRA_DEBUG] Called with startNewBattle available: ${!!startNewBattle}`);
    console.log(`🚀 [START_NEW_BATTLE_ULTRA_DEBUG] Refinement queue size: ${refinementQueue.refinementBattleCount}`);
    console.log(`🚀 [START_NEW_BATTLE_ULTRA_DEBUG] Refinement queue contents:`, refinementQueue.refinementQueue);
    
    if (!startNewBattle) {
      console.error(`❌ [START_NEW_BATTLE_ULTRA_DEBUG] startNewBattle not available`);
      return;
    }
    
    // CRITICAL FIX: Check for refinement battles first
    const nextRefinement = refinementQueue.getNextRefinementBattle();
    
    if (nextRefinement) {
      console.log(`⚔️ [REFINEMENT_BATTLE_ULTRA_DEBUG] Found pending refinement battle: ${nextRefinement.primaryPokemonId} vs ${nextRefinement.opponentPokemonId}`);
      console.log(`⚔️ [REFINEMENT_BATTLE_ULTRA_DEBUG] Reason: ${nextRefinement.reason}`);
      
      const primary = allPokemon.find(p => p.id === nextRefinement.primaryPokemonId);
      const opponent = allPokemon.find(p => p.id === nextRefinement.opponentPokemonId);

      console.log(`⚔️ [REFINEMENT_BATTLE_ULTRA_DEBUG] Primary found: ${!!primary} (${primary?.name})`);
      console.log(`⚔️ [REFINEMENT_BATTLE_ULTRA_DEBUG] Opponent found: ${!!opponent} (${opponent?.name})`);

      if (primary && opponent) {
        const refinementBattle = [primary, opponent];
        console.log(`⚔️ [REFINEMENT_BATTLE_ULTRA_DEBUG] ✅ Successfully created refinement battle: ${primary.name} vs ${opponent.name}`);
        setCurrentBattle(refinementBattle);
        setSelectedPokemon([]);
        console.log(`⚔️ [REFINEMENT_BATTLE_ULTRA_DEBUG] ✅ Refinement battle set as current battle`);
        console.log(`🚀 [START_NEW_BATTLE_ULTRA_DEBUG] ===== END (REFINEMENT BATTLE) =====`);
        return;
      } else {
        console.warn(`⚔️ [REFINEMENT_BATTLE_ULTRA_DEBUG] Could not find Pokemon for refinement battle:`, nextRefinement);
        // Pop the invalid battle and continue with regular generation
        console.log(`⚔️ [REFINEMENT_BATTLE_ULTRA_DEBUG] Popping invalid refinement battle`);
        refinementQueue.popRefinementBattle();
      }
    } else {
      console.log(`🚀 [START_NEW_BATTLE_ULTRA_DEBUG] No refinement battles in queue`);
    }
    
    // No refinement battles or invalid battle, proceed with normal generation
    console.log(`🎮 [START_NEW_BATTLE_ULTRA_DEBUG] No valid refinement battles, proceeding with regular generation`);
    const config = {
      allPokemon,
      currentRankings: getCurrentRankings(),
      battleType,
      selectedGeneration,
      freezeList: frozenPokemon
    };
    const newBattle = startNewBattle(config);
    console.log(`🚀 [START_NEW_BATTLE_ULTRA_DEBUG] Generated regular battle:`, newBattle?.map(p => p.name).join(' vs ') || 'None');
    
    if (newBattle && newBattle.length > 0) {
      setCurrentBattle(newBattle);
      setSelectedPokemon([]);
      console.log(`✅ [START_NEW_BATTLE_ULTRA_DEBUG] New regular battle set successfully`);
    } else {
      console.error(`❌ [START_NEW_BATTLE_ULTRA_DEBUG] Failed to generate battle`);
    }
    
    console.log(`🚀 [START_NEW_BATTLE_ULTRA_DEBUG] ===== END =====`);
  }, [battleType, startNewBattle, refinementQueue, allPokemon, getCurrentRankings, selectedGeneration, frozenPokemon, setCurrentBattle, setSelectedPokemon]);

  const goBack = useCallback(() => {
    if (battleHistory.length > 0) {
      const lastBattle = battleHistory[battleHistory.length - 1];
      setCurrentBattle(lastBattle.battle);
      setSelectedPokemon(lastBattle.selected);
      setBattleHistory(prev => prev.slice(0, -1));
      setBattlesCompleted(prev => prev - 1);
      setBattleResults(prev => prev.slice(0, -1));
    }
  }, [battleHistory, setCurrentBattle, setSelectedPokemon, setBattleHistory, setBattlesCompleted, setBattleResults]);

  const performFullBattleReset = useCallback(() => {
    localStorage.removeItem('pokemon-battle-count');
    setBattlesCompleted(0);
    setBattleResults([]);
    setBattleHistory([]);
    setRankingGenerated(false);
    setShowingMilestone(false);
    setMilestoneInProgress(false);
    clearAllSuggestions();
    clearRefinementQueue();
    startNewBattleWrapper();
  }, [startNewBattleWrapper, clearAllSuggestions, clearRefinementQueue, setBattlesCompleted, setBattleResults, setBattleHistory, setRankingGenerated, setShowingMilestone, setMilestoneInProgress]);

  return {
    handlePokemonSelect,
    originalProcessBattleResult,
    startNewBattleWrapper,
    goBack,
    performFullBattleReset
  };
};
