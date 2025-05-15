
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pokemon } from "@/services/pokemonService";

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
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">
        {rankingGenerated ? "Your Final Ranking" : "Milestone Reached!"}
      </h2>
      <p className="mb-8 text-gray-600">
        Based on your {battlesCompleted} battle choices, here's your{rankingGenerated ? " final" : " current"} ranking of Pokémon.
      </p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {finalRankings.slice(0, 10).map((pokemon, index) => (
          <Card key={pokemon.id} className="flex items-center p-4">
            <div className="flex-shrink-0 mr-4">
              <span className="text-2xl font-bold">{index + 1}</span>
            </div>
            <div className="flex-shrink-0 w-16 h-16">
              <img 
                src={pokemon.image} 
                alt={pokemon.name} 
                className="w-full h-full object-contain" 
              />
            </div>
            <div className="ml-4">
              <h3 className="font-bold">{pokemon.name}</h3>
              <p className="text-sm text-gray-500">#{pokemon.id}</p>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-center gap-4 mt-8">
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
