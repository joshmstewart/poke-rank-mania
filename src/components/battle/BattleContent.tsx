import React, { useEffect, useRef } from "react";
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

interface BattleContentProps {
  allPokemon: Pokemon[];
  initialBattleType: BattleType;
  initialSelectedGeneration: number;
}

const BattleContent = ({ allPokemon, initialBattleType, initialSelectedGeneration }: BattleContentProps) => {
  const battleStartedRef = useRef(false);
  const previousBattlesCompletedRef = useRef(0);
  const pokemonAnalysisLoggedRef = useRef(false);
  
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
    resetSuggestionPriority
  } = useBattleStateCore(allPokemon, initialBattleType, initialSelectedGeneration);

  // Only call startNewBattle once when the component mounts and allPokemon is available
  useEffect(() => {
    if (allPokemon.length > 0 && !battleStartedRef.current) {
      console.log("BattleContent: Starting new battle on initial load");
      battleStartedRef.current = true;
      
      // Explicitly prioritize suggestions when starting new battles
      if (resetSuggestionPriority) {
        console.log("BattleContent: Resetting suggestion priority on initial load");
        resetSuggestionPriority();
        
        // Dispatch event to ensure system knows to prioritize suggestions
        setTimeout(() => {
          window.dispatchEvent(new Event("prioritizeSuggestions"));
          
          // Then start the battle after a brief delay
          setTimeout(() => startNewBattle(initialBattleType), 50);
        }, 50);
      } else {
        startNewBattle(initialBattleType);
      }
    }
  }, [allPokemon.length, initialBattleType, startNewBattle, resetSuggestionPriority]);
  
  // Track if we have active suggestions and ensure they're prioritized periodically
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const suggestedPokemon = finalRankings.filter(
        p => p.suggestedAdjustment && !p.suggestedAdjustment.used
      );
      
      if (suggestedPokemon.length > 0 && !showingMilestone) {
        console.log(`🔍 Periodic check: Found ${suggestedPokemon.length} unused suggestions`);
        
        // Dispatch prioritization event every 30 seconds if we have suggestions
        window.dispatchEvent(new Event("prioritizeSuggestions"));
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(checkInterval);
  }, [finalRankings, showingMilestone]);
  
  // Keep track of battles completed to prevent resetting
  useEffect(() => {
    previousBattlesCompletedRef.current = battlesCompleted;
  }, [battlesCompleted]);

  // Log Pokemon variations once when data is available
  useEffect(() => {
    if (allPokemon.length > 0 && !pokemonAnalysisLoggedRef.current) {
      // Log Pokemon variation analysis
      logPokemonVariations(allPokemon);
      pokemonAnalysisLoggedRef.current = true;
    }
  }, [allPokemon]);

  // Calculate remaining battles based on the active tier
  const getBattlesRemaining = () => {
    // Use a logarithmic model, but focus only on the top N Pokémon
    const pokemonCount = activeTier === "All" ? allPokemon.length : typeof activeTier === "number" ? Math.min(activeTier, allPokemon.length) : allPokemon.length;
    
    // Using a logarithmic model: n * log(n) battles are needed for a good ranking
    // For top tiers, we need fewer battles
    const totalBattlesNeeded = Math.floor(pokemonCount * Math.log2(pokemonCount)) * 1.2;
    
    // Return remaining battles (minimum of 0)
    return Math.max(0, Math.ceil(totalBattlesNeeded - battlesCompleted));
  };

  const handleBattleTypeChange = (newType: BattleType) => {
    setBattleType(newType);
    
    // Reset suggestion priority first
    if (resetSuggestionPriority) {
      resetSuggestionPriority();
      setTimeout(() => {
        window.dispatchEvent(new Event("prioritizeSuggestions"));
        setTimeout(() => {
          startNewBattle(newType);
          resetMilestones();
        }, 50);
      }, 50);
    } else {
      startNewBattle(newType);
      resetMilestones();
    }
    
    localStorage.setItem('pokemon-ranker-battle-type', newType);
  };

  const handleGenerationChange = (generation: string) => {
    const genId = parseInt(generation, 10);
    setSelectedGeneration(genId);
    localStorage.setItem('pokemon-ranker-generation', generation);
    
    // Reset suggestion priority first
    if (resetSuggestionPriority) {
      resetSuggestionPriority();
      setTimeout(() => {
        window.dispatchEvent(new Event("prioritizeSuggestions"));
        setTimeout(() => {
          resetMilestones();
          startNewBattle(battleType);
        }, 50);
      }, 50);
    } else {
      resetMilestones();
      startNewBattle(battleType);
    }
  };

  const handleRestartBattles = () => {
    // Reset suggestion priority first
    if (resetSuggestionPriority) {
      resetSuggestionPriority();
      setTimeout(() => {
        window.dispatchEvent(new Event("prioritizeSuggestions"));
        setTimeout(() => {
          resetMilestones();
          startNewBattle(battleType);
        }, 50);
      }, 50);
    } else {
      resetMilestones();
      startNewBattle(battleType);
    }
  };

  const handleNewBattleSet = () => {
    // Reset suggestion priority first
    if (resetSuggestionPriority) {
      resetSuggestionPriority();
    }
    
    resetMilestones();
    // Reset the milestone processing flag when starting a new battle set
    if (resetMilestoneInProgress) {
      resetMilestoneInProgress();
    }
    
    // Dispatch event to ensure system knows to prioritize suggestions
    setTimeout(() => {
      window.dispatchEvent(new Event("prioritizeSuggestions"));
      setTimeout(() => startNewBattle(battleType), 50);
    }, 50);
  };

  const handleSaveRankings = () => {
    console.log("Rankings saved!");
    setShowingMilestone(false);
    // Reset the milestone processing flag after saving rankings
    if (resetMilestoneInProgress) {
      resetMilestoneInProgress();
    }
    
    // Explicitly prioritize suggestions after saving rankings
    if (resetSuggestionPriority) {
      resetSuggestionPriority();
      setTimeout(() => {
        window.dispatchEvent(new Event("prioritizeSuggestions"));
      }, 50);
    }
  };

  const handleTierChange = (tier: TopNOption) => {
    console.log("Changing tier to:", tier);
    setActiveTier(tier);
    // No need to restart battles, just keep going with new tier focus
  };

  // Calculate completion percentage
  useEffect(() => {
    calculateCompletionPercentage();
  }, [battlesCompleted, calculateCompletionPercentage]);

  if (!allPokemon.length) {
    return <div className="flex justify-center items-center h-64">Loading Pokémon...</div>;
  }

  // Create a wrapper function for handleTripletSelectionComplete that doesn't take arguments
  const handleTripletSelectionWrapper = () => {
    handleTripletSelectionComplete();
  };

  // Handle going back in battle history
  const handleGoBack = () => {
    console.log("BattleContent: Handling go back from BattleContent");
    goBack();
  };

  return (
    <div className="flex flex-col items-center w-full gap-4">
      <div className="w-full max-w-3xl flex flex-col gap-4">
        <BattleControls
          selectedGeneration={selectedGeneration}
          battleType={battleType}
          onGenerationChange={handleGenerationChange}
          onBattleTypeChange={handleBattleTypeChange}
          onRestartBattles={handleRestartBattles}
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
      
      {/* FIXED: Changed conditional rendering to CSS visibility control to prevent remounting */}
      <div className="w-full max-w-4xl">
        {/* Milestone view - always rendered but conditionally displayed */}
        <div style={{ display: showingMilestone ? 'block' : 'none' }}>
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
        </div>
        
        {/* Battle interface - always rendered but conditionally displayed */}
        <div style={{ display: showingMilestone ? 'none' : 'block' }}>
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
        </div>
      </div>
      
      <BattleFooterNote battlesCompleted={battlesCompleted} />
    </div>
  );
};

export default BattleContent;
