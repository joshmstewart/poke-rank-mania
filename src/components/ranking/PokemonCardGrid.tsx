
import React from "react";
import { Badge } from "@/components/ui/badge";
import { normalizePokedexNumber } from "@/utils/pokemon";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";

interface PokemonCardGridProps {
  pokemonList: any[];
  title: string;
  droppableId?: string;
  isRankingArea?: boolean;
}

const typeColors: Record<string, string> = {
  Normal: "bg-gray-400", Fire: "bg-red-500", Water: "bg-blue-500", Electric: "bg-yellow-400",
  Grass: "bg-green-500", Ice: "bg-blue-200", Fighting: "bg-red-700", Poison: "bg-purple-600",
  Ground: "bg-yellow-700", Flying: "bg-indigo-300", Psychic: "bg-pink-500", Bug: "bg-lime-500",
  Rock: "bg-stone-500", Ghost: "bg-purple-700", Dragon: "bg-indigo-600", Dark: "bg-stone-800 text-white",
  Steel: "bg-slate-400", Fairy: "bg-pink-300",
};

export const PokemonCardGrid: React.FC<PokemonCardGridProps> = ({
  pokemonList,
  title,
  isRankingArea = false
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>

      {/* Content */}
      <div className="p-4">
        {pokemonList.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">
              {isRankingArea 
                ? "No ranked Pokémon yet. Complete some battles in Battle Mode to see rankings here."
                : "No available Pokémon to display."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {pokemonList.map((pokemon, index) => (
              <PokemonCard 
                key={pokemon.id} 
                pokemon={pokemon} 
                index={index} 
                isRankingArea={isRankingArea}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface PokemonCardProps {
  pokemon: any;
  index: number;
  isRankingArea: boolean;
}

const PokemonCard: React.FC<PokemonCardProps> = ({ pokemon, index, isRankingArea }) => {
  const normalizedId = normalizePokedexNumber(pokemon.id);
  const isRankedPokemon = 'score' in pokemon;

  return (
    <div className="relative group">
      {/* Info Button */}
      <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <PokemonInfoModal pokemon={pokemon}>
          <button className="w-5 h-5 rounded-full bg-white/90 hover:bg-white border border-gray-300 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-medium shadow-sm transition-all duration-200">
            i
          </button>
        </PokemonInfoModal>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 overflow-hidden">
        {/* Rank Badge (for ranking area) */}
        {isRankingArea && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center py-1.5">
            <span className="text-sm font-bold">#{index + 1}</span>
          </div>
        )}

        {/* Pokemon Image */}
        <div className="aspect-square bg-gray-50 p-3 flex items-center justify-center">
          <img
            src={pokemon.image}
            alt={pokemon.name}
            className="w-full h-full object-contain max-w-16 max-h-16"
            loading="lazy"
          />
        </div>

        {/* Pokemon Info */}
        <div className="p-3 space-y-2">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-800 line-clamp-1">
              {pokemon.name}
            </h3>
            <p className="text-xs text-gray-500">#{normalizedId}</p>
          </div>

          {/* Types */}
          {pokemon.types && pokemon.types.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-center">
              {pokemon.types.slice(0, 2).map((type: string) => (
                <Badge 
                  key={type} 
                  className={`${typeColors[type]} text-white text-xs px-2 py-0.5 h-auto`}
                >
                  {type}
                </Badge>
              ))}
            </div>
          )}

          {/* Score for ranked Pokemon */}
          {isRankedPokemon && 'score' in pokemon && (
            <div className="text-center">
              <p className="text-xs text-gray-600">
                Score: <span className="font-medium">{pokemon.score.toFixed(1)}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
