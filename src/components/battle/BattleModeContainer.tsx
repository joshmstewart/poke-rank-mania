
import React, { useState, useEffect, useCallback } from "react";
import BattleContentHeader from "./BattleContentHeader";
import BattleContentRenderer from "./BattleContentRenderer";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "@/hooks/battle/types";
// Switch to the refactored battle state hook that uses the coordination system
import { useBattleStateCoreRefactored } from "@/hooks/battle/useBattleStateCoreRefactored";
import { useTrueSkillStore } from "@/stores/trueskillStore";

interface BattleModeContainerProps {
  allPokemon: Pokemon[];
  initialBattleType: BattleType;
  setBattlesCompleted?: React.Dispatch<React.SetStateAction<number>>;
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>;
}

const BattleModeContainer: React.FC<BattleModeContainerProps> = ({
  allPokemon,
  initialBattleType,
  setBattlesCompleted,
  setBattleResults
}) => {
  console.log(`🔧 [BATTLE_MODE_CONTAINER] Rendering with ${allPokemon.length} Pokemon`);
  
  const [selectedGeneration, setSelectedGeneration] = useState(0);
  
  // CRITICAL FIX: Get battle count from TrueSkill store as single source of truth
  const { totalBattles } = useTrueSkillStore();

  // CRITICAL FIX: Use the battle state from the core hook directly
  // The refactored hook internally uses the coordination system and
  // triggers battle starter events for pending Pokémon
  const battleState = useBattleStateCoreRefactored(
    allPokemon,
    initialBattleType,
    selectedGeneration
  );

  // CRITICAL FIX: Always use TrueSkill store value for battles completed
  useEffect(() => {
    console.log(`🔧 [BATTLE_COUNT_SYNC] Syncing battle count from TrueSkill store: ${totalBattles}`);
    if (setBattlesCompleted) {
      setBattlesCompleted(totalBattles);
    }
  }, [totalBattles, setBattlesCompleted]);

  // Sync battle results
  useEffect(() => {
    if (setBattleResults) {
      setBattleResults(battleState.battleResults);
    }
  }, [battleState.battleResults, setBattleResults]);

  // CRITICAL FIX: Listen for reset events and force re-render
  useEffect(() => {
    const handleBattleSystemReset = () => {
      console.log(`🔄 [CONTAINER_RESET] Forcing state sync after reset`);
      const currentTotalBattles = useTrueSkillStore.getState().totalBattles;
      console.log(`🔄 [CONTAINER_RESET] Current TrueSkill battles: ${currentTotalBattles}`);
      
      if (setBattlesCompleted) {
        setBattlesCompleted(currentTotalBattles);
      }
      if (setBattleResults) {
        setBattleResults([]);
      }
    };

    document.addEventListener('battle-system-reset', handleBattleSystemReset);
    
    return () => {
      document.removeEventListener('battle-system-reset', handleBattleSystemReset);
    };
  }, [setBattlesCompleted, setBattleResults]);

  const handleGenerationChange = useCallback((gen: number) => {
    console.log(`🔧 [BATTLE_MODE_CONTAINER] Generation changed to: ${gen}`);
    setSelectedGeneration(gen);
    battleState.setSelectedGeneration(gen);
  }, [battleState]);

  const handleBattleTypeChange = useCallback((type: BattleType) => {
    console.log(`🔧 [BATTLE_MODE_CONTAINER] Battle type changed to: ${type}`);
    battleState.setBattleType(type);
  }, [battleState]);

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="flex flex-col space-y-4">
        <BattleContentHeader
          selectedGeneration={selectedGeneration}
          battleType={battleState.battleType}
          onGenerationChange={handleGenerationChange}
          setBattleType={handleBattleTypeChange}
          performFullBattleReset={battleState.performFullBattleReset}
          setBattlesCompleted={setBattlesCompleted}
          setBattleResults={setBattleResults}
        />

        <BattleContentRenderer
          showingMilestone={battleState.showingMilestone}
          currentBattle={battleState.currentBattle}
          selectedPokemon={battleState.selectedPokemon}
          battlesCompleted={totalBattles}
          battleType={battleState.battleType}
          battleHistory={battleState.battleHistory}
          selectedGeneration={selectedGeneration}
          finalRankings={battleState.finalRankings}
          activeTier={battleState.activeTier}
          milestones={battleState.milestones}
          rankingGenerated={battleState.rankingGenerated}
          isAnyProcessing={battleState.isAnyProcessing}
          setSelectedGeneration={setSelectedGeneration}
          setBattleType={battleState.setBattleType}
          setShowingMilestone={battleState.setShowingMilestone}
          setActiveTier={battleState.setActiveTier}
          handlePokemonSelect={battleState.handlePokemonSelect}
          handleTripletSelectionComplete={battleState.handleTripletSelectionComplete}
          goBack={battleState.goBack}
          handleContinueBattles={battleState.handleContinueBattles}
          performFullBattleReset={battleState.performFullBattleReset}
          handleSaveRankings={battleState.handleSaveRankings}
          suggestRanking={battleState.suggestRanking}
          removeSuggestion={battleState.removeSuggestion}
          resetMilestoneInProgress={battleState.resetMilestoneInProgress}
          handleManualReorder={battleState.handleManualReorder}
          onRankingsUpdate={() => {}}
          setBattlesCompleted={setBattlesCompleted}
          setBattleResults={setBattleResults}
        />
      </div>
    </div>
  );
};

export default BattleModeContainer;
