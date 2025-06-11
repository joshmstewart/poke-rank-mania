
import { useCallback, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useTrueSkillStore } from "@/stores/trueskillStore";

export const useBattleStateEventHandlers = (
  allPokemon: Pokemon[],
  stateData: any,
  startNewBattleAsync: (battleType: BattleType) => Promise<Pokemon[]>,
  milestoneHandlers?: any,
  setFinalRankingsWithLogging?: (rankings: any) => void
) => {
  // Get pending battles functions from TrueSkill store
  const { getAllPendingBattles, clearAllPendingBattles } = useTrueSkillStore();

  // Create a parameterless wrapper for milestone handlers with proper async handling
  const startNewBattleWrapper = useCallback(async () => {
    console.log(`🚀 [START_NEW_BATTLE_WRAPPER] Parameterless wrapper called`);
    console.log(`🚀 [START_NEW_BATTLE_WRAPPER] Current battle type: ${stateData.battleType}`);
    
    try {
      const result = await startNewBattleAsync(stateData.battleType);
      
      if (result && result.length > 0) {
        console.log(`🚀 [START_NEW_BATTLE_WRAPPER] Setting new battle:`, result.map(p => p.name).join(' vs '));
        stateData.setCurrentBattle(result);
        stateData.setSelectedPokemon([]);
        console.log(`✅ [START_NEW_BATTLE_WRAPPER] New battle set successfully`);
      } else {
        console.error(`🚀 [START_NEW_BATTLE_WRAPPER] Failed to create new battle - empty result`);
        console.log(`🚀 [START_NEW_BATTLE_WRAPPER] Not retrying to prevent infinite loop`);
      }
    } catch (error) {
      console.error(`🚀 [START_NEW_BATTLE_WRAPPER] Error creating new battle:`, error);
    }
  }, [startNewBattleAsync, stateData.battleType, stateData.setCurrentBattle, stateData.setSelectedPokemon]);

  // Completion percentage calculation
  useEffect(() => {
    if (!milestoneHandlers) return;

    const percentage = milestoneHandlers.calculateCompletionPercentage();
    console.log(
      `🔧 [COMPLETION_DEBUG] Calculated completion percentage: ${percentage}% for ${stateData.battlesCompleted} battles`
    );
    stateData.setCompletionPercentage(percentage);
  }, [stateData.battlesCompleted, milestoneHandlers, stateData.setCompletionPercentage]);

  // Event listener for milestone ranking generation
  useEffect(() => {
    if (!milestoneHandlers) return;

    const handleGenerateMilestoneRankings = (event: CustomEvent) => {
      console.log(
        `🔥 [MILESTONE_RANKING_EVENT] Received generate-milestone-rankings event:`,
        event.detail
      );
      console.log(
        `🔥 [MILESTONE_RANKING_EVENT] Current battle history length: ${stateData.battleHistory.length}`
      );
      console.log(`🔥 [MILESTONE_RANKING_EVENT] Calling milestoneHandlers.generateRankings...`);

      try {
        milestoneHandlers.generateRankings();
        console.log(`🔥 [MILESTONE_RANKING_EVENT] ✅ generateRankings called successfully`);
      } catch (error) {
        console.error(`🔥 [MILESTONE_RANKING_EVENT] ❌ Error calling generateRankings:`, error);
      }
    };

    document.addEventListener('generate-milestone-rankings', handleGenerateMilestoneRankings as EventListener);
    
    return () => {
      document.removeEventListener('generate-milestone-rankings', handleGenerateMilestoneRankings as EventListener);
    };
  }, [milestoneHandlers, stateData.battleHistory]);

  // Mode switch event listener - REMOVED BATTLE CREATION LOGIC
  useEffect(() => {
    const handleModeSwitch = (event: CustomEvent) => {
      const { mode, previousMode } = event.detail;
      console.log(`🔄 [MODE_SWITCH_HANDLER] Mode switched from ${previousMode} to ${mode}`);
      
      // Only process when switching TO battle mode
      if (mode === 'battle' && previousMode === 'rank') {
        console.log(`🔄 [MODE_SWITCH_HANDLER] Switching to battle mode - checking for pending Pokemon`);
        
        const pendingPokemon = getAllPendingBattles();
        console.log(`🔄 [MODE_SWITCH_HANDLER] Found ${pendingPokemon.length} pending Pokemon:`, pendingPokemon);
        
        if (pendingPokemon.length > 0) {
          console.log(`🔄 [MODE_SWITCH_HANDLER] Found pending Pokemon - setting initiatePendingBattle flag ONLY`);
          console.log(`🔄 [MODE_SWITCH_HANDLER] NOT creating battles - letting single battle creator handle it`);
          
          // ONLY set the flag - let the single battle creator handle the rest
          useTrueSkillStore.setState({ initiatePendingBattle: true });
          
          console.log(`🔄 [MODE_SWITCH_HANDLER] Flag set - single battle creator will process pending Pokemon`);
        } else {
          console.log(`🔄 [MODE_SWITCH_HANDLER] No pending Pokemon found - normal battle flow will apply`);
        }
      }
    };

    document.addEventListener('mode-switch', handleModeSwitch as EventListener);
    
    return () => {
      document.removeEventListener('mode-switch', handleModeSwitch as EventListener);
    };
  }, [getAllPendingBattles]);

  // Pokemon starred event listener - REMOVED BATTLE CREATION LOGIC
  useEffect(() => {
    const handlePokemonStarred = (event: CustomEvent) => {
      console.log(`⭐ [POKEMON_STARRED_EVENT] Received pokemon-starred-for-battle event:`, event.detail);
      
      // Check if we're in battle mode
      const currentPath = window.location.pathname;
      const isInBattleMode = currentPath === '/' || currentPath.includes('battle');
      
      console.log(`⭐ [POKEMON_STARRED_EVENT] Current mode check - inBattleMode: ${isInBattleMode}, path: ${currentPath}`);
      
      if (!isInBattleMode) {
        console.log(`⭐ [POKEMON_STARRED_EVENT] Not in battle mode, Pokemon will be processed when switching to battle mode`);
        return;
      }
      
      console.log(`⭐ [POKEMON_STARRED_EVENT] In battle mode - let single battle creator handle this`);
      // Don't create battles here - let the single battle creator handle it
    };

    document.addEventListener('pokemon-starred-for-battle', handlePokemonStarred as EventListener);
    
    return () => {
      document.removeEventListener('pokemon-starred-for-battle', handlePokemonStarred as EventListener);
    };
  }, []);

  // REMOVED THE COMPETING INITIAL BATTLE EFFECT - let single battle creator handle it

  return {
    startNewBattleWrapper
  };
};
