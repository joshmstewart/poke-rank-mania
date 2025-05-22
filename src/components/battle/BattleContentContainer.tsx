
import React from "react";
import BattleContent from "./BattleContent";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface BattleContentContainerProps {
  allPokemon: Pokemon[];
  initialBattleType?: BattleType;
  initialSelectedGeneration?: number;
}

const BattleContentContainer: React.FC<BattleContentContainerProps> = ({
  allPokemon,
  initialBattleType = "pairs",
  initialSelectedGeneration = 0
}) => {
  // Safety check - if no Pokemon are available, show an error state
  if (!allPokemon || allPokemon.length === 0) {
    return (
      <div className="flex flex-col w-full max-w-4xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">No Pokémon Available</h2>
          <p className="mb-6 text-gray-600">
            We couldn't load any Pokémon data. This could be due to network issues or server problems.
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-4">
      <BattleContent
        allPokemon={allPokemon}
        initialBattleType={initialBattleType}
        initialSelectedGeneration={initialSelectedGeneration}
      />
    </div>
  );
};

export default BattleContentContainer;
