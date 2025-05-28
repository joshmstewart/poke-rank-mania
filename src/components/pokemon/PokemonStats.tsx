
import React from "react";
import { Pokemon } from "@/services/pokemon";

interface PokemonStatsProps {
  pokemon: Pokemon;
}

const PokemonStats: React.FC<PokemonStatsProps> = ({ pokemon }) => {
  const statNames: Record<string, string> = {
    hp: "HP",
    attack: "Attack", 
    defense: "Defense",
    "special-attack": "Sp. Atk",
    "special-defense": "Sp. Def",
    speed: "Speed"
  };

  if (!pokemon.stats || Object.keys(pokemon.stats).length === 0) {
    return null;
  }

  return (
    <div className="bg-green-600 border-4 border-green-800 rounded overflow-hidden">
      <div className="bg-green-700 text-white text-center py-2 font-bold text-lg">
        STATS
      </div>
      <div className="bg-gray-300 p-4 space-y-2">
        {Object.entries(pokemon.stats).map(([stat, value]) => {
          const displayName = statNames[stat] || stat.replace('-', ' ');
          const maxStat = 255;
          const percentage = Math.min((value / maxStat) * 100, 100);
          
          return (
            <div key={stat} className="flex items-center justify-between">
              <span className="font-bold text-sm w-20">{displayName}</span>
              <div className="flex items-center gap-2 flex-1">
                <div className="flex-1 bg-white border border-gray-400 h-4 rounded overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      value >= 100 ? 'bg-orange-500' : 
                      value >= 80 ? 'bg-yellow-500' : 
                      value >= 60 ? 'bg-blue-500' : 'bg-gray-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="font-mono text-sm w-8 text-right">{value}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PokemonStats;
