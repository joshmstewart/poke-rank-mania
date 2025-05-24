
import React, { useMemo, useRef } from "react";
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
  const lastPokemonLengthRef = useRef(0);
  
  // Stabilize battle type to prevent unnecessary re-mounts
  const safeBattleType: BattleType = useMemo(() => {
    return initialBattleType === "triplets" ? "triplets" : "pairs";
  }, [initialBattleType]);
  
  // CRITICAL PERFORMANCE FIX: Only create new reference when Pokemon count actually changes
  const stablePokemon = useMemo(() => {
    if (allPokemon.length !== lastPokemonLengthRef.current) {
      console.log(`[DEBUG BattleContentContainer] Pokemon length changed from ${lastPokemonLengthRef.current} to ${allPokemon.length} - creating new reference`);
      lastPokemonLengthRef.current = allPokemon.length;
      return allPokemon;
    }
    // Return the same reference if length hasn't changed
    return allPokemon;
  }, [allPokemon.length]);
  
  console.log("BattleContentContainer: Using battle type:", safeBattleType);
  
  // Only force battle check if we actually have new Pokemon data (reduced timeout for responsiveness)
  React.useEffect(() => {
    if (stablePokemon && stablePokemon.length > 0) {
      console.log("[DEBUG BattleContentContainer] Pokemon data available, dispatching battle check");
      
      const timer = setTimeout(() => {
        document.dispatchEvent(new CustomEvent("force-new-battle", {
          detail: { battleType: safeBattleType }
        }));
      }, 500); // Reduced from 1000ms to 500ms for better responsiveness
      
      return () => clearTimeout(timer);
    }
  }, [stablePokemon.length, safeBattleType]);

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-4">
      <BattleContent
        allPokemon={stablePokemon}
        initialBattleType={safeBattleType}
        initialSelectedGeneration={initialSelectedGeneration}
        setBattlesCompleted={setBattlesCompleted}
        setBattleResults={setBattleResults}
      />
    </div>
  );
});

BattleContentContainer.displayName = "BattleContentContainer";

export default BattleContentContainer;
