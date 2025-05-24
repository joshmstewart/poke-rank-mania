
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
  
  // PERFORMANCE FIX: Use stable reference tracking to prevent unnecessary re-mounts
  const instanceRef = useRef(`container-${Date.now()}`);
  const pokemonStableRef = useRef<Pokemon[]>([]);
  
  // CRITICAL PERFORMANCE FIX: Only update Pokemon reference when data actually changes
  const stablePokemon = useMemo(() => {
    // Only create new reference if length changed or we have meaningful data change
    if (allPokemon.length !== pokemonStableRef.current.length) {
      console.log(`[DEBUG BattleContentContainer] Pokemon data changed - length ${pokemonStableRef.current.length} -> ${allPokemon.length}`);
      pokemonStableRef.current = allPokemon;
      return allPokemon;
    }
    
    // Return existing reference to maintain memoization
    console.log(`[DEBUG BattleContentContainer] Pokemon data unchanged - maintaining stable reference`);
    return pokemonStableRef.current;
  }, [allPokemon.length]);
  
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
  
  // Only force battle check if we actually have new Pokemon data
  React.useEffect(() => {
    if (stablePokemon && stablePokemon.length > 0) {
      console.log("[DEBUG BattleContentContainer] Pokemon data available, dispatching battle check");
      
      const timer = setTimeout(() => {
        document.dispatchEvent(new CustomEvent("force-new-battle", {
          detail: { battleType: safeBattleType }
        }));
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [stablePokemon.length, safeBattleType]);

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
  // PERFORMANCE FIX: Enhanced comparison function to prevent unnecessary re-renders
  const pokemonChanged = prevProps.allPokemon.length !== nextProps.allPokemon.length;
  const battleTypeChanged = prevProps.initialBattleType !== nextProps.initialBattleType;
  const generationChanged = prevProps.initialSelectedGeneration !== nextProps.initialSelectedGeneration;
  
  // Only re-render if meaningful props actually changed
  const shouldUpdate = pokemonChanged || battleTypeChanged || generationChanged;
  
  console.log("[DEBUG BattleContentContainer] Memo comparison:", {
    pokemonChanged,
    battleTypeChanged, 
    generationChanged,
    shouldUpdate
  });
  
  return !shouldUpdate;
});

BattleContentContainer.displayName = "BattleContentContainer";

export default BattleContentContainer;
