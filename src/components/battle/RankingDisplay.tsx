
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Pokemon } from "@/services/pokemon";
import PokemonCard from "@/components/PokemonCard";
import { Trophy, Award, Medal, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RankingDisplayProps {
  finalRankings: Pokemon[];
  battlesCompleted: number;
  onContinueBattles: () => void;
  onNewBattleSet: () => void;
  rankingGenerated: boolean;
  onSaveRankings: () => void;
}

const RankingDisplay: React.FC<RankingDisplayProps> = ({
  finalRankings,
  battlesCompleted,
  onContinueBattles,
  onNewBattleSet,
  rankingGenerated,
  onSaveRankings
}) => {
  console.log("RankingDisplay rendering with finalRankings:", finalRankings?.length || 0);
  console.log("RankingDisplay first ranked pokemon:", finalRankings?.[0]?.name || "None");

  // Debug effect to log when rankings change
  useEffect(() => {
    console.log("RankingDisplay finalRankings changed:", finalRankings?.length || 0);
  }, [finalRankings]);
  
  // Define trophy icons and colors for the top 3
  const trophyIcons = [
    { icon: Trophy, color: "text-yellow-400" },
    { icon: Award, color: "text-gray-400" },
    { icon: Medal, color: "text-amber-600" }
  ];
  
  // Check if we have meaningful rankings to display
  const hasValidRankings = finalRankings && finalRankings.length > 0;
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            {rankingGenerated ? "Current Rankings" : "Milestone Progress"}
          </h2>
          <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
            {battlesCompleted} battles completed
          </span>
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mt-2"></div>
      </div>
      
      {!hasValidRankings ? (
        <div className="text-center p-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-lg text-gray-500 font-medium">Building your rankings...</p>
          <p className="text-gray-400 mt-2">
            You've completed {battlesCompleted} battles. Continue battling to see rankings.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top 3 section with larger cards and special styling */}
          {finalRankings.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {finalRankings.slice(0, Math.min(3, finalRankings.length)).map((pokemon, index) => {
                const TrophyIcon = trophyIcons[index].icon;
                return (
                  <div key={pokemon.id} className="flex flex-col items-center">
                    <div className={`${trophyIcons[index].color} mb-2 flex flex-col items-center`}>
                      <TrophyIcon className="h-8 w-8" />
                      <div className="text-xl font-bold mt-1">#{index + 1}</div>
                    </div>
                    <div className="w-full transform hover:scale-105 transition-transform duration-200">
                      <div className="w-full h-full">
                        <PokemonCard pokemon={pokemon} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Remaining rankings - simplified with just images and ranks */}
          {finalRankings.length > 3 && (
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Other Rankings</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {finalRankings.slice(3).map((pokemon, index) => (
                  <TooltipProvider key={pokemon.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative group overflow-hidden rounded-lg bg-gray-50 hover:shadow-lg transition-all duration-200">
                          <div className="absolute top-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-br z-10">
                            #{index + 4}
                          </div>
                          <div className="p-2">
                            <img 
                              src={pokemon.image} 
                              alt={pokemon.name} 
                              className="w-full h-24 object-contain mx-auto" 
                              loading="lazy"
                            />
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="p-3 max-w-xs bg-white shadow-xl border rounded-lg">
                        <div className="flex items-center gap-3">
                          <img 
                            src={pokemon.image} 
                            alt={pokemon.name} 
                            className="w-10 h-10 object-contain" 
                          />
                          <div>
                            <div className="font-medium">{pokemon.name}</div>
                            <div className="text-xs text-gray-500">#{pokemon.id}</div>
                            {pokemon.types && (
                              <div className="flex gap-1 mt-1">
                                {pokemon.types.map(type => (
                                  <span key={type} className="px-1.5 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full">
                                    {type}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
        >
          Continue Battles
        </Button>
        {rankingGenerated && (
          <Button 
            variant="outline" 
            size="lg" 
            onClick={onNewBattleSet}
            className="border-2 border-indigo-500/30 text-indigo-700 hover:bg-indigo-50"
          >
            Start New Battle Set
          </Button>
        )}
        
        {/* Save Rankings Button */}
        {hasValidRankings && (
          <Button
            variant="outline"
            size="lg"
            onClick={onSaveRankings}
            className="border-2 border-green-500/30 text-green-700 hover:bg-green-50"
          >
            Save Rankings
          </Button>
        )}
      </div>
    </div>
  );
};

export default RankingDisplay;
