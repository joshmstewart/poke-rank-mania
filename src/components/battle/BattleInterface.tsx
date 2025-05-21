
import React, { useState, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";
import BattleHeader from "./BattleHeader";
import BattleProgress from "./BattleProgress";
import BattleGrid from "./BattleGrid";
import BattleSubmitButton from "./BattleSubmitButton";
import { useMilestoneCalculations } from "@/hooks/battle/useMilestoneCalculations";

interface BattleInterfaceProps {
  currentBattle: Pokemon[];
  selectedPokemon: number[];
  battlesCompleted: number;
  battleType: BattleType;
  battleHistory: { battle: Pokemon[], selected: number[] }[];
  onPokemonSelect: (id: number) => void;
  onTripletSelectionComplete: () => void;
  onGoBack: () => void;
  milestones: number[];
  isProcessing?: boolean;
}

const BattleInterface: React.FC<BattleInterfaceProps> = ({
  currentBattle,
  selectedPokemon,
  battlesCompleted,
  battleType,
  battleHistory,
  onPokemonSelect,
  onTripletSelectionComplete,
  onGoBack,
  milestones,
  isProcessing = false
}) => {
  // Component state
  const [animationKey, setAnimationKey] = useState(0);
  const [internalProcessing, setInternalProcessing] = useState(false);
  const [displayedBattlesCompleted, setDisplayedBattlesCompleted] = useState(battlesCompleted);
  const [previousBattleIds, setPreviousBattleIds] = useState<number[]>([]);
  
  const { getNextMilestone, getMilestoneProgress } = useMilestoneCalculations(
    displayedBattlesCompleted, 
    milestones
  );
  
  // Update animation key when current battle changes
  useEffect(() => {
    if (currentBattle && currentBattle.length > 0) {
      setAnimationKey(prev => prev + 1);
      
      // Debug: Log every time current battle changes
      const currentIds = currentBattle.map(p => p.id);
      const isSameAsPrevious = previousBattleIds.length === currentIds.length && 
        previousBattleIds.every(id => currentIds.includes(id));
      
      console.log(`🔄 BattleInterface: Battle changed to [${currentBattle.map(p => `${p.id}:${p.name}`).join(', ')}]`);
      console.log(`🔎 BattleInterface: Same Pokemon IDs as previous? ${isSameAsPrevious ? "YES ⚠️" : "NO ✅"}`);
      
      // Create a custom event for monitoring battles
      const battleEvent = new CustomEvent('battle-created', { 
        detail: { 
          pokemonIds: currentIds,
          pokemonNames: currentBattle.map(p => p.name),
        } 
      });
      document.dispatchEvent(battleEvent);
      
      // Store current IDs as previous for next comparison
      setPreviousBattleIds(currentIds);
    }
  }, [currentBattle]);
  
  // Update displayed battles completed for smoother UI
  useEffect(() => {
    setDisplayedBattlesCompleted(battlesCompleted);
  }, [battlesCompleted]);
  
  // Handle pokemon selection with debounce to prevent multiple clicks
  const handlePokemonCardSelect = (id: number) => {
    if (!isProcessing && !internalProcessing) {
      console.log("BattleInterface: Handling Pokemon selection:", id);
      setInternalProcessing(true);
      onPokemonSelect(id);
      
      // Reset internal processing state after a shorter delay (100ms)
      setTimeout(() => setInternalProcessing(false), 100);
    } else {
      console.log("BattleInterface: Ignoring click while processing");
    }
  };

  // Handle submission for triplets mode
  const handleSubmit = () => {
    if (!isProcessing && !internalProcessing) {
      console.log("BattleInterface: Submitting triplet selection");
      setInternalProcessing(true);
      onTripletSelectionComplete();
      
      // Reset internal processing state after a shorter delay (100ms)
      setTimeout(() => setInternalProcessing(false), 100);
    }
  };

  // Handle back button click
  const handleBackClick = () => {
    if (!isProcessing && !internalProcessing) {
      onGoBack();
    }
  };
  
  // Only render if we have Pokemon to display
  if (!currentBattle || currentBattle.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6 w-full">
      <div className="mb-4">
        <BattleHeader
          battlesCompleted={displayedBattlesCompleted}
          onGoBack={handleBackClick}
          hasHistory={battleHistory.length > 0}
          isProcessing={isProcessing}
          internalProcessing={internalProcessing}
        />
        
        <BattleProgress
          battlesCompleted={displayedBattlesCompleted}
          getMilestoneProgress={getMilestoneProgress}
          getNextMilestone={getNextMilestone}
        />
      </div>
      
      <BattleGrid
        currentBattle={currentBattle}
        selectedPokemon={selectedPokemon}
        onPokemonSelect={handlePokemonCardSelect}
        battleType={battleType}
        isProcessing={isProcessing}
        internalProcessing={internalProcessing}
        animationKey={animationKey}
      />
      
      {battleType === "triplets" && (
        <BattleSubmitButton
          onSubmit={handleSubmit}
          isProcessing={isProcessing}
          internalProcessing={internalProcessing}
          hasSelections={selectedPokemon.length > 0}
        />
      )}
    </div>
  );
};

export default BattleInterface;
