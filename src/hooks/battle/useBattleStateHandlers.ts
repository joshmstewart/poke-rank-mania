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
  clearRefinementQueue: () => void,
  generateRankings: () => void
) => {
  const handlePokemonSelect = useCallback((id: number) => {
    console.log(`🎯 [POKEMON_SELECT_ULTRA_DEBUG] Pokemon ${id} selected. Current selections:`, selectedPokemon);
    
    if (selectedPokemon.includes(id)) {
      console.log(`🎯 [POKEMON_SELECT_ULTRA_DEBUG] Deselecting Pokemon ${id}`);
      const newSelection = selectedPokemon.filter(pokemonId => pokemonId !== id);
      setSelectedPokemon(newSelection);
    } else {
      const newSelection = [...selectedPokemon, id];
      console.log(`🎯 [POKEMON_SELECT_ULTRA_DEBUG] Adding Pokemon ${id}. New selection:`, newSelection);
      setSelectedPokemon(newSelection);
    }
  }, [selectedPokemon, setSelectedPokemon]);

  const originalProcessBattleResult = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    console.log(`🚨🚨🚨 [BATTLE_RESULT_MEGA_DEBUG] ===== PROCESSING BATTLE RESULT =====`);
    console.log(`🚨🚨🚨 [BATTLE_RESULT_MEGA_DEBUG] Input data:`);
    console.log(`🚨🚨🚨 [BATTLE_RESULT_MEGA_DEBUG] - selectedPokemonIds: [${selectedPokemonIds.join(', ')}]`);
    console.log(`🚨🚨🚨 [BATTLE_RESULT_MEGA_DEBUG] - currentBattlePokemon: ${currentBattlePokemon.map(p => `${p.name} (${p.id})`).join(' vs ')}`);
    console.log(`🚨🚨🚨 [BATTLE_RESULT_MEGA_DEBUG] - battleType: ${battleType}`);
    console.log(`🚨🚨🚨 [BATTLE_RESULT_MEGA_DEBUG] - CURRENT battlesCompleted BEFORE increment: ${battlesCompleted}`);

    const selected = selectedPokemonIds.sort((a, b) => a - b);
    
    console.log(`🚨🚨🚨 [BATTLE_RESULT_MEGA_DEBUG] Adding to battle history...`);
    setBattleHistory(prev => {
      const newHistory = [...prev, { battle: currentBattlePokemon, selected }];
      console.log(`🚨🚨🚨 [BATTLE_RESULT_MEGA_DEBUG] Battle history updated - new length: ${newHistory.length}`);
      console.log(`🚨🚨🚨 [BATTLE_RESULT_MEGA_DEBUG] Latest battle added: ${currentBattlePokemon.map(p => p.name).join(' vs ')} -> selected: [${selected.join(', ')}]`);
      return newHistory;
    });

    const newBattlesCompleted = battlesCompleted + 1;
    console.log(`🚨🚨🚨 [BATTLE_RESULT_MEGA_DEBUG] Incrementing battles completed: ${battlesCompleted} -> ${newBattlesCompleted}`);
    
    setBattlesCompleted(newBattlesCompleted);
    localStorage.setItem('pokemon-battle-count', String(newBattlesCompleted));

    const newBattleResult: SingleBattle = {
      battleType,
      generation: selectedGeneration,
      pokemonIds: currentBattlePokemon.map(p => p.id),
      selectedPokemonIds: selectedPokemonIds,
      timestamp: new Date().toISOString()
    };

    setBattleResults(prev => {
      const newResults = [...prev, newBattleResult];
      console.log(`🚨🚨🚨 [BATTLE_RESULT_MEGA_DEBUG] Battle results updated - new length: ${newResults.length}`);
      return newResults;
    });

    // CRITICAL: Enhanced milestone checking with ultra detailed logging
    const isAtMilestone = milestones.includes(newBattlesCompleted);
    console.log(`🚨🚨🚨 [MILESTONE_CHECK_MEGA_DEBUG] ===== MILESTONE CHECK =====`);
    console.log(`🚨🚨🚨 [MILESTONE_CHECK_MEGA_DEBUG] Battle ${newBattlesCompleted} completed`);
    console.log(`🚨🚨🚨 [MILESTONE_CHECK_MEGA_DEBUG] Available milestones: [${milestones.join(', ')}]`);
    console.log(`🚨🚨🚨 [MILESTONE_CHECK_MEGA_DEBUG] milestones.includes(${newBattlesCompleted}) = ${isAtMilestone}`);
    console.log(`🚨🚨🚨 [MILESTONE_CHECK_MEGA_DEBUG] generateRankings function available: ${!!generateRankings}`);
    console.log(`🚨🚨🚨 [MILESTONE_CHECK_MEGA_DEBUG] generateRankings function type: ${typeof generateRankings}`);
    
    if (isAtMilestone) {
      console.log(`🚨🚨🚨 [MILESTONE_HIT_MEGA_DEBUG] ===== MILESTONE ${newBattlesCompleted} REACHED! =====`);
      console.log(`🚨🚨🚨 [MILESTONE_HIT_MEGA_DEBUG] About to trigger ranking generation and milestone flags...`);
      
      // CRITICAL: Use immediate execution instead of setTimeout to ensure proper sequencing
      console.log(`🚨🚨🚨 [MILESTONE_HIT_MEGA_DEBUG] Step 1: Generating rankings NOW (not in timeout)`);
      
      try {
        generateRankings();
        console.log(`🚨🚨🚨 [MILESTONE_HIT_MEGA_DEBUG] Step 1 COMPLETE: generateRankings() called successfully`);
      } catch (error) {
        console.error(`🚨🚨🚨 [MILESTONE_HIT_MEGA_DEBUG] Step 1 FAILED: Error calling generateRankings():`, error);
      }
      
      console.log(`🚨🚨🚨 [MILESTONE_HIT_MEGA_DEBUG] Step 2: Setting milestone flags...`);
      setMilestoneInProgress(true);
      setShowingMilestone(true);
      setRankingGenerated(true);
      console.log(`🚨🚨🚨 [MILESTONE_HIT_MEGA_DEBUG] Step 2 COMPLETE: All milestone flags set`);
      
      // Add a delayed verification to check if everything worked
      setTimeout(() => {
        console.log(`🚨🚨🚨 [MILESTONE_VERIFICATION] ===== MILESTONE VERIFICATION (after 100ms) =====`);
        console.log(`🚨🚨🚨 [MILESTONE_VERIFICATION] These states should now be true:`);
        console.log(`🚨🚨🚨 [MILESTONE_VERIFICATION] - milestoneInProgress: should be true`);
        console.log(`🚨🚨🚨 [MILESTONE_VERIFICATION] - showingMilestone: should be true`);
        console.log(`🚨🚨🚨 [MILESTONE_VERIFICATION] - rankingGenerated: should be true`);
        console.log(`🚨🚨🚨 [MILESTONE_VERIFICATION] - finalRankings.length: should be > 0`);
        console.log(`🚨🚨🚨 [MILESTONE_VERIFICATION] If these are not true, there's a state update issue`);
      }, 100);
      
    } else {
      console.log(`🚨🚨🚨 [MILESTONE_CHECK_MEGA_DEBUG] No milestone hit for battle ${newBattlesCompleted}`);
    }

    setSelectedPokemon([]);
    console.log(`🚨🚨🚨 [BATTLE_RESULT_MEGA_DEBUG] ===== BATTLE RESULT PROCESSING COMPLETE =====`);
    return Promise.resolve();
  }, [battlesCompleted, milestones, setBattleHistory, setBattlesCompleted, setBattleResults, setSelectedPokemon, setMilestoneInProgress, setShowingMilestone, setRankingGenerated, generateRankings]);

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
      setBattlesCompleted(battlesCompleted - 1);
      setBattleResults(prev => prev.slice(0, -1));
    }
  }, [battleHistory, setCurrentBattle, setSelectedPokemon, setBattleHistory, setBattlesCompleted, setBattleResults, battlesCompleted]);

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

  const handleManualReorder = useCallback((draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`Manual reorder: ${draggedPokemonId} from ${sourceIndex} to ${destinationIndex}`);
    // Implementation would go here
  }, []);

  // CRITICAL FIX: Properly type the pendingRefinements Set
  const pendingRefinements: Set<number> = new Set(
    refinementQueue.refinementQueue 
      ? refinementQueue.refinementQueue.map((r: any) => r.primaryPokemonId as number)
      : []
  );

  return {
    handlePokemonSelect,
    originalProcessBattleResult,
    startNewBattleWrapper,
    goBack,
    performFullBattleReset,
    processBattleResultWithRefinement,
    handleManualReorder,
    pendingRefinements,
    refinementBattleCount: refinementQueue.refinementBattleCount || 0,
    clearRefinementQueue
  };
};
