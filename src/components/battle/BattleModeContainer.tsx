import React, { useState, useEffect, useCallback, useMemo } from "react";
import BattleContentHeader from "./BattleContentHeader";
import BattleContentRenderer from "./BattleContentRenderer";
import { BattleLogDisplay } from "./BattleLogDisplay";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType, SingleBattle } from "@/hooks/battle/types";
import { useBattleStateSimplified } from "@/hooks/battle/useBattleStateSimplified";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { RefinementQueueProvider } from "./RefinementQueueProvider";
import { useBattleManualReorder } from "@/hooks/battle/useBattleManualReorder";

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
  console.log(`🚀 [CONTAINER_SIMPLIFIED] Rendering with ${allPokemon.length} Pokemon`);
  
  const [selectedGeneration, setSelectedGeneration] = useState(0);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const { totalBattles } = useTrueSkillStore();

  const handleGenerationChange = useCallback((gen: number) => {
    console.log(`🚀 [CONTAINER_SIMPLIFIED] Generation changed to: ${gen}`);
    setSelectedGeneration(gen);
  }, []);

  const handleBattleTypeChange = useCallback((type: BattleType) => {
    console.log(`🚀 [CONTAINER_SIMPLIFIED] Battle type changed to: ${type}`);
  }, []);

  // Function to add to battle log
  const addBattleLogEntry = useCallback((strategy: string) => {
    console.log(`📊 [BATTLE_LOG] Adding entry: ${strategy}`);
    setBattleLog(prevLog => [strategy, ...prevLog.slice(0, 9)]);
  }, []);

  // CRITICAL DEBUG: Monitor TrueSkill store changes
  useEffect(() => {
    console.log(`📊 [TRUESKILL_MONITOR] Total battles updated: ${totalBattles}`);
  }, [totalBattles]);

  return (
    <RefinementQueueProvider>
      <div className="relative">
        <BattleModeContainerContent
          allPokemon={allPokemon}
          initialBattleType={initialBattleType}
          selectedGeneration={selectedGeneration}
          setBattlesCompleted={setBattlesCompleted}
          setBattleResults={setBattleResults}
          handleGenerationChange={handleGenerationChange}
          handleBattleTypeChange={handleBattleTypeChange}
          addBattleLogEntry={addBattleLogEntry}
        />
        
        {/* Add the Battle Log Gadget */}
        <BattleLogDisplay log={battleLog} />
      </div>
    </RefinementQueueProvider>
  );
};

const BattleModeContainerContent: React.FC<{
  allPokemon: Pokemon[];
  initialBattleType: BattleType;
  selectedGeneration: number;
  setBattlesCompleted?: React.Dispatch<React.SetStateAction<number>>;
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>;
  handleGenerationChange: (gen: number) => void;
  handleBattleTypeChange: (type: BattleType) => void;
  addBattleLogEntry: (strategy: string) => void;
}> = ({
  allPokemon,
  initialBattleType,
  selectedGeneration,
  setBattlesCompleted,
  setBattleResults,
  handleGenerationChange,
  handleBattleTypeChange,
  addBattleLogEntry
}) => {
  const { totalBattles } = useTrueSkillStore();

  // Use the simplified battle state hook with battle log callback
  const battleState = useBattleStateSimplified(
    allPokemon,
    initialBattleType,
    selectedGeneration,
    addBattleLogEntry
  );

  // This function has the correct signature for onRankingsUpdate, despite its potentially confusing name.
  const onRankingsUpdateCallback = battleState.handleManualReorder as (updatedRankings: RankedPokemon[]) => void;

  const { handleManualReorder } = useBattleManualReorder(
    battleState.finalRankings,
    onRankingsUpdateCallback,
    false
  );

  // CRITICAL FIX: Sync battle count from TrueSkill store
  useEffect(() => {
    console.log(`📊 [BATTLE_COUNT_SYNC] Syncing battle count: TrueSkill=${totalBattles}, battleState=${battleState.battlesCompleted}`);
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

  const wrappedHandleGenerationChange = useCallback((gen: number) => {
    handleGenerationChange(gen);
    battleState.setSelectedGeneration(gen);
  }, [handleGenerationChange, battleState]);

  const wrappedHandleBattleTypeChange = useCallback((type: BattleType) => {
    handleBattleTypeChange(type);
    battleState.setBattleType(type);
  }, [handleBattleTypeChange, battleState]);

  const milestonesForRenderer = useMemo(() => {
    if (!Array.isArray(battleState.milestones)) {
      return [];
    }
    // The error indicates battleState.milestones is number[], so we convert it to Milestone[]
    return (battleState.milestones as any[]).map(m =>
      typeof m === 'number' ? { value: m, label: String(m) } : m
    );
  }, [battleState.milestones]);

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="flex flex-col space-y-4">
        <BattleContentHeader
          selectedGeneration={selectedGeneration}
          battleType={battleState.battleType}
          onGenerationChange={wrappedHandleGenerationChange}
          setBattleType={wrappedHandleBattleTypeChange}
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
          activeTier={battleState.activeTier as TopNOption}
          milestones={milestonesForRenderer}
          rankingGenerated={battleState.rankingGenerated}
          isAnyProcessing={battleState.isAnyProcessing}
          setSelectedGeneration={wrappedHandleGenerationChange}
          setBattleType={wrappedHandleBattleTypeChange}
          setShowingMilestone={battleState.setShowingMilestone}
          setActiveTier={battleState.setActiveTier as React.Dispatch<React.SetStateAction<TopNOption>>}
          handlePokemonSelect={battleState.handlePokemonSelect}
          handleTripletSelectionComplete={battleState.handleTripletSelectionComplete}
          goBack={battleState.goBack}
          handleContinueBattles={battleState.handleContinueBattles}
          performFullBattleReset={battleState.performFullBattleReset}
          handleSaveRankings={battleState.handleSaveRankings}
          suggestRanking={battleState.suggestRanking}
          removeSuggestion={battleState.removeSuggestion}
          resetMilestoneInProgress={battleState.resetMilestoneInProgress}
          handleManualReorder={handleManualReorder}
          onRankingsUpdate={onRankingsUpdateCallback}
          setBattlesCompleted={setBattlesCompleted}
          setBattleResults={setBattleResults}
        />
      </div>
    </div>
  );
};

export default BattleModeContainer;
