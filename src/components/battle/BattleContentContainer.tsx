
import React, { useMemo } from "react";
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
  
  // Stabilize battle type to prevent unnecessary re-mounts
  const safeBattleType: BattleType = useMemo(() => {
    return initialBattleType === "triplets" ? "triplets" : "pairs";
  }, [initialBattleType]);
  
  // Stabilize Pokemon array reference to prevent re-mounts when length hasn't changed
  const stablePokemon = useMemo(() => allPokemon, [allPokemon.length]);
  
  console.log("BattleContentContainer: Using battle type:", safeBattleType);
  
  // Only force battle check if we actually have new Pokemon data
  React.useEffect(() => {
    if (stablePokemon && stablePokemon.length > 0) {
      console.log("[DEBUG BattleContentContainer] Pokemon data available, dispatching battle check");
      
      const timer = setTimeout(() => {
        document.dispatchEvent(new CustomEvent("force-new-battle", {
          detail: { battleType: safeBattleType }
        }));
      }, 1000); // Reduced from 2000ms to 1000ms
      
      return () => clearTimeout(timer);
    }
  }, [stablePokemon.length, safeBattleType]); // Only depend on length, not the entire array

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
