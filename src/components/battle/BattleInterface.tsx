
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Pokemon } from "@/services/pokemon";
import BattleCard from "./BattleCard";
import { BattleType } from "@/hooks/battle/types";

interface BattleInterfaceProps {
  currentBattle: Pokemon[];
  selectedPokemon: number[];
  battlesCompleted: number;
  battleType: BattleType;
  battleHistory: { battle: Pokemon[], selected: number[] }[];
  onPokemonSelect: (id: number) => void;
  onTripletSelectionComplete: () => void; // This expects a function with no arguments
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
  
  // Update animation key when current battle changes
  useEffect(() => {
    if (currentBattle && currentBattle.length > 0) {
      setAnimationKey(prev => prev + 1);
    }
  }, [currentBattle]);
  
  // Update displayed battles completed for smoother UI
  useEffect(() => {
    setDisplayedBattlesCompleted(battlesCompleted);
  }, [battlesCompleted]);
  
  // Handle pokemon selection with debounce to prevent multiple clicks
  const handlePokemonCardSelect = useCallback((id: number) => {
    if (!isProcessing && !internalProcessing) {
      console.log("BattleInterface: Handling Pokemon selection:", id);
      setInternalProcessing(true);
      onPokemonSelect(id);
      
      // Reset internal processing state after a shorter delay (100ms)
      setTimeout(() => setInternalProcessing(false), 100);
    } else {
      console.log("BattleInterface: Ignoring click while processing");
    }
  }, [onPokemonSelect, isProcessing, internalProcessing]);

  // Handle submission for triplets mode
  const handleSubmit = useCallback(() => {
    if (!isProcessing && !internalProcessing) {
      console.log("BattleInterface: Submitting triplet selection");
      setInternalProcessing(true);
      onTripletSelectionComplete();
      
      // Reset internal processing state after a shorter delay (100ms)
      setTimeout(() => setInternalProcessing(false), 100);
    }
  }, [onTripletSelectionComplete, isProcessing, internalProcessing]);

  // Handle back button click
  const handleBackClick = useCallback(() => {
    if (!isProcessing && !internalProcessing) {
      onGoBack();
    }
  }, [onGoBack, isProcessing, internalProcessing]);
  
  // Get the next milestone
  const getNextMilestone = useCallback(() => {
    const nextMilestone = milestones.find(m => m > battlesCompleted);
    return nextMilestone || (battlesCompleted + 50); // If no milestone found, show next 50 battles
  }, [battlesCompleted, milestones]);
  
  // Calculate progress towards next milestone
  const getMilestoneProgress = useCallback(() => {
    // Find the next milestone
    const nextMilestone = getNextMilestone();
    
    // Find the previous milestone
    const prevMilestoneIndex = milestones.findIndex(m => m > battlesCompleted) - 1;
    const prevMilestone = prevMilestoneIndex >= 0 ? milestones[prevMilestoneIndex] : 0;
    
    // Calculate progress percentage between milestones
    if (nextMilestone === prevMilestone) return 100; // Avoid division by zero
    const progress = Math.min(100, Math.max(0, 
      ((battlesCompleted - prevMilestone) / (nextMilestone - prevMilestone)) * 100
    ));
    
    return progress;
  }, [battlesCompleted, milestones, getNextMilestone]);
  
  // Only render if we have Pokemon to display
  if (!currentBattle || currentBattle.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }
  
  // Calculate battles remaining until next milestone
  const battlesUntilNextMilestone = getNextMilestone() - battlesCompleted;
  
  return (
    <div className="bg-white rounded-lg shadow p-6 w-full">
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {battleHistory.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2" 
                onClick={handleBackClick}
                disabled={isProcessing || internalProcessing}
              >
                <ChevronLeft className="mr-1" /> Back
              </Button>
            )}
            <h2 className="text-2xl font-bold">Battle {displayedBattlesCompleted + 1}</h2>
          </div>
          
          {(isProcessing || internalProcessing) && (
            <div className="text-sm text-amber-600 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-amber-600 mr-2"></div>
              Processing...
            </div>
          )}
        </div>
        
        <div className="h-1 w-full bg-gray-200 rounded-full mt-2">
          <div 
            className="h-1 bg-primary rounded-full transition-all duration-500" 
            style={{ width: `${getMilestoneProgress()}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs mt-1 text-gray-500">
          <div>Battle: {displayedBattlesCompleted + 1}</div>
          <div>
            Next milestone: <span className="font-medium">{battlesUntilNextMilestone}</span> battles away
          </div>
        </div>
      </div>
      
      <div 
        key={animationKey}
        className="grid gap-4 mt-8"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${currentBattle.length}, 1fr)` 
        }}
      >
        {currentBattle.map(pokemon => (
          <BattleCard
            key={pokemon.id}
            pokemon={pokemon}
            isSelected={selectedPokemon.includes(pokemon.id)}
            battleType={battleType}
            onSelect={handlePokemonCardSelect}
            isProcessing={isProcessing || internalProcessing}
          />
        ))}
      </div>
      
      {battleType === "triplets" && (
        <div className="mt-8 flex justify-center">
          <Button 
            size="lg" 
            onClick={handleSubmit}
            className="px-8"
            disabled={isProcessing || internalProcessing || selectedPokemon.length === 0}
          >
            {(isProcessing || internalProcessing) ? (
              <>
                <span className="mr-2 animate-spin">⏳</span>
                Processing...
              </>
            ) : (
              'Submit Your Choices'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default BattleInterface;
