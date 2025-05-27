
import React, { useMemo, useRef, useCallback } from "react";
import BattleContent from "./BattleContent";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";
import { SingleBattle } from "@/hooks/battle/types";

interface BattleContentContainerProps {
  allPokemon: Pokemon[];
  initialSelectedGeneration: number;
  initialBattleType: BattleType;
  setBattlesCompleted?: React.Dispatch<React.SetStateAction<number>>;
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>;
}

const BattleContentContainer: React.FC<BattleContentContainerProps> = React.memo(({
  allPokemon = [],
  initialBattleType,
  initialSelectedGeneration = 0,
  setBattlesCompleted,
  setBattleResults
}) => {
  console.log(`🎯 [REFRESH_DEBUG] BattleContentContainer RENDER - allPokemon length: ${allPokemon?.length || 0}`);
  
  // CRITICAL: Track loading milestones that cause refreshes
  if (allPokemon.length === 1271) {
    console.log(`🚨 [REFRESH_DEBUG] BattleContentContainer hit 1271 milestone - POTENTIAL REFRESH TRIGGER!`);
  }
  if (allPokemon.length === 1025) {
    console.log(`🚨 [REFRESH_DEBUG] BattleContentContainer hit 1025 milestone - POTENTIAL REFRESH TRIGGER!`);
  }
  
  // CRITICAL FIX: Lock Pokemon reference PERMANENTLY once we have enough data
  const pokemonLockedRef = useRef(false);
  const lockedPokemonRef = useRef<Pokemon[]>([]);
  const lastPokemonCountRef = useRef(0);
  
  // CRITICAL FIX: Lock Pokemon data once we have sufficient data - NEVER change after that
  const stablePokemon = useMemo(() => {
    console.log(`🎯 [REFRESH_DEBUG] stablePokemon useMemo - current: ${allPokemon.length}, locked: ${pokemonLockedRef.current}, lastCount: ${lastPokemonCountRef.current}`);
    
    // If Pokemon are already locked, NEVER change them
    if (pokemonLockedRef.current) {
      console.log(`🔒 [REFRESH_DEBUG] Pokemon LOCKED - ignoring count change from ${lastPokemonCountRef.current} to ${allPokemon.length}`);
      return lockedPokemonRef.current;
    }
    
    // Only lock when we have enough Pokemon for battles
    if (allPokemon.length >= 150) {
      console.log(`🔒 [REFRESH_DEBUG] LOCKING Pokemon permanently at ${allPokemon.length} Pokemon - NEVER CHANGING AGAIN`);
      lockedPokemonRef.current = allPokemon;
      pokemonLockedRef.current = true;
      lastPokemonCountRef.current = allPokemon.length;
      return allPokemon;
    }
    
    // Update last count but don't lock yet
    lastPokemonCountRef.current = allPokemon.length;
    
    // Return empty array until we have enough
    console.log(`⏳ [REFRESH_DEBUG] Waiting for sufficient Pokemon - current: ${allPokemon.length}, need: 150`);
    return [];
  }, [allPokemon.length >= 150 ? 'LOCKED' : allPokemon.length]); // CRITICAL: Only change dependency when locking
  
  // CRITICAL FIX: Stable battle type to prevent unnecessary re-mounts
  const safeBattleType: BattleType = useMemo(() => {
    return initialBattleType === "triplets" ? "triplets" : "pairs";
  }, [initialBattleType]);
  
  // CRITICAL FIX: Memoized callback references to prevent prop changes
  const stableSetBattlesCompleted = useCallback((value: React.SetStateAction<number>) => {
    setBattlesCompleted?.(value);
  }, [setBattlesCompleted]);
  
  const stableSetBattleResults = useCallback((value: React.SetStateAction<SingleBattle[]>) => {
    setBattleResults?.(value);
  }, [setBattleResults]);
  
  console.log(`🎯 [REFRESH_DEBUG] BattleContentContainer: Using battle type: ${safeBattleType}, Pokemon count: ${stablePokemon.length}, locked: ${pokemonLockedRef.current}`);

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-4">
      <BattleContent
        allPokemon={stablePokemon}
        initialBattleType={safeBattleType}
        initialSelectedGeneration={initialSelectedGeneration}
        setBattlesCompleted={stableSetBattlesCompleted}
        setBattleResults={stableSetBattleResults}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // CRITICAL FIX: Only re-render for meaningful changes
  const battleTypeChanged = prevProps.initialBattleType !== nextProps.initialBattleType;
  const generationChanged = prevProps.initialSelectedGeneration !== nextProps.initialSelectedGeneration;
  
  // CRITICAL: Detailed logging about Pokemon count changes and decisions
  const prevCount = prevProps.allPokemon.length;
  const nextCount = nextProps.allPokemon.length;
  const pokemonCountChanged = prevCount !== nextCount;
  
  console.log(`🎯 [REFRESH_DEBUG] BattleContentContainer memo comparison:`, {
    battleTypeChanged, 
    generationChanged,
    pokemonCountChanged,
    prevCount,
    nextCount,
    willUpdate: battleTypeChanged || generationChanged
  });
  
  // Log milestone hits during memo comparison
  if (nextCount === 1271) {
    console.log(`🚨 [REFRESH_DEBUG] MEMO: Next count is 1271 milestone!`);
  }
  if (nextCount === 1025) {
    console.log(`🚨 [REFRESH_DEBUG] MEMO: Next count is 1025 milestone!`);
  }
  
  // NEVER re-render for Pokemon count changes once we have enough
  const shouldUpdate = battleTypeChanged || generationChanged;
  
  console.log(`🎯 [REFRESH_DEBUG] BattleContentContainer memo decision: shouldUpdate = ${shouldUpdate}`);
  
  return !shouldUpdate;
});

BattleContentContainer.displayName = "BattleContentContainer";

export default BattleContentContainer;
