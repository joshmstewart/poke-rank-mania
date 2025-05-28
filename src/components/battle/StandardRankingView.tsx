
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import RankingHeader from "./RankingHeader";
import ShowMoreButton from "./ShowMoreButton";

interface StandardRankingViewProps {
  formattedRankings: (Pokemon | RankedPokemon)[];
  displayCount: number;
  battlesCompleted: number;
  rankingGenerated: boolean;
  onContinueBattles: () => void;
  onNewBattleSet: () => void;
  onSaveRankings: () => void;
  onShowMore: () => void;
}

const StandardRankingView: React.FC<StandardRankingViewProps> = ({
  formattedRankings,
  displayCount,
  battlesCompleted,
  rankingGenerated,
  onContinueBattles,
  onNewBattleSet,
  onSaveRankings,
  onShowMore
}) => {
  const displayRankings = formattedRankings.slice(0, displayCount);
  const hasRankedPokemon = formattedRankings.length > 0 && 'score' in formattedRankings[0];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <RankingHeader 
        title="Current Rankings"
        displayCount={displayCount}
        totalCount={formattedRankings.length}
        isMilestoneView={false}
        battlesCompleted={battlesCompleted}
        rankingGenerated={rankingGenerated}
        onContinueBattles={onContinueBattles}
        onNewBattleSet={onNewBattleSet}
        onSaveRankings={onSaveRankings}
      />

      {/* Standard grid for non-milestone view */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {displayRankings.map((pokemon, index) => (
          <div 
            key={pokemon.id}
            className="bg-white rounded-lg p-4 border border-gray-200 transition-all duration-200 hover:shadow-lg"
          >
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-700 mb-2">
                #{index + 1}
              </div>
              
              <div className="w-20 h-20 mx-auto mb-3 bg-gray-50 rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  src={pokemon.image} 
                  alt={pokemon.name}
                  className="w-16 h-16 object-contain"
                />
              </div>
              
              <h3 className="font-semibold text-gray-800 text-sm mb-1">
                {pokemon.name}
              </h3>
              
              <div className="text-xs text-gray-600 mb-2">
                {pokemon.types?.join(', ') || 'Unknown'}
              </div>
              
              {hasRankedPokemon && (
                <div className="text-xs text-gray-500">
                  Score: {Math.round((pokemon as RankedPokemon).score || 0)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {displayCount < formattedRankings.length && (
        <div className="text-center pt-4">
          <ShowMoreButton 
            onShowMore={onShowMore}
            displayCount={displayCount}
            totalCount={formattedRankings.length}
          />
        </div>
      )}
    </div>
  );
};

export default StandardRankingView;
