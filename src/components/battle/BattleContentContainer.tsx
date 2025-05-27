
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
  console.log("[DEBUG BattleContentContainer] RENDER - allPokemon length:", allPokemon?.length || 0);
  
  // CRITICAL FIX: Lock Pokemon reference PERMANENTLY once we have enough data
  const pokemonLockedRef = useRef(false);
  const lockedPokemonRef = useRef<Pokemon[]>([]);
  
  // CRITICAL FIX: Lock Pokemon data once we have sufficient data - NEVER change after that
  const stablePokemon = useMemo(() => {
    // If Pokemon are already locked, NEVER change them
    if (pokemonLockedRef.current) {
      console.log(`[CRITICAL FIX] Pokemon LOCKED - ignoring count change from any value to ${allPokemon.length}`);
      return lockedPokemonRef.current;
    }
    
    // Only lock when we have enough Pokemon for battles
    if (allPokemon.length >= 150) {
      console.log(`[CRITICAL FIX] LOCKING Pokemon permanently at ${allPokemon.length} Pokemon`);
      lockedPokemonRef.current = allPokemon;
      pokemonLockedRef.current = true;
      return allPokemon;
    }
    
    // Return empty array until we have enough
    console.log(`[CRITICAL FIX] Waiting for sufficient Pokemon - current: ${allPokemon.length}`);
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
  
  console.log("BattleContentContainer: Using battle type:", safeBattleType, "Pokemon count:", stablePokemon.length);

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
  
  // NEVER re-render for Pokemon count changes once we have enough
  const shouldUpdate = battleTypeChanged || generationChanged;
  
  console.log("[DEBUG BattleContentContainer] Memo comparison:", {
    battleTypeChanged, 
    generationChanged,
    shouldUpdate,
    nextPokemonLength: nextProps.allPokemon.length
  });
  
  return !shouldUpdate;
});

BattleContentContainer.displayName = "BattleContentContainer";

export default BattleContentContainer;
