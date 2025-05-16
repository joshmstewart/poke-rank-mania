
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
  
  // Update animation key when current battle changes
  useEffect(() => {
    if (currentBattle && currentBattle.length > 0) {
      setAnimationKey(prev => prev + 1);
    }
  }, [currentBattle]);

  // Handle pokemon selection
  const handlePokemonCardSelect = useCallback((id: number) => {
    if (!isProcessing) {
      onPokemonSelect(id);
    }
  }, [onPokemonSelect, isProcessing]);

  // Handle submission for triplets mode
  const handleSubmit = useCallback(() => {
    if (!isProcessing) {
      onTripletSelectionComplete();
    }
  }, [onTripletSelectionComplete, isProcessing]);

  // Handle back button click
  const handleBackClick = useCallback(() => {
    if (!isProcessing) {
      onGoBack();
    }
  }, [onGoBack, isProcessing]);
  
  // Only render if we have Pokemon to display
  if (!currentBattle || currentBattle.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {battleHistory.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2" 
                onClick={handleBackClick}
                disabled={isProcessing}
              >
                <ChevronLeft className="mr-1" /> Back
              </Button>
            )}
   <h2 className="text-2xl font-bold">Battle {battlesCompleted + 1}</h2>

          </div>
          
          {isProcessing && (
            <div className="text-sm text-amber-600 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-amber-600 mr-2"></div>
              Processing...
            </div>
          )}
        </div>
        
        <div className="h-1 w-full bg-gray-200 rounded-full mt-2">
          <div 
            className="h-1 bg-primary rounded-full transition-all duration-500" 
            style={{ 
              width: `${(battlesCompleted % (milestones.find(m => m > battlesCompleted) || 10)) / 
              (milestones.find(m => m > battlesCompleted) || 10) * 100}%` 
            }}
          ></div>
        </div>
        <div className="text-xs text-right mt-1 text-gray-500">
          Next milestone: {milestones.find(m => m > battlesCompleted) || "∞"} battles
        </div>
      </div>
      
      <div 
        key={animationKey}
        className="grid gap-4 mt-8"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${currentBattle.length}, 1fr)` }}
      >
        {currentBattle.map(pokemon => (
          <BattleCard
            key={pokemon.id}
            pokemon={pokemon}
            isSelected={selectedPokemon.includes(pokemon.id)}
            battleType={battleType}
            onSelect={handlePokemonCardSelect}
            isProcessing={isProcessing}
          />
        ))}
      </div>
      
      {battleType === "triplets" && (
        <div className="mt-8 flex justify-center">
          <Button 
            size="lg" 
            onClick={handleSubmit}
            className="px-8"
            disabled={isProcessing || selectedPokemon.length === 0}
          >
            {isProcessing ? (
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
