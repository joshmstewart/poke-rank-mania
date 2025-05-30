
import React from "react";
import { Button } from "@/components/ui/button";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { useRankings } from "@/hooks/battle/useRankings";

interface PokemonRankerDebugControlsProps {
  onManualSync: () => void;
}

export const PokemonRankerDebugControls: React.FC<PokemonRankerDebugControlsProps> = ({
  onManualSync
}) => {
  const { getAllRatings } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  const { finalRankings: battleModeRankings } = useRankings();

  return (
    <div className="flex flex-col items-center gap-2">
      <Button 
        onClick={onManualSync}
        variant="outline"
        className="bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200"
      >
        🔍 Debug: Manual Sync
      </Button>
      <div className="text-xs text-gray-600 text-center">
        Context: {pokemonLookupMap.size} | Ratings: {Object.keys(getAllRatings()).length} | 
        Battle Rankings: {battleModeRankings.length}
      </div>
    </div>
  );
};
