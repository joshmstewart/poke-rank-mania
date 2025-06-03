
import React from 'react';
import { GlobalRankedPokemon } from '@/hooks/useGlobalRankings';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Trophy, Star } from 'lucide-react';

interface GlobalRankingCardProps {
  pokemon: GlobalRankedPokemon;
}

export const GlobalRankingCard: React.FC<GlobalRankingCardProps> = ({ pokemon }) => {
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (rank <= 3) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (rank <= 10) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getScoreColor = (score: number) => {
    if (score >= 40) return 'text-green-600';
    if (score >= 30) return 'text-yellow-600';
    if (score >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 relative overflow-hidden">
      {/* Global Rank Badge */}
      <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold border ${getRankColor(pokemon.globalRank)}`}>
        <Trophy className="h-3 w-3 inline mr-1" />
        #{pokemon.globalRank}
      </div>

      <CardContent className="p-4 pt-12">
        {/* Pokemon Image */}
        <div className="flex justify-center mb-3">
          <img
            src={pokemon.image}
            alt={pokemon.name}
            className="w-16 h-16 object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemonId}.png`;
            }}
          />
        </div>

        {/* Pokemon Name */}
        <h3 className="text-sm font-semibold text-center text-gray-900 mb-2 truncate">
          {pokemon.name}
        </h3>

        {/* Types */}
        <div className="flex justify-center gap-1 mb-3">
          {pokemon.types.map((type) => (
            <Badge key={type} variant="secondary" className="text-xs px-2 py-0.5">
              {type}
            </Badge>
          ))}
        </div>

        {/* Stats */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Avg. Score:</span>
            <span className={`font-semibold ${getScoreColor(pokemon.averageScore)}`}>
              {pokemon.averageScore.toFixed(1)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 flex items-center gap-1">
              <Users className="h-3 w-3" />
              Ranked by:
            </span>
            <span className="font-semibold text-blue-600">
              {pokemon.usersRankedCount} users
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 flex items-center gap-1">
              <Star className="h-3 w-3" />
              Generation:
            </span>
            <span className="font-semibold text-purple-600">
              {pokemon.generationId}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
