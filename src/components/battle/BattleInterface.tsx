
import React, { useState, useEffect } from "react";
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
  milestones
}) => {
  // Animation state without the flashing issue
  const [animationKey, setAnimationKey] = useState(0);
  
  // Update animation key when current battle changes to trigger a clean rerender
  useEffect(() => {
    if (currentBattle.length > 0) {
      setAnimationKey(prev => prev + 1);
    }
  }, [currentBattle]);

  // Handle Pokemon selection with direct processing for pairs mode
  const handleSelect = (id: number) => {
    onPokemonSelect(id);
    // For pairs mode, immediately submit after selection
    if (battleType === "pairs") {
      onTripletSelectionComplete();
    }
  };

  // Label for the battle type
  const battleLabel = battleType === "pairs" ? "favorite" : "preferences (0-3)";
  
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
                onClick={onGoBack}
              >
                <ChevronLeft className="mr-1" /> Back
              </Button>
            )}
            <h2 className="text-2xl font-bold">Battle {battlesCompleted + 1}</h2>
          </div>
          <div className="text-sm text-gray-500">
            Select your {battleLabel}
          </div>
        </div>
        
        {/* Progress bar that shows progress to the next milestone */}
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
      
      {/* Battle cards without the animation that causes flashing */}
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
            onSelect={handleSelect}
          />
        ))}
      </div>
      
      {/* Only show submit button for triplets mode */}
      {battleType === "triplets" && (
        <div className="mt-8 flex justify-center">
          <Button 
            size="lg" 
            onClick={onTripletSelectionComplete}
            className="px-8"
          >
            Submit Your Choices
          </Button>
        </div>
      )}
    </div>
  );
};

export default BattleInterface;
