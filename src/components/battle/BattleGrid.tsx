
import React, { useMemo } from "react";
import BattleCard from "./BattleCard";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";
import { validateBattlePokemon } from "@/services/pokemon/api/utils";

interface BattleGridProps {
  currentBattle: Pokemon[];
  selectedPokemon: number[];
  onPokemonSelect: (id: number) => void;
  battleType: BattleType;
  isProcessing: boolean;
  internalProcessing: boolean;
  animationKey: number;
}

const BattleGrid: React.FC<BattleGridProps> = ({
  currentBattle,
  selectedPokemon,
  onPokemonSelect,
  battleType,
  isProcessing,
  internalProcessing,
  animationKey
}) => {
  // Validate the Pokemon in the grid to ensure image and name consistency - memoized for performance
  const validatedBattle = useMemo(() => {
    // Make sure we have a valid array to validate
    if (!currentBattle || !Array.isArray(currentBattle) || currentBattle.length === 0) {
      console.warn('BattleGrid received empty or invalid currentBattle data');
      return [];
    }
    
    return validateBattlePokemon(currentBattle);
  }, [currentBattle]);
  
  // If we don't have valid battle data, show a loading state
  if (!validatedBattle.length) {
    return (
      <div className="grid gap-4 mt-8 grid-cols-2 md:grid-cols-3">
        {[1, 2, 3].map((placeholder) => (
          <div key={`placeholder-${placeholder}`} className="w-full h-[200px] bg-gray-100 animate-pulse rounded-md"></div>
        ))}
      </div>
    );
  }
  
  return (
    <div 
      key={animationKey}
      className="grid gap-4 mt-8"
      style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${validatedBattle.length}, 1fr)` 
      }}
    >
      {validatedBattle.map(pokemon => (
        <BattleCard
          key={pokemon.id}
          pokemon={pokemon}
          isSelected={selectedPokemon.includes(pokemon.id)}
          battleType={battleType}
          onSelect={onPokemonSelect}
          isProcessing={isProcessing || internalProcessing}
        />
      ))}
    </div>
  );
};

export default BattleGrid;
