
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { getPokemonBackgroundColor } from "./utils/PokemonColorUtils";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";

interface PokemonCardContentProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending: boolean;
}

const PokemonCardContent: React.FC<PokemonCardContentProps> = ({ 
  pokemon, 
  index, 
  isPending 
}) => {
  const backgroundColorClass = getPokemonBackgroundColor(pokemon);

  const handleInfoButtonEvent = (e: React.SyntheticEvent) => {
    console.log(`🚨 [EVENT_FLOW_DEBUG] Info button event for ${pokemon.name} - STOPPING PROPAGATION`);
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <>
      {/* Info Button - CRITICAL: Must prevent drag events */}
      <div 
        className="absolute top-1 right-1 z-30 pointer-events-auto"
        onPointerDown={handleInfoButtonEvent}
        onMouseDown={handleInfoButtonEvent}
        onTouchStart={handleInfoButtonEvent}
        onClick={handleInfoButtonEvent}
      >
        <PokemonInfoModal pokemon={pokemon}>
          <button 
            className="w-5 h-5 rounded-full bg-white/30 hover:bg-white/50 border border-gray-300/60 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-medium shadow-sm transition-all duration-200 backdrop-blur-sm"
            onPointerDown={handleInfoButtonEvent}
            onMouseDown={handleInfoButtonEvent}
            onTouchStart={handleInfoButtonEvent}
            onClick={handleInfoButtonEvent}
          >
            i
          </button>
        </PokemonInfoModal>
      </div>

      {/* Ranking number - stays in same position regardless of pending state */}
      <div className="absolute top-2 left-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-sm border border-gray-200 pointer-events-none">
        <span className="text-black">{index + 1}</span>
      </div>
      
      {/* Pokemon image - stays in same position */}
      <div className="flex-1 flex justify-center items-center px-2 pb-1 pt-6 pointer-events-none">
        <img 
          src={pokemon.image} 
          alt={pokemon.name}
          className="w-20 h-20 object-contain pointer-events-none"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
      
      {/* Pokemon info - stays in same position */}
      <div className="bg-white text-center py-2 px-2 mt-auto border-t border-gray-100 pointer-events-none">
        <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1 pointer-events-none">
          {pokemon.name}
        </h3>
        <div className="text-xs text-gray-600 pointer-events-none">
          #{pokemon.id}
        </div>
      </div>
    </>
  );
};

export default PokemonCardContent;
