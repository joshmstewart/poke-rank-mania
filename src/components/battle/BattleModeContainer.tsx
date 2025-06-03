
import React, { useState, useEffect, useCallback } from "react";
import BattleContentHeader from "./BattleContentHeader";
import BattleContentRenderer from "./BattleContentRenderer";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "@/hooks/battle/types";
import { useBattleStateCore } from "@/hooks/battle/useBattleStateCore";
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
  
  // Add error boundary protection
  const [hasError, setHasError] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState(0);
  
  // CRITICAL FIX: Get battle count from TrueSkill store as single source of truth
  const { totalBattles } = useTrueSkillStore();

  // Add error handling for battle state initialization
  let battleState;
  try {
    battleState = useBattleStateCore(allPokemon, initialBattleType, selectedGeneration);
  } catch (error) {
    console.error('🚨 [BATTLE_CONTAINER_ERROR] Failed to initialize battle state:', error);
    setHasError(true);
    battleState = null;
  }

  // Show error state if battle initialization failed
  if (hasError || !battleState) {
    return (
      <div className="container max-w-7xl mx-auto py-6">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4 text-red-600">Battle System Error</h2>
            <p className="text-gray-600 mb-4">
              {allPokemon.length === 0 
                ? "No Pokemon data available. Please wait for Pokemon to load."
                : "Failed to initialize battle system."
              }
            </p>
            <button 
              onClick={() => {
                setHasError(false);
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CRITICAL FIX: Always use TrueSkill store value for battles completed
  useEffect(() => {
    console.log(`🔧 [BATTLE_COUNT_SYNC] Syncing battle count from TrueSkill store: ${totalBattles}`);
    if (setBattlesCompleted) {
      setBattlesCompleted(totalBattles);
    }
  }, [totalBattles, setBattlesCompleted]);

  // Sync battle results
  useEffect(() => {
    if (setBattleResults && battleState) {
      setBattleResults(battleState.battleResults);
    }
  }, [battleState?.battleResults, setBattleResults]);

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
    if (battleState && battleState.setSelectedGeneration) {
      battleState.setSelectedGeneration(gen);
    }
  }, [battleState]);

  const handleBattleTypeChange = useCallback((type: BattleType) => {
    console.log(`🔧 [BATTLE_MODE_CONTAINER] Battle type changed to: ${type}`);
    if (battleState && battleState.setBattleType) {
      battleState.setBattleType(type);
    }
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
