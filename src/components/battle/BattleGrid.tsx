
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
  console.log(`🔄 BattleGrid render - battleType: ${battleType}, currentBattle length: ${currentBattle?.length || 0}, selectedPokemon: [${selectedPokemon.join(', ')}], isProcessing: ${isProcessing}, internalProcessing: ${internalProcessing}, animationKey: ${animationKey}`);
  
  // Validate the Pokemon in the grid to ensure image and name consistency - memoized for performance
  const validatedBattle = useMemo(() => {
    // Make sure we have a valid array to validate
    if (!currentBattle || !Array.isArray(currentBattle) || currentBattle.length === 0) {
      console.warn('BattleGrid received empty or invalid currentBattle data');
      return [];
    }
    
    const validated = validateBattlePokemon(currentBattle);
    console.log(`✅ BattleGrid: Validated ${validated.length} Pokémon for battle grid`);
    
    // Double check that we have the right number of pokemon for the battle type
    const expectedCount = battleType === 'pairs' ? 2 : 3;
    if (validated.length !== expectedCount) {
      console.warn(`⚠️ BattleGrid: Expected ${expectedCount} Pokémon for ${battleType} battle, but got ${validated.length}`);
    }
    
    return validated;
  }, [currentBattle, battleType]);
  
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
  
  // Determine grid columns based on battle size
  const gridCols = validatedBattle.length <= 3 ? validatedBattle.length : Math.min(validatedBattle.length, 4);
  
  return (
    <div 
      key={animationKey}
      data-battletype={battleType}
      data-processing={isProcessing || internalProcessing ? "true" : "false"}
      className="grid gap-4 mt-8 mx-auto" 
      style={{ 
        display: 'grid',
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        width: '100%',
        maxWidth: validatedBattle.length <= 2 ? '560px' : '100%'
      }}
    >
      {validatedBattle.map(pokemon => (
        <BattleCard
          key={`${pokemon.id}-${animationKey}`}
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
