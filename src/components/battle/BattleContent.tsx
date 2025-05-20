
import React, { useEffect, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { useBattleStateCore } from "@/hooks/battle/useBattleStateCore";
import BattleInterface from "./BattleInterface";
import BattleHeader from "./BattleHeader";
import BattleControls from "./BattleControls";
import BattleFooterNote from "./BattleFooterNote";
import { BattleType } from "@/hooks/battle/types";
import { toast } from "@/hooks/use-toast";

interface BattleContentProps {
  allPokemon: Pokemon[];
  initialBattleType: BattleType;
  initialSelectedGeneration: number;
}

const BattleContent = ({ allPokemon, initialBattleType, initialSelectedGeneration }: BattleContentProps) => {
  const battleStartedRef = useRef(false);
  const milestoneShownRef = useRef<Set<number>>(new Set());
  
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
    generateRankings
  } = useBattleStateCore(allPokemon, initialBattleType, initialSelectedGeneration);

  // Only call startNewBattle once when the component mounts and allPokemon is available
  useEffect(() => {
    if (allPokemon.length > 0 && !battleStartedRef.current) {
      console.log("BattleContent: Starting new battle on initial load");
      battleStartedRef.current = true;
      startNewBattle(initialBattleType);
    }
  }, [allPokemon.length, initialBattleType, startNewBattle]);
  
  // Check for milestones and show toast notifications
  useEffect(() => {
    // Only check for milestones at specific battle counts
    if (battlesCompleted > 0 && milestones.includes(battlesCompleted)) {
      // Only show toast if we haven't shown it already for this milestone
      if (!milestoneShownRef.current.has(battlesCompleted)) {
        console.log(`Showing milestone toast for battle ${battlesCompleted}`);
        milestoneShownRef.current.add(battlesCompleted);
        
        // Show toast notification
        toast({
          title: "Milestone Reached!",
          description: `You've completed ${battlesCompleted} battles. Rankings have been updated.`
        });
        
        // Generate rankings at milestone
        generateRankings([]);
      }
    }
  }, [battlesCompleted, milestones, generateRankings]);

  const handleBattleTypeChange = (newType: BattleType) => {
    setBattleType(newType);
    startNewBattle(newType);
    resetMilestones();
    localStorage.setItem('pokemon-ranker-battle-type', newType);
  };

  const handleGenerationChange = (generation: string) => {
    const genId = parseInt(generation, 10);
    setSelectedGeneration(genId);
    localStorage.setItem('pokemon-ranker-generation', generation);
    resetMilestones();
    startNewBattle(battleType);
  };

  const handleRestartBattles = () => {
    resetMilestones();
    startNewBattle(battleType);
    milestoneShownRef.current.clear();
  };

  if (!allPokemon.length) {
    return <div className="flex justify-center items-center h-64">Loading Pokémon...</div>;
  }

  return (
    <div className="flex flex-col items-center w-full gap-4">
      <BattleHeader />
      
      <BattleControls
        selectedGeneration={selectedGeneration}
        battleType={battleType}
        onGenerationChange={handleGenerationChange}
        onBattleTypeChange={handleBattleTypeChange}
        onRestartBattles={handleRestartBattles}
      />
      
      <BattleInterface
        currentBattle={currentBattle}
        selectedPokemon={selectedPokemon}
        onPokemonSelect={handlePokemonSelect}
        onTripletSelectionComplete={handleTripletSelectionComplete}
        isProcessing={isProcessingResult}
        battleType={battleType}
        onGoBack={goBack}
        battlesCompleted={battlesCompleted}
        battleHistory={[]}
        milestones={milestones}
      />
      
      <BattleFooterNote battlesCompleted={battlesCompleted} />
    </div>
  );
};

export default BattleContent;
