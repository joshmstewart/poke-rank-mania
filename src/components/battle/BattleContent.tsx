import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { Pokemon, TopNOption } from "@/services/pokemon";
import { useBattleStateCore } from "@/hooks/battle/useBattleStateCore";
import BattleInterface from "./BattleInterface";
import BattleControls from "./BattleControls";
import BattleFooterNote from "./BattleFooterNote";
import { BattleType } from "@/hooks/battle/types";
import RankingDisplay from "./RankingDisplay";
import ProgressTracker from "./ProgressTracker";
import TierSelector from "./TierSelector";
import { logPokemonVariations } from "@/utils/pokemonListingLogger";
import { SingleBattle } from "@/hooks/battle/types";

interface BattleContentProps {
  allPokemon: Pokemon[];
  initialSelectedGeneration: number;
  initialBattleType: BattleType;
  setBattlesCompleted?: React.Dispatch<React.SetStateAction<number>>;
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>;
}

const BattleContent = ({
  allPokemon = [],
  initialBattleType,
  initialSelectedGeneration,
  setBattlesCompleted,
  setBattleResults,
}: BattleContentProps) => {
  const instanceIdRef = useRef(`content-${Date.now()}`);
  const battleStartedRef = useRef(false);
  const pokemonAnalysisLoggedRef = useRef(false);
  
  console.log(`[DEBUG BattleContent] Instance: ${instanceIdRef.current} render - allPokemon: ${allPokemon.length}`);
  
  const stableInitialBattleType = useMemo(() => {
    return initialBattleType === "triplets" ? "triplets" : "pairs";
  }, [initialBattleType]);
  
  const stablePokemon = useMemo(() => allPokemon, [allPokemon.length]);

  const {
    currentBattle,
    battlesCompleted,
    showingMilestone,
    setShowingMilestone,
    selectedGeneration,
    setSelectedGeneration,
    completionPercentage,
    rankingGenerated,
    selectedPokemon,
    battleType,
    setBattleType,
    finalRankings,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    handleSelection,
    goBack,
    isProcessingResult,
    startNewBattle,
    milestones,
    resetMilestones,
    calculateCompletionPercentage,
    getSnapshotForMilestone,
    generateRankings,
    battleHistory,
    activeTier,
    setActiveTier,
    suggestRanking,
    removeSuggestion,
    handleContinueBattles,
    resetMilestoneInProgress,
    performFullBattleReset 
  } = useBattleStateCore(
    stablePokemon,
    stableInitialBattleType,
    initialSelectedGeneration
  );

  // Log showing milestone state changes - this might be causing gray screen
  useEffect(() => {
    console.log(`🔄 [GRAY SCREEN DEBUG] BattleContent showingMilestone changed:`, {
      showingMilestone,
      currentBattleLength: currentBattle?.length || 0,
      isProcessingResult,
      timestamp: new Date().toISOString()
    });
  }, [showingMilestone, currentBattle?.length, isProcessingResult]);

  // Start battle once when component mounts
  useEffect(() => {
    if (stablePokemon.length > 0 && !battleStartedRef.current) {
      console.log("[GRAY SCREEN DEBUG] BattleContent: Starting initial battle");
      battleStartedRef.current = true;
      startNewBattle(stableInitialBattleType);
      localStorage.setItem('pokemon-ranker-battle-type', stableInitialBattleType);
    }
  }, [stablePokemon.length, startNewBattle, stableInitialBattleType]);
  
  // Log Pokemon variations once
  useEffect(() => {
    if (stablePokemon.length > 0 && !pokemonAnalysisLoggedRef.current) {
      logPokemonVariations(stablePokemon);
      pokemonAnalysisLoggedRef.current = true;
    }
  }, [stablePokemon.length]);

  // Calculate remaining battles
  const getBattlesRemaining = () => {
    const pokemonCount = activeTier === "All" ? stablePokemon.length : typeof activeTier === "number" ? Math.min(activeTier, stablePokemon.length) : stablePokemon.length;
    const totalBattlesNeeded = Math.floor(pokemonCount * Math.log2(pokemonCount)) * 1.2;
    return Math.max(0, Math.ceil(totalBattlesNeeded - battlesCompleted));
  };

  const handleBattleTypeChange = useCallback((newType: BattleType) => {
    console.log("[GRAY SCREEN DEBUG] BattleContent: Changing battle type from", battleType, "to", newType);
    setBattleType(newType);
    startNewBattle(newType);
    resetMilestones();
    localStorage.setItem('pokemon-ranker-battle-type', newType);
  }, [battleType, setBattleType, startNewBattle, resetMilestones]);

  const handleGenerationChange = useCallback((generation: string) => {
    const genId = parseInt(generation, 10);
    setSelectedGeneration(genId);
    localStorage.setItem('pokemon-ranker-generation', generation);
    resetMilestones();
    startNewBattle(battleType);
  }, [setSelectedGeneration, resetMilestones, startNewBattle, battleType]);

  const handleRestartBattles = useCallback(() => {
    resetMilestones();
    startNewBattle(battleType);
  }, [resetMilestones, startNewBattle, battleType]);

  const handleNewBattleSet = useCallback(() => {
    resetMilestones();
    if (resetMilestoneInProgress) {
      resetMilestoneInProgress();
    }
    startNewBattle(battleType);
  }, [resetMilestones, resetMilestoneInProgress, startNewBattle, battleType]);

  const handleSaveRankings = useCallback(() => {
    console.log("[GRAY SCREEN DEBUG] Rankings saved!");
    setShowingMilestone(false);
    if (resetMilestoneInProgress) {
      resetMilestoneInProgress();
    }
  }, [setShowingMilestone, resetMilestoneInProgress]);

  const handleTierChange = useCallback((tier: TopNOption) => {
    console.log("[GRAY SCREEN DEBUG] Changing tier to:", tier);
    setActiveTier(tier);
  }, [setActiveTier]);

  // Calculate completion percentage
  useEffect(() => {
    calculateCompletionPercentage();
  }, [battlesCompleted, calculateCompletionPercentage]);

  if (!stablePokemon.length) {
    console.log(`🔄 [GRAY SCREEN DEBUG] BattleContent showing Pokemon loading - this could be gray screen source`);
    return <div className="flex justify-center items-center h-64">Loading Pokémon...</div>;
  }

  const handleTripletSelectionWrapper = () => {
    console.log("[GRAY SCREEN DEBUG] BattleContent: handleTripletSelectionWrapper called");
    handleTripletSelectionComplete();
  };

  const handleGoBack = () => {
    console.log("[GRAY SCREEN DEBUG] BattleContent: Handling go back");
    goBack();
  };

  console.log(`🔄 [GRAY SCREEN DEBUG] BattleContent rendering main content:`, {
    showingMilestone,
    currentBattleLength: currentBattle?.length || 0,
    isProcessingResult,
    timestamp: new Date().toISOString()
  });

  return (
    <div className="flex flex-col items-center w-full gap-4">
      <div className="w-full max-w-3xl flex flex-col gap-4">
        <BattleControls
          selectedGeneration={selectedGeneration}
          battleType={battleType}
          onGenerationChange={handleGenerationChange}
          onBattleTypeChange={handleBattleTypeChange}
          onRestartBattles={handleRestartBattles}
          setBattlesCompleted={setBattlesCompleted}
          setBattleResults={setBattleResults}
          performFullBattleReset={performFullBattleReset}
        />
        
        <div className="flex items-center justify-between gap-4">
          <ProgressTracker 
            completionPercentage={completionPercentage}
            battlesCompleted={battlesCompleted}
            getBattlesRemaining={getBattlesRemaining}
          />
          
          <TierSelector 
            activeTier={activeTier}
            onTierChange={handleTierChange}
          />
        </div>
      </div>
      
      <div className="w-full max-w-4xl">
        {showingMilestone ? (
          <RankingDisplay
            finalRankings={finalRankings}
            battlesCompleted={battlesCompleted}
            onContinueBattles={handleContinueBattles}
            onNewBattleSet={handleNewBattleSet}
            rankingGenerated={true}
            onSaveRankings={handleSaveRankings}
            isMilestoneView={true}
            activeTier={activeTier}
            onTierChange={handleTierChange}
            onSuggestRanking={suggestRanking}
            onRemoveSuggestion={removeSuggestion}
          />
        ) : (
          <BattleInterface
            currentBattle={currentBattle}
            selectedPokemon={selectedPokemon}
            onPokemonSelect={handlePokemonSelect}
            onTripletSelectionComplete={handleTripletSelectionWrapper}
            isProcessing={isProcessingResult}
            battleType={battleType}
            onGoBack={handleGoBack}
            battlesCompleted={battlesCompleted}
            battleHistory={battleHistory || []}
            milestones={milestones}
          />
        )}
      </div>
      
      <BattleFooterNote battlesCompleted={battlesCompleted} />
    </div>
  );
};

export default BattleContent;
