
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
  const combinedProcessing = isProcessing || internalProcessing;
  
  const currentBattleCount = parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10);
  
  console.log(`🔄 [BATTLE_GRID_CRITICAL] ===== BattleGrid render - Battle #${currentBattleCount + 1} =====`);
  console.log(`🔄 [BATTLE_GRID_CRITICAL] Raw currentBattle received:`, currentBattle);
  
  // CRITICAL: Log each Pokemon in the current battle before validation
  if (currentBattle && currentBattle.length > 0) {
    currentBattle.forEach((pokemon, index) => {
      console.log(`🔄 [BATTLE_GRID_CRITICAL] Raw Pokemon #${index}: "${pokemon.name}" (ID: ${pokemon.id})`);
      
      const isUnformatted = pokemon.name.includes('-') && !pokemon.name.includes('(') && !pokemon.name.includes('Mega ') && !pokemon.name.includes('Alolan ');
      if (isUnformatted) {
        console.error(`🚨 [BATTLE_GRID_CRITICAL] UNFORMATTED NAME IN CURRENT BATTLE: "${pokemon.name}" (ID: ${pokemon.id})`);
      }
    });
  }
  
  // Validate the Pokemon in the grid to ensure image and name consistency - memoized for performance
  const validatedBattle = useMemo(() => {
    // Make sure we have a valid array to validate
    if (!currentBattle || !Array.isArray(currentBattle) || currentBattle.length === 0) {
      console.warn(`[BATTLE_VALIDATION] Battle #${currentBattleCount + 1}: BattleGrid received empty or invalid currentBattle data`);
      return [];
    }
    
    console.log(`🔄 [BATTLE_GRID_CRITICAL] About to validate battle Pokemon - BEFORE validation:`, currentBattle.map(p => ({ id: p.id, name: p.name })));
    
    const validated = validateBattlePokemon(currentBattle);
    
    console.log(`🔄 [BATTLE_GRID_CRITICAL] Validation complete - AFTER validation:`, validated.map(p => ({ id: p.id, name: p.name })));
    
    // CRITICAL: Check if validation changed any names
    currentBattle.forEach((original, index) => {
      const validatedPokemon = validated[index];
      if (validatedPokemon && original.name !== validatedPokemon.name) {
        console.error(`🚨 [BATTLE_GRID_CRITICAL] VALIDATION CHANGED NAME: "${original.name}" → "${validatedPokemon.name}" (ID: ${original.id})`);
      }
    });
    
    console.log(`✅ [BATTLE_VALIDATION] Battle #${currentBattleCount + 1}: Validated ${validated.length} Pokémon for battle grid`);
    
    return validated;
  }, [currentBattle, battleType, currentBattleCount]);
  
  // CRITICAL: Log the final validated battle Pokemon
  console.log(`🔄 [BATTLE_GRID_CRITICAL] Final validatedBattle being passed to BattleCards:`, validatedBattle.map(p => ({ id: p.id, name: p.name })));
  console.log(`🔄 [BATTLE_GRID_CRITICAL] ===== END BattleGrid Battle #${currentBattleCount + 1} =====`);
  
  if (!validatedBattle.length) {
    console.error(`🔄 [LOADING_PLACEHOLDER] Battle #${currentBattleCount + 1}: BattleGrid showing placeholder loading state - NO VALIDATED BATTLE DATA`);
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
      data-processing={combinedProcessing ? "true" : "false"}
      data-loading-circles={combinedProcessing ? "visible" : "hidden"}
      data-battle-count={currentBattleCount + 1}
      className="grid gap-4 mt-8 mx-auto" 
      style={{ 
        display: 'grid',
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        width: '100%',
        maxWidth: validatedBattle.length <= 2 ? '560px' : '100%',
        visibility: 'visible'
      }}
    >
      {validatedBattle.map(pokemon => {
        console.log(`🎯 [BATTLE_CARD_RENDER_CRITICAL] Battle #${currentBattleCount + 1} BattleCard for "${pokemon.name}" (ID: ${pokemon.id})`);
        return (
          <BattleCard
            key={`${pokemon.id}-${animationKey}`}
            pokemon={pokemon}
            isSelected={selectedPokemon.includes(pokemon.id)}
            battleType={battleType}
            onSelect={onPokemonSelect}
            isProcessing={combinedProcessing}
          />
        );
      })}
    </div>
  );
};

export default BattleGrid;
