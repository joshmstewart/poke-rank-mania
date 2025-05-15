
import React from "react";
import { Button } from "@/components/ui/button";
import { Pokemon } from "@/services/pokemon";
import PokemonCard from "@/components/PokemonCard";

interface RankingDisplayProps {
  finalRankings: Pokemon[];
  battlesCompleted: number;
  onContinueBattles: () => void;
  onNewBattleSet: () => void;
  rankingGenerated: boolean;
}

const RankingDisplay: React.FC<RankingDisplayProps> = ({
  finalRankings,
  battlesCompleted,
  onContinueBattles,
  onNewBattleSet,
  rankingGenerated
}) => {
  console.log("RankingDisplay rendering with finalRankings:", finalRankings.length);
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {rankingGenerated ? "Final Rankings" : "Current Rankings"}
          </h2>
          <span className="text-sm text-gray-500">
            After {battlesCompleted} battles
          </span>
        </div>
      </div>
      
      {finalRankings.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-lg text-gray-500">No ranked Pokémon yet.</p>
          <p className="text-gray-400">Complete more battles to start ranking Pokémon.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top 3 section with larger cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {finalRankings.slice(0, 3).map((pokemon, index) => (
              <div key={pokemon.id} className="flex flex-col items-center">
                <div className="text-2xl font-bold mb-2">#{index + 1}</div>
                <div className="w-full">
                  <PokemonCard pokemon={pokemon} />
                </div>
              </div>
            ))}
          </div>
          
          {/* Remaining rankings */}
          {finalRankings.length > 3 && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Other Rankings</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {finalRankings.slice(3).map((pokemon, index) => (
                  <div key={pokemon.id} className="relative">
                    <div className="absolute top-0 left-0 bg-primary text-white text-xs px-2 py-1 rounded-br z-10">
                      #{index + 4}
                    </div>
                    <PokemonCard pokemon={pokemon} compact={true} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
        <Button 
          variant="default" 
          size="lg" 
          onClick={onContinueBattles}
        >
          Continue Battles
        </Button>
        {rankingGenerated && (
          <Button 
            variant="outline" 
            size="lg" 
            onClick={onNewBattleSet}
          >
            Start New Battle Set
          </Button>
        )}
      </div>
    </div>
  );
};

export default RankingDisplay;
