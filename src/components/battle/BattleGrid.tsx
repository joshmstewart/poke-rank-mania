
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
  
  // ENHANCED: Add battle count context to all logs
  const currentBattleCount = parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10);
  
  console.log(`🔄 [LOADING_CIRCLES_ENHANCED] BattleGrid render - Battle #${currentBattleCount + 1}:`, {
    battleType,
    currentBattleLength: currentBattle?.length || 0,
    currentBattleIds: currentBattle?.map(p => p.id).join(',') || '',
    selectedPokemon: selectedPokemon.join(', '),
    isProcessing,
    internalProcessing,
    combinedProcessing,
    animationKey,
    timestamp: new Date().toISOString(),
    componentState: 'BattleGrid-Active',
    battleCount: currentBattleCount
  });
  
  // ENHANCED: Specific logging for battles 10-11 transition
  if (currentBattleCount === 10 || currentBattleCount === 11) {
    console.error(`🔥 [BATTLE_10_11_DEBUG] BattleGrid render for CRITICAL battle ${currentBattleCount + 1}:`, {
      hasCurrentBattle: !!currentBattle && currentBattle.length > 0,
      battleIds: currentBattle?.map(p => p.id) || [],
      pokemonNames: currentBattle?.map(p => p.name) || [],
      isProcessing,
      internalProcessing,
      combinedProcessing,
      animationKey
    });
  }
  
  // ENHANCED: Log when loading circles should be visible with more context
  if (combinedProcessing) {
    console.error(`🟡 [LOADING_CIRCLES_CRITICAL] BattleGrid SHOWING loading circles - Battle #${currentBattleCount + 1}:`, {
      isProcessing,
      internalProcessing,
      reason: isProcessing ? 'isProcessing=true' : 'internalProcessing=true',
      battleHasPokemon: !!currentBattle && currentBattle.length > 0,
      timestamp: new Date().toISOString()
    });
  } else {
    console.log(`🟢 [LOADING_CIRCLES] BattleGrid NOT showing loading circles - Battle #${currentBattleCount + 1} - both states false`);
  }
  
  // Validate the Pokemon in the grid to ensure image and name consistency - memoized for performance
  const validatedBattle = useMemo(() => {
    // Make sure we have a valid array to validate
    if (!currentBattle || !Array.isArray(currentBattle) || currentBattle.length === 0) {
      console.warn(`[BATTLE_VALIDATION] Battle #${currentBattleCount + 1}: BattleGrid received empty or invalid currentBattle data`);
      return [];
    }
    
    const validated = validateBattlePokemon(currentBattle);
    console.log(`✅ [BATTLE_VALIDATION] Battle #${currentBattleCount + 1}: Validated ${validated.length} Pokémon for battle grid`);
    
    // Double check that we have the right number of pokemon for the battle type
    const expectedCount = battleType === 'pairs' ? 2 : 3;
    if (validated.length !== expectedCount) {
      console.error(`⚠️ [BATTLE_VALIDATION] Battle #${currentBattleCount + 1}: Expected ${expectedCount} Pokémon for ${battleType} battle, but got ${validated.length}`);
    }
    
    // ENHANCED: Log the validated Pokemon details for debugging
    validated.forEach(pokemon => {
      console.log(`🔍 [BATTLE_VALIDATION] Battle #${currentBattleCount + 1} validated: ${pokemon.name} (#${pokemon.id}) - image: ${pokemon.image?.substring(0, 80)}...`);
    });
    
    return validated;
  }, [currentBattle, battleType, currentBattleCount]);
  
  // ENHANCED: Add more context to loading state logging
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
  
  console.log(`🎮 [BATTLE_GRID_RENDER] Battle #${currentBattleCount + 1}: Rendering ${validatedBattle.length} Pokémon cards with processing=${combinedProcessing}`);
  
  // ENHANCED: Log battles 10-11 specifically
  if (currentBattleCount === 10 || currentBattleCount === 11) {
    console.error(`🔥 [BATTLE_10_11_RENDER] Battle ${currentBattleCount + 1} final render:`, {
      pokemonCount: validatedBattle.length,
      pokemonNames: validatedBattle.map(p => p.name),
      showingLoadingCircles: combinedProcessing,
      gridVisible: 'YES'
    });
  }
  
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
        console.log(`🎯 [BATTLE_CARD_RENDER] Battle #${currentBattleCount + 1} BattleCard for ${pokemon.name} - processing: ${combinedProcessing}`);
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
