
import React from "react";
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

const BattleContentContainer: React.FC<BattleContentContainerProps> = ({
  allPokemon = [], // CRITICAL FIX: Ensure allPokemon is never undefined
  initialBattleType,
  initialSelectedGeneration = 0,
  setBattlesCompleted,
  setBattleResults
}) => {
  // ADDED: Log to verify allPokemon in container is never undefined
  console.log("[DEBUG BattleContentContainer] allPokemon is array:", Array.isArray(allPokemon), "length:", allPokemon?.length || 0);
  
  // ADDED: Ensure we always have a valid battle type with "pairs" as default
  const safeBattleType: BattleType = initialBattleType === "triplets" ? "triplets" : "pairs";
  
  // Log the initial battle type for debugging
  console.log("BattleContentContainer: Using initial battle type:", safeBattleType);
  
  // NEW: Force battle initialization by dispatching an event after component mounts
  React.useEffect(() => {
    if (allPokemon && allPokemon.length > 0) {
      console.log("[DEBUG BattleContentContainer] Component mounted with allPokemon, scheduling battle check");
      
      const timer = setTimeout(() => {
        console.log("[DEBUG BattleContentContainer] Checking if battle needs to be forced");
        document.dispatchEvent(new CustomEvent("force-new-battle", {
          detail: { battleType: safeBattleType }
        }));
      }, 2000); // Wait 2 seconds after mounting to check
      
      return () => clearTimeout(timer);
    }
  }, [allPokemon, safeBattleType]);

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-4">
      <BattleContent
        allPokemon={allPokemon || []} // CRITICAL FIX: Ensure allPokemon is never undefined
        initialBattleType={safeBattleType}
        initialSelectedGeneration={initialSelectedGeneration}
        setBattlesCompleted={setBattlesCompleted}
        setBattleResults={setBattleResults}
      />
    </div>
  );
};

export default BattleContentContainer;
