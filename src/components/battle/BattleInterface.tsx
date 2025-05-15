
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Pokemon } from "@/services/pokemonService";
import BattleCard from "./BattleCard";

interface BattleInterfaceProps {
  currentBattle: Pokemon[];
  selectedPokemon: number[];
  battlesCompleted: number;
  battleType: "pairs" | "triplets";
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
  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousBattle, setPreviousBattle] = useState<Pokemon[]>([]);
  
  // Set up animation when current battle changes
  useEffect(() => {
    // Skip animation on first render
    if (previousBattle.length > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500); // Animation duration
      return () => clearTimeout(timer);
    } else {
      setPreviousBattle(currentBattle);
    }
  }, [currentBattle]);

  // Update previous battle after animation completes
  useEffect(() => {
    if (!isAnimating) {
      setPreviousBattle(currentBattle);
    }
  }, [isAnimating, currentBattle]);

  // Log the current battle Pokémon for debugging
  console.log("Current battle Pokémon:", currentBattle.map(p => p.name));
  
  // Label for the battle type
  const battleLabel = battleType === "pairs" ? "favorite" : "preferences (0-3)";
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <div className="flex justify-between items-center">
          {/* Moved the back button into the flex container */}
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
            <h2 className={`text-2xl font-bold ${isAnimating ? 'animate-fade-in' : ''}`}>Battle {battlesCompleted + 1}</h2>
          </div>
          <div className={`text-sm text-gray-500 ${isAnimating ? 'animate-fade-in' : ''}`}>
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
      
      {/* Battle cards with animation */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'} transition-all duration-500`}>
        {currentBattle.map(pokemon => (
          <BattleCard
            key={pokemon.id}
            pokemon={pokemon}
            isSelected={selectedPokemon.includes(pokemon.id)}
            battleType={battleType}
            onSelect={onPokemonSelect}
          />
        ))}
      </div>
      
      {/* Always show the submit button for triplets */}
      {battleType === "triplets" && (
        <div className={`mt-8 flex justify-center ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} transition-all duration-500`}>
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
