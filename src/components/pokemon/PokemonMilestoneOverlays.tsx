
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

interface PokemonMilestoneOverlaysProps {
  context: 'available' | 'ranked';
  isRankedPokemon: boolean;
  currentRank: number | null;
  isPending: boolean;
  showRank: boolean;
  index: number;
  isDragging: boolean;
}

const PokemonMilestoneOverlays: React.FC<PokemonMilestoneOverlaysProps> = ({
  context,
  isRankedPokemon,
  currentRank,
  isPending,
  showRank,
  index,
  isDragging
}) => {
  return (
    <>
      {/* Enhanced drag overlay for better visual feedback */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-100 bg-opacity-30 rounded-lg pointer-events-none"></div>
      )}

      {/* Dark overlay for already-ranked Pokemon in available section */}
      {context === 'available' && isRankedPokemon && (
        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg z-10"></div>
      )}

      {/* Pending banner if needed */}
      {isPending && (
        <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white text-xs py-1 px-2 z-20">
          Pending Battle
        </div>
      )}

      {/* Crown badge for ranked Pokemon in available section */}
      {context === 'available' && isRankedPokemon && currentRank && (
        <div className="absolute top-2 left-2 z-20">
          <Badge 
            variant="secondary" 
            className="bg-yellow-500 text-white font-bold text-xs px-2 py-1 shadow-md flex items-center gap-1"
          >
            <Crown size={12} />
            #{String(currentRank)}
          </Badge>
        </div>
      )}

      {/* Ranking number - white circle with black text in top left if showRank */}
      {context === 'ranked' && showRank && (
        <div className={`absolute top-2 left-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-sm border border-gray-200 ${
          isDragging ? 'bg-blue-100 border-blue-300' : ''
        }`}>
          <span className="text-black">{index + 1}</span>
        </div>
      )}
    </>
  );
};

export default PokemonMilestoneOverlays;
