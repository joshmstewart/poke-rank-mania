
import React, { useState, useEffect, useCallback, useMemo } from "react";
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

const BattleModeContainer: React.FC<BattleModeContainerProps> = React.memo(({
  allPokemon,
  initialBattleType,
  setBattlesCompleted,
  setBattleResults
}) => {
  console.log(`🔧 [BATTLE_MODE_CONTAINER] Rendering with ${allPokemon.length} Pokemon`);
  
  const [hasError, setHasError] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState(0);
  
  // Get battle count from TrueSkill store as single source of truth
  const { totalBattles } = useTrueSkillStore();

  // Stable Pokemon reference to prevent re-renders
  const stablePokemon = useMemo(() => {
    return allPokemon && allPokemon.length > 0 ? allPokemon : [];
  }, [allPokemon.length]);

  // Add error handling for battle state initialization
  let battleState;
  try {
    battleState = useBattleStateCore(stablePokemon, initialBattleType, selectedGeneration);
  } catch (error) {
    console.error('🚨 [BATTLE_CONTAINER_ERROR] Failed to initialize battle state:', error);
    if (!hasError) {
      setHasError(true);
    }
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
              {stablePokemon.length === 0 
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

  // Stable callback references to prevent prop changes
  const stableSetBattlesCompleted = useCallback((value: React.SetStateAction<number>) => {
    setBattlesCompleted?.(value);
  }, [setBattlesCompleted]);

  const stableSetBattleResults = useCallback((value: React.SetStateAction<SingleBattle[]>) => {
    setBattleResults?.(value);
  }, [setBattleResults]);

  // Sync battle count from TrueSkill store
  useEffect(() => {
    console.log(`🔧 [BATTLE_COUNT_SYNC] Syncing battle count from TrueSkill store: ${totalBattles}`);
    stableSetBattlesCompleted(totalBattles);
  }, [totalBattles, stableSetBattlesCompleted]);

  // Sync battle results
  useEffect(() => {
    if (battleState?.battleResults) {
      stableSetBattleResults(battleState.battleResults);
    }
  }, [battleState?.battleResults, stableSetBattleResults]);

  const handleGenerationChange = useCallback((gen: number) => {
    console.log(`🔧 [BATTLE_MODE_CONTAINER] Generation changed to: ${gen}`);
    setSelectedGeneration(gen);
    if (battleState?.setSelectedGeneration) {
      battleState.setSelectedGeneration(gen);
    }
  }, [battleState]);

  const handleBattleTypeChange = useCallback((type: BattleType) => {
    console.log(`🔧 [BATTLE_MODE_CONTAINER] Battle type changed to: ${type}`);
    if (battleState?.setBattleType) {
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
          setBattlesCompleted={stableSetBattlesCompleted}
          setBattleResults={stableSetBattleResults}
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
          setBattlesCompleted={stableSetBattlesCompleted}
          setBattleResults={stableSetBattleResults}
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render for meaningful changes
  const battleTypeChanged = prevProps.initialBattleType !== nextProps.initialBattleType;
  const pokemonCountChanged = prevProps.allPokemon.length !== nextProps.allPokemon.length;
  
  // Only update if battle type changed or we gained significant Pokemon data
  const shouldUpdate = battleTypeChanged || (pokemonCountChanged && nextProps.allPokemon.length > 0);
  
  console.log(`🎯 [CONTAINER_MEMO] Should update: ${shouldUpdate} (battleType: ${battleTypeChanged}, pokemonCount: ${pokemonCountChanged})`);
  
  return !shouldUpdate;
});

BattleModeContainer.displayName = "BattleModeContainer";

export default BattleModeContainer;
