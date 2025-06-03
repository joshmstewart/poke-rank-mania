
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface GlobalRanking {
  pokemonId: number;
  name: string;
  image: string;
  generationId: number;
  types: string[];
  globalRank: number;
  averageScore: number;
  usersRankedCount: number;
}

interface MilestoneStyleGlobalCardProps {
  ranking: GlobalRanking;
}

const MilestoneStyleGlobalCard: React.FC<MilestoneStyleGlobalCardProps> = ({ ranking }) => {
  // Format Pokemon ID with leading zeros
  const formattedId = ranking.pokemonId.toString().padStart(ranking.pokemonId >= 10000 ? 5 : 3, '0');

  return (
    <div className="bg-blue-50 rounded-lg border border-gray-200 relative overflow-hidden h-35 flex flex-col hover:shadow-lg transition-all duration-200">
      {/* Global rank number - white circle with black text in top left */}
      <div className="absolute top-2 left-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-sm border border-gray-200">
        <span className="text-black">{ranking.globalRank}</span>
      </div>

      {/* Users count badge */}
      <div className="absolute top-2 right-2 z-10">
        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
          {ranking.usersRankedCount} users
        </Badge>
      </div>
      
      {/* Pokemon image */}
      <div className="flex-1 flex justify-center items-center px-2 pt-6 pb-1">
        <img 
          src={ranking.image} 
          alt={ranking.name}
          className="w-20 h-20 object-contain"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
      
      {/* Pokemon info - white section at bottom */}
      <div className="bg-white text-center py-1.5 px-2 mt-auto border-t border-gray-100">
        <h3 className="font-bold text-gray-800 text-sm leading-tight mb-0.5">
          Pokemon {ranking.pokemonId}
        </h3>
        <div className="text-xs text-gray-600 mb-1">
          #{formattedId}
        </div>
        
        {/* Score display */}
        <div className="text-xs text-blue-700 font-medium">
          Score: {ranking.averageScore.toFixed(1)}
        </div>
      </div>
    </div>
  );
};

export default MilestoneStyleGlobalCard;
