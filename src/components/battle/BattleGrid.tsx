
import React from "react";
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
  // Validate the Pokemon in the grid to ensure image and name consistency
  const validatedBattle = validateBattlePokemon(currentBattle);
  
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
