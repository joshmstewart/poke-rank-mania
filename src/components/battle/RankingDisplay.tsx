
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Award, CheckCircle } from "lucide-react";
import { Pokemon } from "@/services/pokemon";

interface RankingDisplayProps {
  finalRankings: Pokemon[];
  battlesCompleted: number;
  rankingGenerated: boolean;
  onNewBattleSet: () => void;
  onContinueBattles: () => void;
  onSaveRankings: () => void;
}

const RankingDisplay: React.FC<RankingDisplayProps> = ({
  finalRankings,
  battlesCompleted,
  rankingGenerated,
  onNewBattleSet,
  onContinueBattles,
  onSaveRankings
}) => {
  // Show all ranked Pokemon without limiting them
  const displayRankings = finalRankings;
  
  const renderRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-lg font-bold">{rank}</span>;
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold">
          {rankingGenerated ? "Your Final Ranking" : "Milestone Reached!"}
        </h2>
        <p className="mb-2 text-gray-600">
          Based on your {battlesCompleted} battle choices, here's your{rankingGenerated ? " final" : " current"} ranking of Pokémon.
          {displayRankings.length === 0 && (
            <span className="block text-orange-500 mt-2">
              No Pokémon have been ranked yet. Continue battling to see rankings.
            </span>
          )}
        </p>
        
        {rankingGenerated && (
          <div className="flex items-center justify-center mt-2 text-green-600 font-semibold">
            <CheckCircle className="mr-2 h-5 w-5" />
            <span>Complete ranking achieved!</span>
          </div>
        )}
      </div>
      
      {/* Grid display for rankings */}
      {displayRankings.length > 0 ? (
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {displayRankings.map((pokemon, index) => (
            <Card key={pokemon.id} className={`flex items-center p-2 ${index < 3 ? 'border-2 ' + (index === 0 ? 'border-yellow-400' : index === 1 ? 'border-gray-300' : 'border-amber-600') : ''}`}>
              <div className="flex-shrink-0 mr-2 flex items-center justify-center w-8">
                {renderRankBadge(index + 1)}
              </div>
              <div className="flex-shrink-0 w-12 h-12">
                <img 
                  src={pokemon.image} 
                  alt={pokemon.name} 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div className="ml-2 overflow-hidden">
                <h3 className="font-bold text-sm truncate">{pokemon.name}</h3>
                <p className="text-xs text-gray-500">#{pokemon.id}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No Pokémon have been ranked yet.</p>
          <p className="mt-2 text-gray-500">Continue battling to see your rankings!</p>
        </div>
      )}
      
      <div className="flex justify-center gap-4 mt-6">
        {rankingGenerated ? (
          <>
            <Button variant="outline" onClick={onNewBattleSet}>
              Start New Battle Set
            </Button>
            <Button onClick={onSaveRankings}>
              Save This Ranking
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onNewBattleSet}>
              Restart Battles
            </Button>
            <Button onClick={onContinueBattles}>
              Continue Battling
            </Button>
            <Button variant="secondary" onClick={onSaveRankings}>
              Save Current Ranking
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default RankingDisplay;
